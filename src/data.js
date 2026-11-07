// Facts and sample data, all taken from the ECO SERVICE process deck.
import { t } from './i18n.js';

export const APP_NO = '371668581';

// Site schematic coordinates exactly as listed in the deck (lat, lon).
export const SITE_COORDS = [
  [40.84609, 71.98364],
  [40.84611, 71.98354],
  [40.84618, 71.98356],
  [40.84616, 71.98366],
];

// Centroid as [lng, lat] for the map.
export const SITE = [
  SITE_COORDS.reduce((s, p) => s + p[1], 0) / SITE_COORDS.length,
  SITE_COORDS.reduce((s, p) => s + p[0], 0) / SITE_COORDS.length,
];

// City-level position only; no office locations are claimed.
export const TASHKENT = [69.2401, 41.2995];

export const STAGES = ['Intake', 'Payment', 'Assignment', 'Conclusion', 'Review', 'Coordination', 'Approval', 'Signing'].map(t);

export const STAGE_NOTES = [
  'E-application, site inspection, intake review',
  'Online invoice, automatic status',
  'Responsible expert, automatic deadlines',
  'Site visit, public hearing, digital blank',
  'Checked by expert supervisors',
  'Two divisions of the National Committee',
  'Final decision by the Center’s director',
  'E-IMZO signature, issued via my.gov.uz',
].map(t);

// Move a [lng, lat] point by metres east / north.
export function offset([lng, lat], east, north) {
  return [lng + east / (111320 * Math.cos((lat * Math.PI) / 180)), lat + north / 111320];
}

// The nine on-site inspection criteria from the deck. `at` (metres east, north of the site)
// marks where a matching feature is visible in the imagery; criteria without `at` are not drawn.
// `side` puts the label east or west of its marker so labels never collide.
export const CRITERIA = [
  { label: t('Trees on the site'), icon: 'treePine', at: [22, -8], side: 'e' },
  { label: t('Trees in the building area'), icon: 'trees', at: [-35, 60], side: 'w' },
  { label: t('Recreational zones'), icon: 'tent' },
  { label: t('Settlements'), icon: 'house', at: [115, 80], side: 'e' },
  { label: t('Irrigation systems'), icon: 'waves', at: [-80, -120], side: 'w' },
  { label: t('Agricultural crops'), icon: 'wheat', at: [-150, -50], side: 'w' },
  { label: t('Power lines, transport'), icon: 'utilityPole', at: [-30, 150], side: 'e' },
  { label: t('Water and gas pipelines'), icon: 'droplets' },
  { label: t('Protected zones'), icon: 'shieldCheck' },
];

// Sample invoice for the payment illustration (no invoice number appears in the process deck).
export const INVOICE_NO = `INV-${APP_NO}`;

// ---------- The electronic application, step by step (illustrative sample values) ----------
// The same numbers flow into the conclusion's passport of ecological indicators, so the
// presentation shows one set of data travelling from the form to the signed blank.

// Step 2: technical and economic indicators (m²).
export const TEP = {
  buildings: 3,
  land: 12400,
  green: 3980,
  built: 2850,
  paved: 3120,
  floor: 7600,
};
export const GREEN_SHARE = (TEP.green / TEP.land) * 100; // computed, not typed

// Step 3: environmental impact.
export const AIR = [
  { code: 'A-II 001', name: 'Nitrogen dioxide', cls: 'II', gs: 0.0021, ty: 0.0412 },
  { code: 'A-IV 075', name: 'Carbon monoxide', cls: 'IV', gs: 0.0058, ty: 0.1125 },
];
export const AIR_TOTAL = {
  gs: AIR.reduce((s, r) => s + r.gs, 0),
  ty: AIR.reduce((s, r) => s + r.ty, 0),
};
export const WATER = { day: 18.5, year: 4625 }; // centralised district drinking-water network
export const SEWAGE = { day: 17.6, year: 4400 }; // into the district sewer
export const HAZ_WASTE = { code: 'WM-I', ty: 0.012 }; // spent mercury lamps
export const MSW = { code: 'WM-V', ty: 18.4 }; // solid domestic waste

// Step 4 and the inspector's check: the same corners measured on site with GPS.
// Offsets in metres (east, north) are well inside a handheld receiver's accuracy.
const GPS_SHIFT = [[0.6, -0.4], [-0.5, 0.7], [0.4, 0.5], [-0.7, -0.3]];
export const SITE_GPS = SITE_COORDS.map(([la, lo], i) => {
  const [x, y] = offset([lo, la], ...GPS_SHIFT[i]);
  return [y, x];
});
export const GPS_DEV = Math.max(...GPS_SHIFT.map(([e, n]) => Math.hypot(e, n))); // metres

// Plot area from the corner coordinates (shoelace formula in a local metric plane).
export const SITE_AREA = (() => {
  const kx = 111320 * Math.cos((SITE[1] * Math.PI) / 180);
  const pts = SITE_COORDS.map(([la, lo]) => [(lo - SITE[0]) * kx, (la - SITE[1]) * 111320]);
  let a = 0;
  pts.forEach(([x1, y1], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; });
  return Math.abs(a / 2);
})();

// Numbers as on the official forms: a space between thousands, a point for decimals.
export const num = (v, d = 0) => {
  const [i, f] = Number(v).toFixed(d).split('.');
  return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${f ? `.${f}` : ''}`;
};
