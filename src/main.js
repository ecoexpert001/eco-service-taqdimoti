import '@fontsource-variable/geologica';
import '@fontsource-variable/martian-mono';
import './styles.css';
import { LANG, LANGS, t, getTheme, setLang, setTheme, onTheme } from './i18n.js';
import { createMapStage } from './map.js';
import { createRail } from './rail.js';
import { createEngine } from './engine.js';
import { STEPS } from './steps.js';
import { icon } from './icons.js';

const $ = (s) => document.querySelector(s);

document.title = t('ECO SERVICE · The journey of one application');
$('#rail').setAttribute('aria-label', t('Stages of state ecological expertise'));
$('#cue').innerHTML = `<span>${t('Next')}</span><span class="key">${icon('arrowRight')}</span>`;
$('#credits').textContent =
  `${t('Imagery')} © Esri, Maxar, Earthstar Geographics · ${t('Terrain')}: Mapzen / AWS Terrain Tiles · ${t('Boundaries')}: geoBoundaries (CC BY 4.0), Natural Earth · MapLibre`;

// Presenter controls: language (reloads on the same step) and light / dark theme.
// Keys: L cycles the language, T switches the theme.
const ctl = $('#ctl');
ctl.innerHTML = `
  <div class="seg" role="group" aria-label="${t('Language')}">
    ${LANGS.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === LANG}">${l.toUpperCase()}</button>`).join('')}
  </div>
  <button type="button" class="theme" aria-label="${t('Light / dark theme')}"></button>`;
const themeBtn = ctl.querySelector('.theme');
const paintThemeBtn = (th) => {
  themeBtn.innerHTML = icon(th === 'dark' ? 'sun' : 'moon');
  themeBtn.title = th === 'dark' ? t('Light theme') : t('Dark theme');
};
paintThemeBtn(getTheme());
onTheme(paintThemeBtn);
ctl.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.lang) setLang(b.dataset.lang);
  else if (b === themeBtn) setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  b.blur();
});
window.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'l' || e.key === 'L') setLang(LANGS[(LANGS.indexOf(LANG) + 1) % LANGS.length]);
  else if (e.key === 't' || e.key === 'T') setTheme(getTheme() === 'dark' ? 'light' : 'dark');
});

const engine = createEngine({
  steps: STEPS,
  stage: $('#stage'),
  cardSlot: $('#card-slot'),
  visualSlot: $('#visual-slot'),
  rail: createRail($('#rail')),
  mapApi: createMapStage($('#map')),
  count: $('#count'),
  cue: $('#cue'),
  mark: $('#mark'),
});

const start = parseInt(window.location.hash.slice(1), 10);
engine.go(Number.isFinite(start) ? start - 1 : 0, { instant: Number.isFinite(start) && start > 1 });
if (import.meta.env.DEV) window.__engine = engine;
