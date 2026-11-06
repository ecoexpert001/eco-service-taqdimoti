"""Convert the restricted-zone KMZ layers (data-src/kmz) into light GeoJSON for the map (public/data/zones).

Run from the eco-service folder after replacing or adding a KMZ:
    python tools/kmz_to_geojson.py

Each output feature keeps its name and a few attributes; polygons and lines are simplified
(Douglas-Peucker, about 8 m) and rounded to 5 decimals (about 1 m), so the 43 MB SMQZ layer
stays small enough to load in the browser. Only the Python standard library is used.
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data-src' / 'kmz'
OUT = ROOT / 'public' / 'data' / 'zones'
TOL = 0.00008  # degrees, about 8 m

# key: output file id; match: substring of the KMZ file name; keep: description fields to carry over.
LAYERS = [
    {'id': 'water', 'match': 'СМҚЗ', 'keep': {'suv_muh_zo': 'width_m', 'urnashgan_': 'place', 'sana': 'decision'}},
    {'id': 'forest', 'match': 'Ўрмон', 'keep': {'viloyat': 'region', 'tuman': 'district', 'legal_area': 'area_ha', 'cadastral_': 'cadastre'}},
    {'id': 'reservoir', 'match': 'ВОДОХРАНИЛИЩА', 'keep': {}},
    {'id': 'groundwater', 'match': 'Месторождение', 'keep': {}},
]

K = '{http://www.opengis.net/kml/2.2}'


def coords(text):
    pts = []
    for tok in (text or '').split():
        p = tok.split(',')
        if len(p) >= 2:
            pts.append([float(p[0]), float(p[1])])
    return pts


def perp(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == dy == 0:
        return ((x - x1) ** 2 + (y - y1) ** 2) ** 0.5
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return ((x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2) ** 0.5


def simplify(pts, tol=TOL):
    """Iterative Douglas-Peucker (recursion would overflow on rings with 100k points)."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        best, idx = 0, -1
        for k in range(i + 1, j):
            d = perp(pts[k], pts[i], pts[j])
            if d > best:
                best, idx = d, k
        if best > tol:
            keep[idx] = True
            stack += [(i, idx), (idx, j)]
    return [p for p, k in zip(pts, keep) if k]


def rnd(pts):
    return [[round(x, 5), round(y, 5)] for x, y in pts]


def ring(el):
    pts = rnd(simplify(coords(el.findtext(f'{K}coordinates'))))
    if len(pts) >= 3 and pts[0] != pts[-1]:
        pts.append(pts[0])
    return pts if len(pts) >= 4 else None


def fields(desc):
    cells = [re.sub(r'<[^>]+>', '', c).strip() for c in re.findall(r'<td>([\s\S]*?)</td>', desc or '')]
    return {cells[i]: cells[i + 1] for i in range(1, len(cells) - 1, 2)}


def convert(path, layer):
    with zipfile.ZipFile(path) as z:
        kml = next(n for n in z.namelist() if n.lower().endswith('.kml'))
        text = z.read(kml).decode('utf-8', 'replace')
    # Some exports use xsi:/gx:/atom: prefixes without declaring them; declare them on <kml>.
    for pfx, uri in (('xsi', 'http://www.w3.org/2001/XMLSchema-instance'), ('gx', 'http://www.google.com/kml/ext/2.2'), ('atom', 'http://www.w3.org/2005/Atom'), ('xal', 'urn:oasis:names:tc:ciq:xsdschema:xAL:2.0'), ('kml', 'http://www.opengis.net/kml/2.2')):
        if f'xmlns:{pfx}=' not in text[:3000]:
            text = re.sub(r'<kml\b', f'<kml xmlns:{pfx}="{uri}"', text, count=1)
    if 'xmlns="http://www.opengis.net/kml/2.2"' not in text[:3000]:
        text = re.sub(r'<kml\b', '<kml xmlns="http://www.opengis.net/kml/2.2"', text, count=1)
    tree = ET.fromstring(text.encode('utf-8'))
    feats = []
    for pm in tree.iter(f'{K}Placemark'):
        name = (pm.findtext(f'{K}name') or '').strip()
        f = fields(pm.findtext(f'{K}description'))
        props = {'name': name, **{out: f[src] for src, out in layer['keep'].items() if f.get(src)}}
        polys, lines, points = [], [], []
        for pg in pm.iter(f'{K}Polygon'):
            outer = pg.find(f'{K}outerBoundaryIs/{K}LinearRing')
            r0 = ring(outer) if outer is not None else None
            if not r0:
                continue
            holes = [r for r in (ring(h) for h in pg.findall(f'{K}innerBoundaryIs/{K}LinearRing')) if r]
            polys.append([r0, *holes])
        for ls in pm.iter(f'{K}LineString'):
            pts = rnd(simplify(coords(ls.findtext(f'{K}coordinates'))))
            if len(pts) >= 2:
                lines.append(pts)
        for pt in pm.iter(f'{K}Point'):
            pts = coords(pt.findtext(f'{K}coordinates'))
            if pts:
                points.append(rnd(pts)[0])
        if polys:
            geom = {'type': 'Polygon', 'coordinates': polys[0]} if len(polys) == 1 else {'type': 'MultiPolygon', 'coordinates': polys}
            feats.append({'type': 'Feature', 'properties': props, 'geometry': geom})
        for l in lines:
            feats.append({'type': 'Feature', 'properties': props, 'geometry': {'type': 'LineString', 'coordinates': l}})
        for p in points:
            feats.append({'type': 'Feature', 'properties': props, 'geometry': {'type': 'Point', 'coordinates': p}})
    return {'type': 'FeatureCollection', 'source': path.name, 'features': feats}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob('*.kmz'))
    for layer in LAYERS:
        src = next((f for f in files if layer['match'] in f.name), None)
        if not src:
            print(f'skip {layer["id"]}: no KMZ matching {layer["match"]!r}', file=sys.stderr)
            continue
        fc = convert(src, layer)
        dest = OUT / f'{layer["id"]}.geojson'
        dest.write_text(json.dumps(fc, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        kinds = {}
        for f in fc['features']:
            kinds[f['geometry']['type']] = kinds.get(f['geometry']['type'], 0) + 1
        print(f'{layer["id"]:<12} {src.name} -> {dest.name}  {kinds}  {dest.stat().st_size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
