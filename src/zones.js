// Restricted-zone layers (from the KMZ files in data-src/kmz, converted by tools/kmz_to_geojson.py)
// and the on-site check: is the site inside any zone, and how far is the nearest one?
// The check runs in the browser on the real layer geometry, so the numbers on screen are computed, not typed.
import { SITE } from './data.js';
import { t, LANG } from './i18n.js';

export const ZONE_LAYERS = [
  { id: 'water', label: 'Water protection zones (SMQZ)', icon: 'waves' },
  { id: 'forest', label: 'State forestry lands', icon: 'trees' },
  { id: 'reservoir', label: 'Reservoirs', icon: 'droplets' },
  { id: 'groundwater', label: 'Drinking groundwater deposits', icon: 'layers' },
];

export const zoneUrl = (id) => new URL(`${import.meta.env.BASE_URL}data/zones/${id}.geojson`, window.location.href).href;

// Local metric plane around the site (equirectangular; error well under 1% at these distances).
const KX = 111320 * Math.cos((SITE[1] * Math.PI) / 180);
const KY = 111320;
const toXY = ([lng, lat]) => [(lng - SITE[0]) * KX, (lat - SITE[1]) * KY];
const toLL = ([x, y]) => [SITE[0] + x / KX, SITE[1] + y / KY];

// Nearest point to the origin (the site) on segment a-b, in the local plane.
function nearestOnSeg(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = dx * dx + dy * dy;
  const tt = L ? Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / L)) : 0;
  return [a[0] + tt * dx, a[1] + tt * dy];
}

// Ray casting with the site at the origin.
function inRing(ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > 0) !== (yj > 0) && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function checkLayer(fc) {
  let best = { d: Infinity, at: null, props: null };
  const inside = [];
  const consider = (p, props) => {
    const d = Math.hypot(p[0], p[1]);
    if (d < best.d) best = { d, at: p, props };
  };
  const lines = (pts, props) => {
    for (let i = 1; i < pts.length; i++) consider(nearestOnSeg(pts[i - 1], pts[i]), props);
  };
  for (const f of fc.features) {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const poly of polys) {
      const rings = poly.map((r) => r.map(toXY));
      if (inRing(rings[0]) && !rings.slice(1).some(inRing)) inside.push(f.properties);
      rings.forEach((r) => lines(r, f.properties));
    }
    if (g.type === 'LineString') lines(g.coordinates.map(toXY), f.properties);
    if (g.type === 'Point') consider(toXY(g.coordinates), f.properties);
  }
  return {
    inside,
    distance: inside.length ? 0 : best.d,
    nearest: best.props,
    nearestAt: best.at ? toLL(best.at) : null,
    count: fc.features.length,
  };
}

// One load for the whole deck: the card blocks and the map both read this promise.
export const ZONES = Promise.all(
  ZONE_LAYERS.map((l) =>
    fetch(zoneUrl(l.id))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((fc) => ({ ...l, ...checkLayer(fc) }))
      .catch((e) => ({ ...l, error: String(e) })),
  ),
).then((layers) => {
  const ok = layers.filter((l) => !l.error);
  const near = ok.filter((l) => l.nearestAt).sort((a, b) => a.distance - b.distance)[0] || null;
  return { layers, nearest: near, insideAny: ok.some((l) => l.inside.length), complete: ok.length === layers.length };
});

const nf = (d) => new Intl.NumberFormat(LANG === 'en' ? 'en-GB' : LANG === 'ru' ? 'ru-RU' : 'uz-Latn-UZ', { maximumFractionDigits: d, minimumFractionDigits: d });
export function fmtDistance(m) {
  if (!Number.isFinite(m)) return '—';
  if (m < 1000) return `${nf(0).format(Math.round(m / 10) * 10)} ${t('m')}`;
  return `${nf(m < 20000 ? 1 : 0).format(m / 1000)} ${t('km')}`;
}
export const zoneName = (props) => (props?.name || '').replace(/\s+/g, ' ').trim();
