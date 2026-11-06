// The narrative panel: one heading, one or two sentences, optional evidence block, optional source note.
import { APP_NO, CRITERIA, SITE_COORDS } from './data.js';
import { icon } from './icons.js';
import { t } from './i18n.js';
import { ZONES, ZONE_LAYERS, fmtDistance, zoneName } from './zones.js';

const CREST = `${import.meta.env.BASE_URL}brand/eco-service-shield.png`;

const BLOCKS = {
  ticket: ({ issued } = {}) => `
    <div class="ticket ${issued ? 'issued' : ''}">
      <span class="tk-ic">${icon(issued ? 'stamp' : 'fileText')}</span>
      <span class="tk-main">
        <span class="tk-id">${issued ? t('Conclusion · Application No.') : t('Application No.')} <span class="mono">${APP_NO}</span></span>
        <span>${t('School building construction')}</span>
      </span>
      <span class="chip ${issued ? 'leaf' : ''}">${issued ? t('Signed, issued') : t('Category III')}</span>
    </div>`,

  // who: 'inspector' | 'expert' — the same account card, seen by whoever goes to the site.
  account: ({ who = 'inspector' } = {}) => `
    <div class="acct">
      <div class="acct-hd">${icon(who === 'expert' ? 'userCheck' : 'inbox')}<span>${who === 'expert' ? t('Expert’s account') : t('Inspector’s account')}</span><span class="chip cyan">${who === 'expert' ? t('Site visit') : t('New')}</span></div>
      <dl class="acct-grid">
        <div><dt>${t('Number')}</dt><dd class="mono">${APP_NO}</dd></div>
        <div><dt>${t('Applicant')}</dt><dd><i class="redact w6"></i></dd></div>
        <div><dt>${t('Object')}</dt><dd>${t('School building construction')}</dd></div>
        <div><dt>${t('Deadline')}</dt><dd class="dl">${icon('clock')}${t('Monitored')}</dd></div>
      </dl>
    </div>`,

  coords: () => `
    <ol class="coords">
      ${SITE_COORDS.map(([la, lo], i) => `<li><span class="n mono">${i + 1}</span><span class="mono">${la.toFixed(5)}</span><span class="mono">${lo.toFixed(5)}</span></li>`).join('')}
    </ol>
    <p class="aside">${icon('scan')}${t('A plot of about 10 × 10 m')}</p>`,

  criteria: () => `
    <ul class="crit-list">
      ${CRITERIA.map((c) => `<li class="${c.at ? 'seen' : ''}">${icon(c.icon)}<span>${c.label}</span></li>`).join('')}
    </ul>`,

  decide: () => `
    <div class="decide">
      <span class="opt yes sel">${icon('check')}${t('Accept')}</span>
      <span class="opt">${icon('x')}${t('Reject')}</span>
    </div>
    <p class="aside">${icon('lock')}${t('Findings locked: no further editing')}</p>`,

  // The expert's own check on the ground, against what the inspector recorded.
  verify: () => `
    <ul class="facts verify">
      <li>${icon('mapPinned')}<span>${t('Inspector’s site schematic compared with the site')}</span><span class="ok">${icon('check')}</span></li>
      <li>${icon('locateFixed')}<span>${t('Object coordinates confirmed')}</span><span class="ok">${icon('check')}</span></li>
      <li class="zsum" data-zone-summary>${icon('layers')}<span>${t('Checking restricted zones…')}</span><span class="ok">${icon('check')}</span></li>
      <li>${icon('clipboardList')}<span>${t('Expert’s findings recorded in the system')}</span><span class="ok">${icon('check')}</span></li>
    </ul>`,

  // The site against the restricted-zone layers; rows are filled in once the check has run.
  zones: () => `
    <ul class="zones">
      ${ZONE_LAYERS.map((l) => `<li data-zone="${l.id}" class="zl-${l.id}"><span class="zsw"></span>${icon(l.icon)}<span class="zt"><b>${t(l.label)}</b><span class="zd">${t('Checking…')}</span></span><span class="zst chip">…</span></li>`).join('')}
    </ul>
    <p class="aside zverdict" data-zone-summary>${icon('layers')}<span>${t('Checking restricted zones…')}</span></p>`,

  divisions: () => `
    <ul class="facts">
      <li>${icon('landmark')}<span>${t('Department of Environmental Policy')}</span></li>
      <li>${icon('shieldCheck')}<span>${t('State Environmental Control Inspectorate')}</span></li>
    </ul>`,
};

function hero(c) {
  // sig: one line ['a', 'b'] or explicit lines [['a', 'b'], ['c']]; separators only within a line.
  const lines = Array.isArray(c.sig[0]) ? c.sig : [c.sig];
  return `
    <img class="crest" data-in src="${CREST}" alt="${t('ECO SERVICE shield')}" />
    <h1 data-in>ECO SERVICE</h1>
    <p class="sub" data-in>${c.sub}</p>
    <p class="byline" data-in>${lines.map((l) => `<span class="bl">${l.map((s) => `<span>${s}</span>`).join('')}</span>`).join('')}</p>`;
}

// Fill the zone rows and summaries once the layers are loaded and checked.
function fillZones(el) {
  if (!el.querySelector('[data-zone], [data-zone-summary]')) return;
  ZONES.then((res) => {
    res.layers.forEach((l) => {
      const li = el.querySelector(`[data-zone="${l.id}"]`);
      if (!li) return;
      const st = li.querySelector('.zst');
      const d = li.querySelector('.zd');
      if (l.error) { st.textContent = t('No data'); d.textContent = l.error; return; }
      const inside = l.inside.length > 0;
      li.classList.add(inside ? 'in' : 'out');
      st.className = `zst chip ${inside ? 'coral' : 'leaf'}`;
      st.innerHTML = `${icon(inside ? 'alert' : 'check')}${inside ? t('Inside') : t('Outside')}`;
      d.textContent = inside ? zoneName(l.inside[0]) : `${t('Nearest')}: ${fmtDistance(l.distance)} · ${zoneName(l.nearest)}`;
    });
    el.querySelectorAll('[data-zone-summary]').forEach((s) => {
      const span = s.querySelector('span');
      if (!res.complete) { span.textContent = t('Some zone layers could not be loaded'); s.classList.add('warn'); return; }
      if (res.insideAny) {
        const hit = res.layers.find((l) => l.inside?.length);
        span.textContent = `${t('The site lies inside a restricted zone')}: ${zoneName(hit.inside[0])}`;
        s.classList.add('warn');
      } else {
        span.textContent = `${t('Outside all restricted zones; nearest')} ${fmtDistance(res.nearest.distance)}`;
        s.classList.add('clear');
      }
    });
  });
}

export function renderCard(c = {}, layout = 'side') {
  const el = document.createElement('article');
  el.className = `card card--${layout}`;
  if (c.hero) {
    el.innerHTML = hero(c);
    return el;
  }
  const block = c.block ? BLOCKS[c.block.type](c.block) : '';
  el.innerHTML = `
    ${c.title ? `<h1 data-in>${c.title}</h1>` : ''}
    ${c.body ? `<p class="body" data-in>${c.body}</p>` : ''}
    ${block ? `<div class="block" data-in>${block}</div>` : ''}
    ${c.note ? `<p class="note" data-in>${c.note}</p>` : ''}`;
  fillZones(el);
  return el;
}
