// Language and theme preferences. Text is written in English in the source and translated
// through t(): the English string is the key, LOCALES holds the Uzbek and Russian versions.
// Changing the language reloads the page on the same step (#n), so every module renders once.
import { LOCALES } from './locales.js';

export const LANGS = ['uz', 'ru', 'en'];
export const THEMES = ['dark', 'light'];
const DEFAULT_LANG = 'uz';
const DEFAULT_THEME = 'dark';

const params = new URLSearchParams(window.location.search);
const stored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

const pick = (v, list, def) => (list.includes(v) ? v : def);
export const LANG = pick(params.get('lang') || stored('eco-lang'), LANGS, DEFAULT_LANG);
let theme = pick(params.get('theme') || stored('eco-theme'), THEMES, DEFAULT_THEME);
// A ?lang= / ?theme= link is remembered like a choice made with the controls.
if (params.has('lang')) store('eco-lang', LANG);
if (params.has('theme')) store('eco-theme', theme);

const IDX = { uz: 0, ru: 1 };
const missing = new Set();

export function t(s) {
  if (LANG === 'en') return s;
  const row = LOCALES[s];
  if (!row) {
    if (import.meta.env.DEV && !missing.has(s)) { missing.add(s); console.warn('[i18n] missing:', s); }
    return s;
  }
  return row[IDX[LANG]];
}

export function setLang(l) {
  if (!LANGS.includes(l) || l === LANG) return;
  store('eco-lang', l);
  const url = new URL(window.location.href);
  url.searchParams.delete('lang');
  url.searchParams.delete('theme'); // the current theme is already stored
  // Keeps #n: the deck reopens on the same step. When only the hash would stay the same,
  // replace() is a same-document hash navigation and does not reload, so reload explicitly.
  if (url.href === window.location.href) window.location.reload();
  else window.location.replace(url.href);
}

const themeListeners = new Set();
export const getTheme = () => theme;
export const onTheme = (fn) => themeListeners.add(fn);
export function setTheme(v) {
  if (!THEMES.includes(v) || v === theme) return;
  theme = v;
  store('eco-theme', v);
  document.documentElement.dataset.theme = v;
  themeListeners.forEach((fn) => fn(v));
}

document.documentElement.lang = LANG;
document.documentElement.dataset.theme = theme;
