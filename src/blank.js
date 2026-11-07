// The official conclusion blank of the State Ecological Expertise Center, drawn after the real
// form (preview.pdf). Its text goes through t() like the rest of the deck: in Uzbek it reads as the
// real blank does, in Russian and English it is translated. Personal names and TINs are masked.
//
// Everything inside is sized in em: one font-size on .blank scales the whole sheet, so the same
// blank serves the expert's screen, the signing view and the applicant's phone.
//
// state: 'empty'  - the blank as the expert opens it, fields still blank
//        'filled' - the drafted conclusion
//        'signed' - signed with E-IMZO: both QR codes and the electronic signatures
import {
  APP_NO, AIR_TOTAL, GREEN_SHARE, HAZ_WASTE, MSW, SEWAGE, SITE, WATER, num,
} from './data.js';
import { t } from './i18n.js';

const EMBLEM = `${import.meta.env.BASE_URL}brand/uz-emblem.png`;

export const CONCL_NO = '01-02/01-9712';
export const ISSUED = '24.10.2026';
export const VALID = '24.10.2029';
export const SIGN_TIMES = ['24.10.2026 16:49:01', '24.10.2026 16:49:52'];

/* ---------- A decorative QR code (finder patterns + seeded modules; it encodes nothing) ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function qr(seed = 7, cls = '') {
  const N = 25;
  const r = rng(seed);
  const on = Array.from({ length: N }, () => Array(N).fill(false));
  const finder = (ox, oy) => {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const X = ox + x;
      const Y = oy + y;
      if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
      const inside = x >= 0 && x <= 6 && y >= 0 && y <= 6; // outside: the white separator ring
      const edge = x === 0 || x === 6 || y === 0 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      on[Y][X] = inside && (edge || core);
    }
  };
  const reserved = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!reserved(x, y)) on[y][x] = r() > 0.52;
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  // timing patterns
  for (let i = 8; i < N - 8; i++) { on[6][i] = i % 2 === 0; on[i][6] = i % 2 === 0; }
  let d = '';
  on.forEach((row, y) => row.forEach((v, x) => { if (v) d += `M${x} ${y}h1v1h-1z`; }));
  return `<svg class="qr ${cls}" viewBox="-1 -1 27 27" aria-hidden="true"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* ---------- Satellite mini map: Esri tiles around the site, in a local pixel frame ---------- */
const TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
function worldPx([lng, lat], z) {
  const s = 256 * 2 ** z;
  const r = (lat * Math.PI) / 180;
  return [((lng + 180) / 360) * s, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * s];
}

// coords: [[lat, lng], ...]. W, H: the view in world pixels at zoom z (z 18 ≈ 0.45 m / px here).
export function minimap(coords, { W = 150, H = 110, z = 18, cls = '' } = {}) {
  const [cx, cy] = worldPx(SITE, z);
  const x0 = Math.floor((cx - W / 2) / 256);
  const x1 = Math.floor((cx + W / 2) / 256);
  const y0 = Math.floor((cy - H / 2) / 256);
  const y1 = Math.floor((cy + H / 2) / 256);
  const ox = x0 * 256; // local origin keeps the numbers small (SVG floats are single precision)
  const oy = y0 * 256;
  let tiles = '';
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    tiles += `<image href="${TILE}/${z}/${ty}/${tx}" x="${tx * 256 - ox}" y="${ty * 256 - oy}" width="256.6" height="256.6"/>`;
  }
  const pts = coords.map(([la, lo]) => worldPx([lo, la], z)).map(([x, y]) => [x - ox, y - oy]);
  const d = `M${pts.map((p) => p.map((v) => v.toFixed(2)).join(' ')).join(' L')} Z`;
  const vb = `${(cx - ox - W / 2).toFixed(2)} ${(cy - oy - H / 2).toFixed(2)} ${W} ${H}`;
  const k = W / 150; // marker sizes follow the view
  // Corner numbers sit outside the outline, along each corner's direction from the centre.
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const lab = pts.map(([x, y]) => { const dx = x - mx; const dy = y - my; const L = Math.hypot(dx, dy) || 1; return [(dx / L) * 6.5 * k, (dy / L) * 6.5 * k]; });
  return `
    <svg class="mm ${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x="${cx - ox - W}" y="${cy - oy - H}" width="${W * 2}" height="${H * 2}" class="mm-bg"/>
      <g class="mm-tiles">${tiles}</g>
      <path class="mm-fill" d="${d}"/>
      <path class="mm-poly" d="${d}" style="stroke-width:${(1.1 * k).toFixed(2)}"/>
      ${pts.map(([x, y], i) => `
        <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><g class="mm-v" data-i="${i}">
          <circle r="${(1.7 * k).toFixed(2)}"/>
          <text x="${lab[i][0].toFixed(2)}" y="${lab[i][1].toFixed(2)}" text-anchor="middle" dominant-baseline="central" style="font-size:${(4.6 * k).toFixed(2)}px">${i + 1}</text>
        </g></g>`).join('')}
    </svg>`;
}

/* ---------- The blank ---------- */
const R = (w = 9) => `<i class="bk-x" style="width:${w}em"></i>`; // masked personal data
const F = (html, key) => `<span class="bk-f" data-k="${key}">${html}</span>`; // a field the expert fills
// A translated sentence with slots {0}, {1}…: each language keeps its own word order.
const tf = (key, ...args) => t(key).replace(/\{(\d)\}/g, (_, i) => args[i]);

export function blank(state = 'filled') {
  const ty = t('t/year');
  const pass = [
    [t('Atmospheric air'), `${num(AIR_TOTAL.ty, 4)} ${ty} · ${num(AIR_TOTAL.gs, 4)} ${t('g/s')}`],
    [t('Water resources'), `${tf('water consumption: {0} m³/year', num(WATER.year, 1))}<br>${tf('wastewater: {0} m³/year', num(SEWAGE.year, 1))}`],
    [t('Hazardous waste'), `${num(HAZ_WASTE.ty, 3)} ${ty}`],
    [t('Solid domestic waste'), `${num(MSW.ty, 1)} ${ty}`],
    [t('Green coverage'), `${num(GREEN_SHARE, 1)}%`],
    [t('Impact on flora'), t('present')],
    [t('Impact on fauna'), t('absent')],
  ];
  return `
  <article class="blank is-${state}">
    <header class="bk-hd">
      <img src="${EMBLEM}" alt="" />
      <div class="bk-org">${t('STATE INSTITUTION “STATE ECOLOGICAL EXPERTISE CENTER” OF THE NATIONAL COMMITTEE OF THE REPUBLIC OF UZBEKISTAN FOR ECOLOGY AND CLIMATE CHANGE')}</div>
      <i class="bk-rule"></i>
    </header>
    <h2 class="bk-title">${t('CONCLUSION OF THE STATE<br>ECOLOGICAL EXPERTISE')}</h2>
    <div class="bk-top">
      <div class="bk-meta">
        <b>${t('Head:')} ${R(10)}</b>
        <b>${t('SERIAL NO.')} № ${F(CONCL_NO, 'no')}</b>
        <b>${t('DOCUMENT TYPE')} ${F(t('Draft environmental impact statement'), 'type')}</b>
      </div>
      <div class="bk-appr"><span>${t('“Approved”')}</span><span class="bk-qr q-dir">${qr(11)}</span></div>
    </div>
    <p>${tf('Customer (initiator): {0}. Issued.', `<b>${R(14)}</b>`)}<br>${t('TIN:')} <b>${R(5)}</b></p>
    <p>${t('Object of state ecological expertise:')} <b>${F(t('“School building construction in Baliqchi district, Andijan region”'), 'obj')}</b></p>
    <p>${t('Application number:')} <b>${F(`<span class="bk-mono">${APP_NO}</span> (my.gov.uz)`, 'app')}</b></p>
    <p>${t('Project developer:')} <b>${R(12)}</b> &nbsp;${t('TIN:')} <b>${R(5)}</b></p>
    <p>${t('Ecologist expert responsible for the state ecological expertise:')}<br><b>${R(11)} (${t('Lead ecologist expert')})</b></p>
    <h3 class="bk-h">${t('Brief passport of ecological indicators')}</h3>
    <table class="bk-pass">
      <thead><tr><th>${t('Areas')}</th><th>${t('Main indicators')}</th></tr></thead>
      <tbody>${pass.map(([k, v], i) => `<tr data-r="${i}"><td>${k}</td><td>${F(v, `p${i}`)}</td></tr>`).join('')}</tbody>
    </table>
    <p class="bk-izoh">${t('Note: all calculations and standards are given in the annex.')}</p>
    <p class="bk-just">${tf('Under Annex 1 approved by Resolution No. 234 of the Cabinet of Ministers of the Republic of Uzbekistan of 11 May 2026, this object of state ecological expertise belongs to {0} of environmental impact.', F(`<b>${t('low-risk category III')}</b>`, 'cat'))}</p>
    <p class="bk-res"><b>${t('Result of the state ecological expertise:')} ${F(`<span class="bk-ok">${t('POSITIVE')}</span>`, 'res')}</b></p>
    <p class="bk-res"><b>${t('Conclusion of the state ecological expertise:')} <span class="bk-red">${t('Not a legal document without the annex.')}</span></b></p>
    <footer class="bk-foot">
      <span class="bk-qr q-exp">${qr(5)}</span>
      <b class="bk-who">${t('Expert (full name):')} ${R(8)}</b>
      <span class="bk-dates"><b>${t('Date of issue:')} ${F(ISSUED, 'd1')}</b><b>${t('Valid until:')} ${F(VALID, 'd2')}</b></span>
    </footer>
    <div class="bk-esig">
      <b>${t('ELECTRONIC DIGITAL SIGNATURES:')}</b>
      <span class="bk-sg s1">1. ${t('Ecologist expert')} ${R(6)} · ${SIGN_TIMES[0]}</span>
      <span class="bk-sg s2">2. ${t('Head of the Center')} ${R(6)} · ${SIGN_TIMES[1]}</span>
    </div>
    <p class="bk-fine">${t('The ecologist expert’s conclusion in the annex, on the object’s compliance with ecological requirements, the coordinates of its location points, environmental protection measures, mandatory requirements and more, is an integral part of this conclusion of the state ecological expertise, and its requirements are binding.')}</p>
  </article>`;
}
