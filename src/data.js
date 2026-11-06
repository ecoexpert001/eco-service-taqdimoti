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
  'Application, site inspection, intake review',
  'Online invoice, automatic status',
  'Responsible expert, automatic deadlines',
  'Site visit, drafted in the system',
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
