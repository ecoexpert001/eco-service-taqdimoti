// The map stage: one MapLibre globe that every step re-aims.
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { gsap } from 'gsap';
import { APP_NO, CRITERIA, SITE, SITE_COORDS, TASHKENT, offset } from './data.js';
import { icon } from './icons.js';
import { t, getTheme, onTheme } from './i18n.js';
import { ZONES, ZONE_LAYERS, zoneUrl, fmtDistance, zoneName } from './zones.js';

maplibregl.setWorkerUrl(workerUrl);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?still freezes the ambient sway (used for review captures).
const STILL = new URLSearchParams(window.location.search).has('still');
const abs = (p) => new URL(`${import.meta.env.BASE_URL}${p}`, window.location.href).href;
// One palette per theme. Dark: night earth. Light: a pale veil over the same imagery.
const PAL = {
  dark: {
    ground: '#05080c', sky: '#05080c', horizon: '#0e3946', fog: '#05080c', mask: '#010305',
    world: '#8fb3c2', nb: '#9dbdca', cyan: '#22b8d0', hi: '#62d7ea', leaf: '#96c962', siteLine: '#f2fbfd',
    sat: -0.34, satDim: -0.6, bright: 0.8,
    zone: { water: '#4aa8ff', forest: '#4fd08a', reservoir: '#36d1e8', groundwater: '#b28cff' }, link: '#f2fbfd',
  },
  light: {
    ground: '#e8eef1', sky: '#d9e6ed', horizon: '#a7d1de', fog: '#e8eef1', mask: '#f3f6f8',
    world: '#5b7784', nb: '#4f6e7b', cyan: '#22b8d0', hi: '#0b8ea6', leaf: '#4f8a2a', siteLine: '#ffffff',
    sat: -0.12, satDim: -0.32, bright: 1,
    zone: { water: '#1f6fd1', forest: '#23864f', reservoir: '#0a87a0', groundwater: '#7a4fd0' }, link: '#0c1a22',
  },
};
let COL = PAL[getTheme()];
const skyOf = (c) => ({
  'sky-color': c.sky,
  'horizon-color': c.horizon,
  'fog-color': c.fog,
  'fog-ground-blend': 0.8,
  'horizon-fog-blend': 0.6,
  'sky-horizon-blend': 0.75,
  'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.9, 5, 0.6, 8, 0],
});

const ll = ([lat, lng]) => [lng, lat];
const SITE_RING = [...SITE_COORDS.map(ll), ll(SITE_COORDS[0])];
const empty = () => ({ type: 'FeatureCollection', features: [] });
const lineF = (coords) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
const polyF = (ring) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } });

function circle(center, r, n = 120) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(offset(center, Math.cos(a) * r, Math.sin(a) * r));
  }
  return polyF(pts);
}

// Quadratic curve between two points, bowed to the north.
function arcCoords(a, b, bend = 0.22, n = 160) {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const cx = (x1 + x2) / 2 + (y2 - y1) * bend;
  const cy = (y1 + y2) / 2 - (x2 - x1) * bend;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2]);
  }
  return out;
}

function lengths(coords) {
  const acc = [0];
  for (let i = 1; i < coords.length; i++) {
    const [x1, y1] = coords[i - 1];
    const [x2, y2] = coords[i];
    acc.push(acc[i - 1] + Math.hypot((x2 - x1) * Math.cos((y1 * Math.PI) / 180), y2 - y1));
  }
  return acc;
}

function partial(coords, t) {
  const acc = lengths(coords);
  const target = acc[acc.length - 1] * t;
  const out = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    if (acc[i] <= target) { out.push(coords[i]); continue; }
    const f = (target - acc[i - 1]) / (acc[i] - acc[i - 1] || 1);
    const [x1, y1] = coords[i - 1];
    const [x2, y2] = coords[i];
    out.push([x1 + (x2 - x1) * f, y1 + (y2 - y1) * f]);
    break;
  }
  if (out.length < 2) out.push(coords[0]);
  return out;
}

const pointAt = (coords, t) => partial(coords, t).at(-1);

// The application's route: from the site in the Fergana Valley to Tashkent, where the
// National Committee coordinates the conclusion. Stages advance the application along it.
const ROUTE = arcCoords(SITE, TASHKENT);

export const CAMERAS = {
  // Low and tilted: the earth fills the frame, its limb arcs across the top, and the
  // north pole (where MapLibre stretches the tile edge) stays beyond the horizon.
  globe: { center: [65.5, 41], zoom: 4.2, pitch: 35, bearing: 0 },
  country: { center: [64.1, 41.25], zoom: 5.2, pitch: 34, bearing: -6 },
  valley: { center: [71.15, 40.76], zoom: 8.45, pitch: 66, bearing: 76 },
  village: { center: SITE, zoom: 15.6, pitch: 56, bearing: 24 },
  site: { center: SITE, zoom: 18.7, pitch: 50, bearing: 32 },
  siteWide: { center: offset(SITE, -22, 22), zoom: 16.35, pitch: 55, bearing: -12 },
  corridor: { center: [70.61, 41.06], zoom: 7.5, pitch: 50, bearing: 12 },
  // 'zones' is recomputed once the zone check has run: it frames the site and the nearest zone.
  zones: { center: SITE, zoom: 13.2, pitch: 42, bearing: 0 },
};

ZONES.then((res) => {
  const n = res.nearest;
  if (!n?.nearestAt) return;
  const d = Math.max(n.distance, 400);
  CAMERAS.zones = {
    center: [(SITE[0] + n.nearestAt[0]) / 2, (SITE[1] + n.nearestAt[1]) / 2],
    zoom: Math.min(15.5, 13.25 - Math.log2(d / 3400)),
    pitch: 42,
    bearing: 0,
  };
});

// 'route:<p>[:<bearing>[:<zoom>]]' follows the application: centred on the route at progress p
// and held in the band under the top bar, so it stays visible above the step's visual.
function routeCam(name) {
  const [, p, b, z] = name.split(':');
  return { center: pointAt(ROUTE, Number(p)), zoom: Number(z || 7.7), pitch: 50, bearing: Number(b || 0) };
}

// Cameras are composed for 1920 x 1080. The type scales with the screen, the map does not,
// so shift every zoom by the screen's size relative to that reference.
const zoomShift = () => Math.log2(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));

function style() {
  return {
    version: 8,
    projection: { type: 'globe' },
    sky: skyOf(COL),
    // Terrain is switched on after the first load: declaring it in the initial style
    // leaves the globe black (MapLibre 6 start-up race).
    sources: {
      sat: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 18,
      },
      dem: {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 13,
      },
      world: { type: 'geojson', data: abs('data/world.geojson') },
      nb: { type: 'geojson', data: abs('data/neighbors.geojson') },
      uzb: { type: 'geojson', data: abs('data/uzb.geojson') },
      regions: { type: 'geojson', data: abs('data/regions.geojson') },
      mask: { type: 'geojson', data: abs('data/mask.geojson') },
      veil: { type: 'geojson', data: polyF([[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]) },
      site: { type: 'geojson', data: polyF(SITE_RING) },
      siteLine: { type: 'geojson', data: empty() },
      ring: { type: 'geojson', data: circle(SITE, 165) },
      route: { type: 'geojson', data: empty() },
      ...Object.fromEntries(ZONE_LAYERS.map((z) => [`zone-${z.id}`, { type: 'geojson', data: zoneUrl(z.id) }])),
      zoneLink: { type: 'geojson', data: empty() },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': COL.ground } },
      {
        id: 'sat', type: 'raster', source: 'sat',
        paint: { 'raster-opacity': 0, 'raster-saturation': COL.sat, 'raster-contrast': 0.08, 'raster-brightness-max': COL.bright, 'raster-fade-duration': 280 },
      },
      { id: 'mask', type: 'fill', source: 'mask', paint: { 'fill-color': COL.mask, 'fill-opacity': 0 } },
      { id: 'world-line', type: 'line', source: 'world', paint: { 'line-color': COL.world, 'line-width': 0.6, 'line-opacity': 0 } },
      { id: 'nb-line', type: 'line', source: 'nb', paint: { 'line-color': COL.nb, 'line-width': 0.9, 'line-opacity': 0 } },
      { id: 'regions-line', type: 'line', source: 'regions', paint: { 'line-color': COL.hi, 'line-width': 0.8, 'line-opacity': 0 } },
      // Restricted-zone layers (KMZ): filled areas, outlines, and point objects as dots.
      ...ZONE_LAYERS.flatMap((z) => [
        { id: `zone-${z.id}-fill`, type: 'fill', source: `zone-${z.id}`, filter: ['==', ['geometry-type'], 'Polygon'], layout: { visibility: 'none' }, paint: { 'fill-color': COL.zone[z.id], 'fill-opacity': 0 } },
        { id: `zone-${z.id}-line`, type: 'line', source: `zone-${z.id}`, filter: ['!=', ['geometry-type'], 'Point'], layout: { visibility: 'none' }, paint: { 'line-color': COL.zone[z.id], 'line-width': 2.2, 'line-opacity': 0 } },
        { id: `zone-${z.id}-pt`, type: 'circle', source: `zone-${z.id}`, filter: ['==', ['geometry-type'], 'Point'], layout: { visibility: 'none' }, paint: { 'circle-color': COL.zone[z.id], 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5, 'circle-opacity': 0, 'circle-stroke-opacity': 0 } },
      ]),
      // Dims the ground behind a step's visual; everything above it (border, route, markers) stays lit.
      { id: 'veil', type: 'fill', source: 'veil', paint: { 'fill-color': COL.ground, 'fill-opacity': 0 } },
      { id: 'uzb-glow', type: 'line', source: 'uzb', paint: { 'line-color': COL.cyan, 'line-width': 16, 'line-blur': 14, 'line-opacity': 0 } },
      { id: 'uzb-line', type: 'line', source: 'uzb', paint: { 'line-color': COL.hi, 'line-width': 1.6, 'line-opacity': 0 } },
      { id: 'ring-fill', type: 'fill', source: 'ring', paint: { 'fill-color': COL.cyan, 'fill-opacity': 0 } },
      { id: 'ring-line', type: 'line', source: 'ring', paint: { 'line-color': COL.hi, 'line-width': 1.4, 'line-dasharray': [2, 2.4], 'line-opacity': 0 } },
      { id: 'site-fill', type: 'fill', source: 'site', paint: { 'fill-color': COL.cyan, 'fill-opacity': 0 } },
      { id: 'site-glow', type: 'line', source: 'siteLine', paint: { 'line-color': COL.hi, 'line-width': 12, 'line-blur': 9, 'line-opacity': 0 } },
      {
        id: 'site-line', type: 'line', source: 'siteLine',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': COL.siteLine, 'line-width': 2.4, 'line-opacity': 1 },
      },
      {
        id: 'route-halo', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COL.hi, 'line-width': 14, 'line-blur': 10, 'line-opacity': 0 },
      },
      {
        id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': COL.hi, 'line-width': 4, 'line-opacity': 0 },
      },
      {
        id: 'zone-link', type: 'line', source: 'zoneLink', layout: { 'line-cap': 'round', visibility: 'none' },
        paint: { 'line-color': COL.link, 'line-width': 2.6, 'line-dasharray': [1.4, 1.6], 'line-opacity': 0 },
      },
    ],
  };
}

const DEF = { cam: null, camDur: null, sat: 0.9, mask: 0.5, uzb: 1, regions: 0, nb: 0.3, world: 0.2, dim: 0, drift: 0.3, route: null, tashkent: false, zones: false, site: {} };
const SITE_DEF = { pulse: false, tag: false, poly: false, ring: false, corners: false, criteria: false, tone: 'cyan' };

// Corner badges sit off each true vertex along its outward direction for the 'site' camera
// (bearing 32), joined to the vertex by a 1px leader. Values are rem, screen space.
const CORNER_OFFSETS = [[2.3, 1.0], [-1.2, 2.2], [-2.3, -1.0], [1.2, -2.2]];

export function createMapStage(container) {
  const map = new maplibregl.Map({
    container,
    style: style(),
    ...CAMERAS.globe,
    interactive: false,
    attributionControl: false,
    maxPitch: 80,
    fadeDuration: 0,
  });
  if (import.meta.env.DEV) window.__map = map;
  map.on('error', (e) => {
    const msg = String(e?.error?.message || e?.error || '');
    if (!/tile|fetch|load|Failed|NetworkError|AJAXError|404/i.test(msg)) console.warn('[map]', msg);
  });

  // Markers: zero-size roots at the point; CSS places the content around it.
  function marker(html, lngLat, cls = '') {
    const el = document.createElement('div');
    el.className = `mk ${cls}`;
    el.innerHTML = `<div class="mk-in">${html}</div>`;
    const m = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(lngLat).addTo(map);
    return {
      el,
      m,
      show(on, delay = 0) {
        el.style.setProperty('--d', `${delay}ms`);
        el.classList.toggle('on', !!on);
      },
    };
  }
  const PULSE = '<span class="pulse"><span class="ring"></span><span class="ring r2"></span><span class="core"></span></span>';
  const TAG = `<span class="tag">${icon('fileText')}<span>${t('No.')} <span class="mono">${APP_NO}</span></span></span>`;
  const sitePulse = marker(PULSE, SITE, 'mk-pulse');
  const siteTag = marker(TAG, SITE, 'mk-tag');
  const tash = marker(`${PULSE}<span class="place">${t('Tashkent')}</span>`, TASHKENT, 'mk-pulse mk-place');
  // The travelling application: a lit head with its number, riding the route.
  const head = marker(`${PULSE}${TAG}`, SITE, 'mk-pulse mk-head');
  const corners = SITE_COORDS.map(([la, lo], i) => {
    const [dx, dy] = CORNER_OFFSETS[i];
    const len = Math.hypot(dx, dy) - 0.75;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    return marker(
      `<span class="vx"></span><span class="lead" style="width:${len}rem;transform:rotate(${ang}deg)"></span>` +
        `<span class="corner mono" style="transform:translate(calc(${dx}rem - 50%), calc(${dy}rem - 50%))">${i + 1}</span>`,
      [lo, la],
      'mk-corner',
    );
  });
  const crit = CRITERIA.filter((c) => c.at).map((c) =>
    marker(
      `<span class="crit ${c.side === 'w' ? 'west' : ''}"><span class="ci">${icon(c.icon)}</span><span class="cl">${c.label}</span></span>`,
      offset(SITE, c.at[0], c.at[1]),
      'mk-crit',
    ),
  );

  // Zone layers are drawn only on the steps that show them: hidden layers cost nothing per frame.
  const ZONE_IDS = [...ZONE_LAYERS.flatMap((z) => [`zone-${z.id}-fill`, `zone-${z.id}-line`, `zone-${z.id}-pt`]), 'zone-link'];
  let zonesHide = 0;
  function setZonesVisible(on, fade) {
    clearTimeout(zonesHide);
    const set = (v) => ZONE_IDS.forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', v));
    if (on) set('visible');
    else zonesHide = setTimeout(() => set('none'), fade ? fade * 1000 + 100 : 0);
  }

  // The zone check on the map: a dashed line from the site to the nearest zone, labelled with the distance.
  const zLabel = marker('<span class="zlabel"><span class="zl-d mono"></span><span class="zl-n"></span></span>', SITE, 'mk-zlabel');
  const zEnd = marker('<span class="zend"></span>', SITE, 'mk-zend');
  ZONES.then((res) => {
    const n = res.nearest;
    if (!n?.nearestAt) return;
    const put = () => {
      map.getSource('zoneLink')?.setData(lineF([SITE, n.nearestAt]));
    };
    if (map.getSource('zoneLink')) put(); else map.once('load', put);
    zLabel.m.setLngLat([(SITE[0] + n.nearestAt[0]) / 2, (SITE[1] + n.nearestAt[1]) / 2]);
    zLabel.el.querySelector('.zl-d').textContent = fmtDistance(n.distance);
    zLabel.el.querySelector('.zl-n').textContent = zoneName(n.nearest);
    zEnd.m.setLngLat(n.nearestAt);
    zLabel.el.classList.add(`z-${n.id}`);
    zEnd.el.classList.add(`z-${n.id}`);
  });

  // Paint tweening through proxies, so repeated steps never fight each other.
  const prox = new Map();
  function paint(layer, prop, to, dur = 1.6) {
    if (to == null || !map.getLayer(layer)) return;
    const k = `${layer}|${prop}`;
    let o = prox.get(k);
    if (!o) {
      o = { v: Number(map.getPaintProperty(layer, prop) ?? 0) };
      prox.set(k, o);
    }
    gsap.killTweensOf(o);
    if (!dur) {
      o.v = to;
      map.setPaintProperty(layer, prop, to);
      return;
    }
    gsap.to(o, { v: to, duration: dur, ease: 'power2.inOut', onUpdate: () => map.setPaintProperty(layer, prop, o.v) });
  }

  // Camera flights, plus a slow bounded sway once a flight has landed.
  let flightEnd = 0;
  let drift = 0;
  const state = { cam: null, padKey: null, poly: false, leaf: false, dim: 0 };
  function fly(name, { instant, padLeft, dur }) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const followsRoute = name.startsWith('route:');
    const base = followsRoute ? routeCam(name) : CAMERAS[name];
    const cam = { ...base, zoom: base.zoom + zoomShift() };
    const padding = followsRoute
      ? { top: 0, left: Math.round(W * 0.1), right: 0, bottom: Math.round(H * 0.75) }
      : { top: 0, bottom: 0, left: padLeft, right: 0 };
    swayBase = null;
    if (instant || REDUCED) {
      map.jumpTo({ ...cam, padding });
      flightEnd = 0;
      return;
    }
    const duration = dur ?? (followsRoute ? 2800 : 4200);
    flightEnd = performance.now() + duration + 250;
    map.flyTo({ ...cam, padding, duration, curve: 1.3, essential: true });
  }

  // Ambient motion: a slow sway around the landed bearing, bounded so a long
  // pause on one step never turns the map away from its composition.
  let terrainOn = false;
  let swayBase = null;
  let swayStart = 0;
  requestAnimationFrame(function tick(t) {
    if (t <= flightEnd || (map.isMoving() && swayBase === null)) {
      swayBase = null;
    } else if (drift && terrainOn) {
      if (swayBase === null) {
        swayBase = map.getBearing();
        swayStart = t;
      }
      const amp = drift * 8; // degrees
      map.setBearing(swayBase + amp * Math.sin(((t - swayStart) / 46000) * Math.PI * 2));
    }
    requestAnimationFrame(tick);
  });

  let polyTween = null;
  function drawPoly(instant) {
    polyTween?.kill();
    const src = map.getSource('siteLine');
    if (instant || REDUCED) {
      src.setData(lineF(SITE_RING));
      return;
    }
    const o = { t: 0 };
    src.setData(lineF(partial(SITE_RING, 0)));
    polyTween = gsap.to(o, {
      t: 1, duration: 1.9, delay: 0.5, ease: 'power2.inOut',
      onUpdate: () => src.setData(lineF(partial(SITE_RING, o.t))),
    });
  }

  function siteColors() {
    const leaf = state.leaf;
    map.setPaintProperty('site-line', 'line-color', leaf ? COL.leaf : COL.siteLine);
    map.setPaintProperty('site-glow', 'line-color', leaf ? COL.leaf : COL.hi);
    map.setPaintProperty('site-fill', 'fill-color', leaf ? COL.leaf : COL.cyan);
  }

  function setSite(st, instant) {
    const d = instant ? 0 : 1.1;
    const leaf = st.tone === 'leaf';
    sitePulse.el.classList.toggle('leaf', leaf);
    sitePulse.show(st.pulse);
    siteTag.el.classList.toggle('leaf', leaf);
    siteTag.show(st.tag, instant ? 0 : 500);
    if (st.poly && !state.poly) drawPoly(instant);
    if (!st.poly && state.poly) {
      polyTween?.kill();
      map.getSource('siteLine').setData(empty());
    }
    state.poly = st.poly;
    state.leaf = leaf;
    siteColors();
    paint('site-fill', 'fill-opacity', st.poly ? 0.3 : 0, d);
    paint('site-glow', 'line-opacity', st.poly ? 0.85 : 0, d);
    paint('ring-line', 'line-opacity', st.ring ? 0.85 : 0, d);
    paint('ring-fill', 'fill-opacity', st.ring ? 0.07 : 0, d);
    corners.forEach((c, i) => c.show(st.corners, instant ? 0 : 1500 + i * 160));
    crit.forEach((c, i) => c.show(st.criteria, instant ? 0 : 600 + i * 220));
  }

  // The route the application rides: a solid line that grows stage by stage, with a lit head.
  // spec: { dir: 'out' | 'back', to: 0..1, head: true | false | 'travel' }
  let routeTween = null;
  const routeState = { dir: null, p: 0, back: false };
  function routeColors() {
    const color = routeState.back ? COL.leaf : COL.hi;
    map.setPaintProperty('route-line', 'line-color', color);
    map.setPaintProperty('route-halo', 'line-color', color);
  }
  function setRoute(r, instant) {
    routeTween?.kill();
    const d = instant ? 0 : 0.7;
    if (!r) {
      routeState.dir = null;
      routeState.p = 0;
      paint('route-line', 'line-opacity', 0, d);
      paint('route-halo', 'line-opacity', 0, d);
      head.show(false);
      return;
    }
    const back = r.dir === 'back';
    const coords = back ? [...ROUTE].reverse() : ROUTE;
    routeState.back = back;
    routeColors();
    head.el.classList.toggle('leaf', back);
    head.el.classList.toggle('east', back); // tag sits on the side away from the trailing line
    const from = routeState.dir === r.dir ? routeState.p : 0;
    routeState.dir = r.dir;
    routeState.p = r.to;
    paint('route-line', 'line-opacity', 1, d);
    paint('route-halo', 'line-opacity', 0.32, d);
    const src = map.getSource('route');
    const render = (p) => {
      src.setData(lineF(partial(coords, Math.max(p, 0.002))));
      head.m.setLngLat(pointAt(coords, p));
    };
    const showHead = r.head === true || r.head === 'travel';
    if (instant || REDUCED || Math.abs(from - r.to) < 0.001) {
      render(r.to);
      head.show(r.head === true);
      return;
    }
    const o = { p: from };
    render(from);
    head.show(showHead);
    routeTween = gsap.to(o, {
      p: r.to, duration: r.dur ?? 2.6, delay: 0.35, ease: 'power2.inOut',
      onUpdate: () => render(o.p),
      onComplete: () => head.show(r.head === true),
    });
  }

  function applyNow(spec, { instant = false, padLeft = 0 } = {}) {
    const s = { ...DEF, ...spec };
    const st = { ...SITE_DEF, ...(spec.site || {}) };
    const padKey = Math.round(padLeft / 16);
    if (s.cam && (s.cam !== state.cam || padKey !== state.padKey)) {
      fly(s.cam, { instant, padLeft, dur: s.camDur });
      state.cam = s.cam;
      state.padKey = padKey;
    }
    drift = REDUCED || STILL ? 0 : s.drift;
    const d = instant ? 0 : 1.6;
    paint('sat', 'raster-opacity', s.sat, d);
    state.dim = s.dim;
    paint('sat', 'raster-saturation', s.dim > 0 ? COL.satDim : COL.sat, d);
    paint('mask', 'fill-opacity', s.mask, d);
    paint('veil', 'fill-opacity', s.dim, d);
    paint('world-line', 'line-opacity', s.world, d);
    paint('nb-line', 'line-opacity', s.nb, d);
    paint('regions-line', 'line-opacity', s.regions, d);
    paint('uzb-glow', 'line-opacity', s.uzb * 0.5, d);
    paint('uzb-line', 'line-opacity', s.uzb, d);
    setZonesVisible(!!s.zones, d);
    ZONE_LAYERS.forEach((z) => {
      paint(`zone-${z.id}-fill`, 'fill-opacity', s.zones ? 0.42 : 0, d);
      paint(`zone-${z.id}-line`, 'line-opacity', s.zones ? 0.95 : 0, d);
      paint(`zone-${z.id}-pt`, 'circle-opacity', s.zones ? 0.95 : 0, d);
      paint(`zone-${z.id}-pt`, 'circle-stroke-opacity', s.zones ? 1 : 0, d);
    });
    paint('zone-link', 'line-opacity', s.zones ? 0.95 : 0, d);
    zLabel.show(s.zones === 'link', instant ? 0 : 1400);
    zEnd.show(s.zones === 'link', instant ? 0 : 1200);
    setSite(st, instant);
    tash.show(s.tashkent);
    setRoute(s.route, instant);
  }

  let loaded = false;
  let pending = null;
  const ready = new Promise((resolve) => {
    map.on('load', () => {
      loaded = true;
      if (pending) applyNow(pending.spec, { ...pending.opts, instant: true });
      pending = null;
      // Terrain goes on only once the first view is fully drawn; enabling it earlier
      // leaves the boundary and route lines out of the terrain's draped texture.
      let fallback = 0;
      const enableTerrain = () => {
        if (terrainOn) return;
        clearTimeout(fallback);
        map.setTerrain({ source: 'dem', exaggeration: 1.35 });
        terrainOn = true;
      };
      map.once('idle', enableTerrain);
      fallback = setTimeout(enableTerrain, 6000);
      resolve(map);
    });
  });

  // Theme switch: recolour the style in place; opacities stay where the step put them.
  function applyTheme(th) {
    COL = PAL[th];
    if (!loaded) return;
    const set = (l, p, v) => map.getLayer(l) && map.setPaintProperty(l, p, v);
    set('bg', 'background-color', COL.ground);
    set('mask', 'fill-color', COL.mask);
    set('world-line', 'line-color', COL.world);
    set('nb-line', 'line-color', COL.nb);
    set('regions-line', 'line-color', COL.hi);
    set('veil', 'fill-color', COL.ground);
    set('uzb-glow', 'line-color', COL.cyan);
    set('uzb-line', 'line-color', COL.hi);
    set('ring-fill', 'fill-color', COL.cyan);
    set('ring-line', 'line-color', COL.hi);
    set('sat', 'raster-brightness-max', COL.bright);
    paint('sat', 'raster-saturation', state.dim > 0 ? COL.satDim : COL.sat, 0.6);
    ZONE_LAYERS.forEach((z) => {
      set(`zone-${z.id}-fill`, 'fill-color', COL.zone[z.id]);
      set(`zone-${z.id}-line`, 'line-color', COL.zone[z.id]);
      set(`zone-${z.id}-pt`, 'circle-color', COL.zone[z.id]);
    });
    set('zone-link', 'line-color', COL.link);
    siteColors();
    routeColors();
    map.setSky(skyOf(COL));
  }
  onTheme(applyTheme);

  return {
    map,
    ready,
    apply(spec, opts) {
      if (!loaded) {
        pending = { spec, opts };
        return;
      }
      applyNow(spec, opts);
    },
    // After a window resize: re-aim the current camera for the new screen size.
    refit(padLeft) {
      if (state.cam) fly(state.cam, { instant: true, padLeft });
      state.padKey = Math.round(padLeft / 16);
    },
  };
}
