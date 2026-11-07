// Right-hand visuals. Each one is a template plus phase builders; a phase adds its
// animation to a GSAP timeline. Jumping (or going back) rebuilds the template and
// fast-forwards the same timeline, so the animated and the static states never drift apart.
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import {
  AIR, AIR_TOTAL, APP_NO, CRITERIA, GREEN_SHARE, HAZ_WASTE, INVOICE_NO, MSW, SEWAGE, SITE_AREA, SITE_COORDS, SITE_GPS,
  STAGES, STAGE_NOTES, TEP, WATER, num,
} from './data.js';
import { SIGN_TIMES, blank, minimap } from './blank.js';
import { ZONES, fmtDistance, zoneName } from './zones.js';
import { icon, svgIcon } from './icons.js';
import { railX } from './rail.js';
import { t } from './i18n.js';

gsap.registerPlugin(MotionPathPlugin);

const CREST = `${import.meta.env.BASE_URL}brand/eco-service-shield.png`;
const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];

function toEl(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

function mark(node, state) {
  if (!node) return;
  node.classList.remove('todo', 'now', 'done', 'back');
  node.classList.add(state);
}

function draw(tl, path, { d = 0.9, at, e = 'power2.inOut' } = {}) {
  const L = path.getTotalLength();
  tl.set(path, { strokeDasharray: `${L} ${L}`, strokeDashoffset: L, autoAlpha: 1 }, at);
  tl.to(path, { strokeDashoffset: 0, duration: d, ease: e }, '<');
}

function ride(tl, tok, path, { d = 1, at, e = 'power1.inOut' } = {}) {
  tl.set(tok, { autoAlpha: 1, scale: 1 }, at);
  tl.to(tok, { duration: d, ease: e, motionPath: { path, align: path, alignOrigin: [0.5, 0.5] } }, '<');
}

const pop = (tl, els, at) =>
  tl.fromTo(els, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }, at);

// Types text into an element, character by character.
function typeIn(tl, el, text, { d = 1.1, at } = {}) {
  const o = { n: 0 };
  tl.call(() => { el.textContent = ''; }, null, at);
  tl.to(o, { n: text.length, duration: d, ease: 'none', onUpdate: () => { el.textContent = text.slice(0, Math.round(o.n)); } }, '<');
}

const tick = () =>
  '<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5"/><path d="M7.2 12.4l3.2 3.2 6.4-6.6"/></svg>';

// Numbers in Martian Mono, words in Geologica.
const token = (cls, text = APP_NO, w = 128) =>
  `<g class="tok ${cls}"><rect x="${-w / 2}" y="-17" width="${w}" height="34" rx="9"/><text class="${/^\d+$/.test(text) ? 'num' : ''}" x="0" y="5.5" text-anchor="middle">${text}</text></g>`;

const sheetHead = (title, sub, right = '') => `
  <header class="sheet-hd">
    <img src="${CREST}" alt="" />
    <div class="sh-t"><b>${title}</b><span>${sub}</span></div>
    ${right}
  </header>`;

// Words in Geologica, the number itself in Martian Mono.
const idLine = (words = t('Application No.')) => `${words} <span class="mono">${APP_NO}</span>`;

/* Official documents are drawn as paper: a flat portrait sheet with the crest, numbered,
   hairline-ruled fields and signature lines. System screens stay dark. */
const paperHead = (title) => `
  <header class="pd-hd">
    <img src="${CREST}" alt="" />
    <b class="pd-title">${title}</b>
    <span class="pd-id">${idLine()}</span>
  </header>`;

function viz(host, html, phases) {
  const el = toEl(html);
  host.appendChild(el);
  const original = el.innerHTML;
  const originalClass = el.className;
  const originalStyle = el.getAttribute('style') || '';
  let tl = null;
  let cur = -1;
  const build = (from, to, lead = 0) => {
    const tln = gsap.timeline({ paused: true });
    if (lead) tln.to({}, { duration: lead });
    for (let k = from; k <= to; k++) phases[k]?.(el, tln);
    return tln;
  };
  return {
    el,
    set(p, { instant = false, lead = 0 } = {}) {
      if (tl) {
        tl.progress(1, false);
        tl.kill();
        tl = null;
      }
      if (instant || p < cur) {
        el.innerHTML = original;
        el.className = originalClass;
        el.setAttribute('style', originalStyle);
        const tln = build(0, p);
        tln.progress(1, false);
        tln.kill();
      } else if (p > cur) {
        tl = build(cur + 1, p, lead);
        tl.play();
      }
      cur = p;
    },
    destroy() {
      tl?.kill();
      el.remove();
    },
  };
}

/* ---------- Stage 1: the electronic application on my.gov.uz, step by step ----------
   The form follows the portal: one tab per step, the applicant's own data already filled in.
   Phase 0: step 1, the object of expertise.
   Phase 1: step 2, technical and economic indicators; the green share is computed by the form.
   Phase 2: step 3, environmental impact: emissions, water and waste; totals add themselves up.
   Phase 3: step 4, the object drawn on the satellite map, documents attached, submitted. */
const typed = (text, mono = false) => `<span class="typed ${mono ? 'mono' : ''}" data-text="${text}"></span>`;
const inpField = (label, value, { sel = false, wide = false, n = false } = {}) => `
  <label class="ap-f ${wide ? 'wide' : ''}"><span class="ap-l">${label}</span>
    <span class="inp ${n ? 'n' : ''}">${value}${sel ? `<span class="sel-ic">${icon('chevronDown')}</span>` : ''}<i class="caret"></i><span class="ap-ok">${icon('check')}</span></span></label>`;

// Each input gets focus, its value is typed (or revealed), then it is marked as done.
function fillInputs(tl, scope, { fast = false } = {}) {
  qa(scope, '.ap-f').forEach((f, i) => {
    const inp = q(f, '.inp');
    tl.call(() => inp.classList.add('focus'), null, i ? '+=0.06' : '+=0.15');
    const tx = q(f, '.typed');
    if (tx) {
      const k = fast ? 0.012 : 0.02;
      typeIn(tl, tx, tx.dataset.text, { d: Math.min(fast ? 0.5 : 0.85, 0.22 + tx.dataset.text.length * k), at: '+=0.04' });
    } else tl.fromTo(q(f, '.rv'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'power2.out' }, '+=0.04');
    tl.call(() => { inp.classList.remove('focus'); inp.classList.add('done'); }, null, '+=0.04');
  });
}

function countUp(tl, el, to, d, { dur = 0.9, at, suffix = '' } = {}) {
  const o = { v: 0 };
  tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = `${num(o.v, d)}${suffix}`; } }, at);
}

function press(tl, btn, at = '+=0.25') {
  tl.to(btn, { scale: 0.93, duration: 0.14, ease: 'power2.in' }, at);
  tl.call(() => btn.classList.add('pressed'));
  tl.to(btn, { scale: 1, duration: 0.45, ease: 'back.out(3)' });
  tl.call(() => btn.classList.remove('pressed'), null, '+=0.15');
}

function apply(host) {
  const TABS = ['Applicant data', 'Object of expertise', 'Technical and economic indicators', 'Environmental impact', 'Map and documents'].map(t);
  const m2 = (s) => `${t(s)}, m²`;
  const tbl = (cls, title, head, rows, total) => `
    <section class="ap-tb ${cls}">
      <h4>${title}</h4>
      <table>
        <thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((r) => `<tr class="row">${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
          ${total ? `<tr class="tot">${total.map((c) => `<td>${c}</td>`).join('')}</tr>` : ''}
        </tbody>
      </table>
    </section>`;
  const mono = (v) => `<span class="mono">${v}</span>`;
  const cnt = (v, d) => `<span class="mono cnt" data-v="${v}" data-d="${d}">${num(0, d)}</span>`;

  return viz(host, `
  <div class="viz viz-apply">
    <section class="sheet ap-win">
      <header class="pw-hd"><span class="pw-logo">${icon('landmark')}</span><div><b>my.gov.uz</b><span>${t('Single Portal of Interactive Public Services')}</span></div><span class="chip cyan pw-e">${icon('monitor')}${t('Electronic application')}</span></header>
      <div class="ap-body">
        <h3 class="ap-title">${t('Application for state ecological expertise')}</h3>
        <ol class="ap-tabs">${TABS.map((s, i) => `<li class="ap-tab ${i === 0 ? 'done' : ''}"><span class="n mono">${i ? i : icon('check')}</span><span class="tt">${s}</span></li>`).join('')}</ol>
        <div class="ap-panes">
          <div class="ap-pane p0">
            <div class="ap-auto">${icon('fingerprint')}<span><b>${t('Applicant')}</b> <i class="redact w9"></i> · ${t('TIN / PINFL')} <i class="redact w6"></i></span><span class="chip leaf">${icon('check')}${t('Filled in from the personal account')}</span></div>
            <div class="ap-grid">
              ${inpField(t('Name of the object of expertise'), typed(t('School building construction')), { wide: true })}
              ${inpField(t('Type of activity'), typed(t('Education: new construction')), { sel: true })}
              ${inpField(t('Environmental impact category'), typed(t('Category III')), { sel: true })}
              ${inpField(t('Region'), typed(t('Andijan region')), { sel: true })}
              ${inpField(t('District'), typed(t('Baliqchi district')), { sel: true })}
              ${inpField(t('Type of materials'), typed(t('Draft environmental impact statement')), { sel: true, wide: true })}
            </div>
          </div>
          <div class="ap-pane p1">
            <div class="ap-grid tep">
              ${inpField(t('Main and auxiliary buildings and structures'), typed(num(TEP.buildings), true), { n: true })}
              ${inpField(m2('Total land area of the object'), typed(num(TEP.land), true), { n: true })}
              ${inpField(m2('Landscaped area'), typed(num(TEP.green), true), { n: true })}
              ${inpField(m2('Built-up area'), typed(num(TEP.built), true), { n: true })}
              ${inpField(m2('Paved area'), typed(num(TEP.paved), true), { n: true })}
              ${inpField(m2('Total internal floor area of the buildings'), typed(num(TEP.floor), true), { n: true })}
            </div>
            <div class="ap-calc">
              <span class="ck-ic">${icon('calculator')}</span>
              <div class="ac-t"><b>${t('Green coverage')}</b><span>${t('Landscaped area ÷ total land area')}</span></div>
              <span class="ac-bar"><i></i><em style="left:30%"><span>≥ 30%</span></em></span>
              <b class="mono ac-v">0.0%</b>
              <span class="chip cyan ac-chip">${icon('check')}${t('Calculated automatically')}</span>
            </div>
          </div>
          <div class="ap-pane p2">
            ${tbl('air', t('Pollutants emitted into the atmosphere'),
              ['№', t('Code'), t('Pollutant'), t('Class'), t('g/s'), t('t/year')],
              AIR.map((a, i) => [i + 1, mono(a.code), t(a.name), `${a.cls} ${t('class')}`, mono(num(a.gs, 4)), mono(num(a.ty, 4))]),
              ['', '', `<b>${t('Total')}</b>`, '', cnt(AIR_TOTAL.gs, 4), cnt(AIR_TOTAL.ty, 4)])}
            <div class="ap-tb2">
              ${tbl('wat', t('Water use and wastewater'),
                [t('Type'), t('Source or receiver'), t('m³/day'), t('m³/year')],
                [[t('Water use'), t('District drinking-water network'), mono(num(WATER.day, 1)), mono(num(WATER.year))],
                 [t('Wastewater'), t('District sewer network'), mono(num(SEWAGE.day, 1)), mono(num(SEWAGE.year))]])}
              ${tbl('wst', t('Waste'),
                [t('Code'), t('Waste'), t('Class'), t('t/year')],
                [[mono(HAZ_WASTE.code), t('Spent mercury lamps'), 'I', mono(num(HAZ_WASTE.ty, 3))],
                 [mono(MSW.code), t('Solid domestic waste'), 'V', mono(num(MSW.ty, 1))]])}
            </div>
          </div>
          <div class="ap-pane p3">
            <div class="ap-mapw">
              <div class="ap-tools"><span class="opt sel">${icon('penLine')}${t('Draw on the map')}</span><span class="opt">${icon('locateFixed')}${t('Enter coordinates')}</span></div>
              <div class="ap-map">${minimap(SITE_COORDS, { W: 180, H: 120 })}<span class="ap-pen">${icon('penLine')}</span></div>
            </div>
            <div class="ap-crd">
              <table>
                <thead><tr><th>№</th><th>${t('Latitude')}</th><th>${t('Longitude')}</th></tr></thead>
                <tbody>${SITE_COORDS.map(([la, lo], i) => `<tr class="row"><td>${i + 1}</td><td class="mono">${la.toFixed(5)}</td><td class="mono">${lo.toFixed(5)}</td></tr>`).join('')}</tbody>
              </table>
              <p class="ap-area">${icon('scan')}<span>${t('Area')}: <b class="mono">≈ ${num(SITE_AREA)} m²</b></span><span class="chip cyan">${t('Calculated automatically')}</span></p>
              <div class="ap-att"><span class="att-ic">${icon('paperclip')}</span><span class="att-t"><b>${t('Project documents')}</b><span class="att-bar"><i></i></span></span><span class="att-ok chip leaf">${icon('check')}${t('Attached')}</span></div>
            </div>
          </div>
        </div>
        <div class="ap-foot">
          <span class="ap-stepn">${t('Step')} <b class="mono">1</b> / 4</span>
          <span class="btn ap-next">${t('Next')}${icon('arrowRight')}</span>
          <span class="btn ap-send">${icon('send')}${t('Submit')}</span>
        </div>
      </div>
    </section>
    <div class="ap-done chip leaf">${icon('circleCheck')}${t('Electronic application submitted')} · № <span class="mono">${APP_NO}</span></div>
  </div>`, [0, 1, 2, 3].map((k) => (r, tl) => {
    const pane = q(r, `.ap-pane.p${k}`);
    if (k === 0) {
      tl.from(q(r, '.ap-win'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(qa(r, '.ap-tab'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, '<0.3');
    } else {
      press(tl, q(r, '.ap-next'), '+=0.1');
      tl.to(q(r, `.ap-pane.p${k - 1}`), { autoAlpha: 0, x: -24, duration: 0.35, ease: 'power2.in' });
    }
    tl.call(() => {
      qa(r, '.ap-tab').forEach((tb, i) => { tb.classList.toggle('done', i <= k); tb.classList.toggle('now', i === k + 1); });
      q(r, '.ap-stepn b').textContent = String(k + 1);
      r.classList.toggle('last', k === 3);
    });
    tl.fromTo(pane, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' });

    if (k === 0) {
      tl.fromTo(q(pane, '.ap-auto'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power2.out' }, '<0.2');
      fillInputs(tl, pane);
    }
    if (k === 1) {
      fillInputs(tl, pane, { fast: true });
      tl.fromTo(q(pane, '.ap-calc'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '+=0.15');
      tl.to(r, { '--green': `${Math.min(GREEN_SHARE, 100)}%`, duration: 1, ease: 'power2.out' }, '+=0.1');
      countUp(tl, q(pane, '.ac-v'), GREEN_SHARE, 1, { dur: 1, at: '<', suffix: '%' });
      tl.fromTo(q(pane, '.ac-chip'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' });
    }
    if (k === 2) {
      qa(pane, '.ap-tb').forEach((tb, i) => {
        tl.from(tb, { autoAlpha: 0, y: 12, duration: 0.5, ease: 'expo.out' }, i ? '<0.25' : '<0.15');
        tl.from(qa(tb, 'tr.row'), { autoAlpha: 0, x: -14, duration: 0.45, ease: 'expo.out', stagger: 0.22 }, '<0.2');
      });
      tl.from(q(pane, 'tr.tot'), { autoAlpha: 0, duration: 0.4 }, '+=0.1');
      qa(pane, '.cnt').forEach((c, i) => countUp(tl, c, Number(c.dataset.v), Number(c.dataset.d), { dur: 0.9, at: i ? '<' : '<0.1' }));
    }
    if (k === 3) {
      const map = q(pane, '.ap-map');
      const pen = q(pane, '.ap-pen');
      const vs = qa(pane, '.mm-v');
      const rows = qa(pane, 'tr.row');
      const at = (i) => {
        const a = map.getBoundingClientRect();
        const b = q(vs[i], 'circle').getBoundingClientRect();
        return [b.left + b.width / 2 - a.left, b.top + b.height / 2 - a.top];
      };
      tl.set([...vs, ...rows, q(pane, '.mm-poly'), q(pane, '.mm-fill')], { autoAlpha: 0 });
      tl.set(pen, { autoAlpha: 1, x: () => at(0)[0] + 60, y: () => at(0)[1] + 50 });
      vs.forEach((v, i) => {
        tl.to(pen, { x: () => at(i)[0], y: () => at(i)[1], duration: i ? 0.55 : 0.7, ease: 'power2.inOut' }, i ? '+=0.05' : '+=0.2');
        tl.fromTo(v, { autoAlpha: 0, scale: 0.2, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(3)' });
        tl.fromTo(rows[i], { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'expo.out' }, '<');
      });
      tl.to(pen, { x: () => at(0)[0], y: () => at(0)[1], duration: 0.55, ease: 'power2.inOut' }, '+=0.05');
      draw(tl, q(pane, '.mm-poly'), { d: 0.9, at: '<' });
      tl.to(q(pane, '.mm-fill'), { autoAlpha: 1, duration: 0.5 }, '>-0.2');
      tl.to(pen, { autoAlpha: 0, duration: 0.3 }, '<');
      tl.from(q(pane, '.ap-area'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out' }, '+=0.05');
      tl.from(q(pane, '.ap-att'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out' }, '+=0.1');
      tl.to(r, { '--att': '100%', duration: 0.9, ease: 'power2.inOut' });
      tl.fromTo(q(pane, '.att-ok'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' });
      tl.fromTo(q(r, '.ap-send'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, '+=0.1');
      tl.to(q(r, '.ap-send'), { scale: 0.93, duration: 0.14, ease: 'power2.in' }, '+=0.25');
      tl.call(() => q(r, '.ap-send').classList.add('pressed'));
      tl.to(q(r, '.ap-send'), { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      tl.fromTo(q(r, '.ap-done'), { autoAlpha: 0, y: 12, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' }, '<0.15');
    }
  }));
}

/* ---------- Stage 1: my.gov.uz -> ECO SERVICE -> two units at once ---------- */
function flow(host) {
  const P = {
    ab: 'M106 310 H304',
    bc: 'M356 310 H531',
    cd: 'M639 310 C740 310 776 140 879 140',
    ce: 'M639 310 C740 310 776 480 879 480',
  };
  // Only the lit routes carry the r-* key; the grey tracks underneath stay anonymous.
  const paths = (cls) => Object.entries(P).map(([k, d]) => `<path class="${cls}${cls === 'route' ? ` r-${k}` : ''}" d="${d}"/>`).join('');
  return viz(host, `
  <div class="viz viz-geo viz-flow" style="--ar:1000/620">
    <svg class="geo" viewBox="0 0 1000 620" aria-hidden="true">
      <g class="tracks">${paths('track')}</g>
      <g class="routes">${paths('route')}</g>
      <g class="node n-a todo"><circle class="disc" cx="80" cy="310" r="26"/>${svgIcon('user', 80, 310, 24)}</g>
      <g class="node n-b todo"><circle class="disc" cx="330" cy="310" r="26"/>${svgIcon('landmark', 330, 310, 24)}</g>
      <g class="node hub n-c todo"><circle class="halo" cx="585" cy="310" r="72"/><circle class="disc" cx="585" cy="310" r="50"/><image href="${CREST}" x="558" y="278" width="54" height="65"/></g>
      <g class="node n-d todo"><circle class="ping" cx="905" cy="140" r="26"/><circle class="disc" cx="905" cy="140" r="26"/>${svgIcon('mapPin', 905, 140, 24)}</g>
      <g class="node n-e todo"><circle class="ping" cx="905" cy="480" r="26"/><circle class="disc" cx="905" cy="480" r="26"/>${svgIcon('clipboardCheck', 905, 480, 24)}</g>
      ${token('t1')}${token('t2')}${token('t3')}
    </svg>
    <div class="lbl" style="left:8%;top:56.5%"><b>${t('Applicant')}</b><span>${t('Submits the application')}</span></div>
    <div class="lbl" style="left:33%;top:56.5%"><b>my.gov.uz</b><span>${t('Single Portal of Interactive Public Services')}</span></div>
    <div class="lbl" style="left:58.5%;top:61%"><b>ECO SERVICE</b><span>eco-service.uz</span></div>
    <div class="lbl end up" style="left:93.2%;top:16.6%"><b>${t('District Ecological Inspector')}</b><span>${t('Conducts an on-site inspection')}</span></div>
    <div class="lbl end" style="left:93.2%;top:83.6%"><b>${t('Application Intake Department')}</b><span>${t('Reviews the application form and project')}</span></div>
    <div class="lbl sync" style="left:83%;top:47.2%"><span class="chip cyan">${t('Routed simultaneously')}</span></div>
  </div>`, [
    (r, tl) => {
      tl.from(qa(r, '.node'), { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.7)', stagger: 0.09 });
      tl.from(qa(r, '.lbl:not(.sync)'), { autoAlpha: 0, y: 12, duration: 0.7, ease: 'expo.out', stagger: 0.07 }, '<0.15');
      tl.call(() => mark(q(r, '.n-a'), 'now'));
      draw(tl, q(r, '.r-ab'), { d: 0.8, at: '+=0.2' });
      ride(tl, q(r, '.t1'), q(r, '.r-ab'), { d: 0.8, at: '<' });
      tl.call(() => { mark(q(r, '.n-a'), 'done'); mark(q(r, '.n-b'), 'now'); });
      draw(tl, q(r, '.r-bc'), { d: 0.9, at: '+=0.15' });
      ride(tl, q(r, '.t1'), q(r, '.r-bc'), { d: 0.9, at: '<' });
      tl.call(() => { mark(q(r, '.n-b'), 'done'); mark(q(r, '.n-c'), 'now'); });
      tl.to(q(r, '.t1'), { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' });
      tl.fromTo(q(r, '.halo'), { scale: 0.7, autoAlpha: 0.9, transformOrigin: '50% 50%' }, { scale: 1.35, autoAlpha: 0, duration: 1.3, ease: 'power2.out' }, '<0.1');
    },
    (r, tl) => {
      tl.to(q(r, '.t1'), { autoAlpha: 0, duration: 0.35 });
      draw(tl, q(r, '.r-cd'), { d: 1.1, at: '<0.1' });
      draw(tl, q(r, '.r-ce'), { d: 1.1, at: '<' });
      ride(tl, q(r, '.t2'), q(r, '.r-cd'), { d: 1.1, at: '<' });
      ride(tl, q(r, '.t3'), q(r, '.r-ce'), { d: 1.1, at: '<' });
      tl.to([q(r, '.t2'), q(r, '.t3')], { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' });
      tl.call(() => { mark(q(r, '.n-c'), 'done'); mark(q(r, '.n-d'), 'now'); mark(q(r, '.n-e'), 'now'); }, null, '<');
      tl.fromTo(qa(r, '.ping'), { scale: 1, autoAlpha: 0.9, transformOrigin: '50% 50%' }, { scale: 2.7, autoAlpha: 0, duration: 1.4, ease: 'power2.out' });
      pop(tl, q(r, '.sync'), '<0.1');
    },
  ]);
}

/* ---------- Stage 1: the application record ---------- */
function record(host) {
  const rows = [
    [t('Application number and date'), `<span class="mono">${APP_NO}</span><i class="redact w4"></i>`],
    [t('Applicant: full name or company name'), '<i class="redact w9"></i>'],
    [t('TIN / PINFL'), '<i class="redact w6"></i>'],
    [t('Object of expertise'), t('School building construction')],
    [t('Environmental impact category'), t('Category III')],
    [t('Type of materials'), '<i class="redact w7"></i>'],
  ];
  return viz(host, `
  <div class="viz viz-paper viz-record">
    <article class="paper">
      ${paperHead(t('APPLICATION RECORD'))}
      <ol class="pd-fields">
        ${rows.map(([l, v], i) => `<li><span class="pd-n mono">${i + 1}</span><div><span class="pd-l">${l}</span><span class="pd-v">${v}</span></div></li>`).join('')}
      </ol>
      <footer class="pd-foot">${t('Received through my.gov.uz')}</footer>
    </article>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.paper'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(qa(r, '.pd-fields li'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out', stagger: 0.1 }, '<0.3');
      tl.fromTo(qa(r, '.pd-v'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power2.out', stagger: 0.1 }, '<0.15');
    },
  ]);
}

/* ---------- Stage 1: Application Intake Department ---------- */
function intake(host) {
  return viz(host, `
  <div class="viz viz-intake">
    <div class="sheet">
      ${sheetHead(t('Application review'), t('Application Intake Department'), `<span class="id">${idLine(t('No.'))}</span>`)}
      <ul class="checks">
        <li><span class="ck-ic">${icon('fileText')}</span><span class="ck-t"><b>${t('Application form')}</b><span>${t('Completeness and accuracy of the data')}</span></span><span class="ck-s">${tick()}</span></li>
        <li><span class="ck-ic">${icon('scrollText')}</span><span class="ck-t"><b>${t('Project documents')}</b><span>${t('Compliance of project materials with requirements')}</span></span><span class="ck-s">${tick()}</span></li>
        <li><span class="ck-ic">${icon('mapPinned')}</span><span class="ck-t"><b>${t('Inspector’s site schematic')}</b><span>${t('Status of the district inspector’s findings')}</span></span><span class="ck-s"><span class="chip leaf">${t('Accepted')}</span></span></li>
        <li class="rate"><span class="ck-ic">${icon('gauge')}</span><span class="ck-t"><b>${t('Designer rating')}</b><span>${t('The project developer is rated on a scale of 1 to 100')}</span></span><span class="ck-s"><span class="score mono">··</span></span></li>
      </ul>
      <div class="decision">
        <span class="opt yes">${icon('check')}${t('Approve')}</span>
        <span class="opt">${icon('rotateCcw')}${t('Return for revision')}</span>
        <span class="opt">${icon('x')}${t('Reject')}</span>
      </div>
      <div class="scale">
        <span class="mono end">1</span>
        <span class="bar"><span class="fill"></span><span class="knob"></span></span>
        <span class="mono end">100</span>
        <span class="val mono">0</span>
      </div>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.sheet'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(qa(r, '.checks li'), { autoAlpha: 0, y: 12, duration: 0.6, ease: 'expo.out', stagger: 0.12 }, '<0.25');
      qa(r, '.tick').forEach((tk, i) => {
        draw(tl, tk.querySelector('path'), { d: 0.45, at: i ? '+=0.12' : '+=0.1' });
        tl.to(tk, { '--on': 1, duration: 0.3 }, '<');
      });
      tl.from(q(r, '.checks .chip'), { autoAlpha: 0, scale: 0.7, duration: 0.5, ease: 'back.out(2)' }, '+=0.1');
    },
    (r, tl) => {
      const val = q(r, '.val');
      const score = q(r, '.score');
      const o = { v: 0 };
      tl.call(() => r.classList.add('decided'));
      pop(tl, [q(r, '.decision'), q(r, '.scale')]);
      tl.call(() => q(r, '.opt.yes').classList.add('sel'), null, '+=0.25');
      tl.fromTo(q(r, '.opt.yes'), { scale: 0.94 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, '<');
      tl.to(o, {
        v: 85, duration: 1.4, ease: 'power3.out',
        onUpdate: () => {
          const n = Math.round(o.v);
          val.textContent = n;
          r.style.setProperty('--rate', `${o.v}%`);
          if (n > 0) score.textContent = n;
        },
      }, '<0.15');
    },
  ]);
}

/* ---------- Stage 2: payment ----------
   Phase 0: the invoice is issued and reaches the applicant's account.
   Phase 1: the applicant enters the invoice number and pays; the money flies to the Center's account.
   Phase 2: the system records the payment and flips the status by itself. */
function payment(host) {
  const S = [
    ['receipt', t('Invoice issued'), t('An invoice is prepared for payment')],
    ['send', t('Sent to the account'), t('It appears in the applicant’s personal account')],
    ['creditCard', t('Payment made'), t('The applicant pays the invoice')],
    ['circleCheck', t('Status updated'), t('The system records the payment')],
  ];
  const coin = (cls, ic) => `<g class="coin ${cls}"><circle r="21"/>${svgIcon(ic, 0, 0, 22)}</g>`;
  return viz(host, `
  <div class="viz viz-pay">
    <div class="mline">
      <div class="mtrack"><span class="mfill"></span></div>
      ${S.map(([ic, ti, s], i) => `<div class="mst todo m${i}" style="left:${12.5 + i * 25}%"><span class="d">${icon(ic)}</span><b>${ti}</b><span>${s}</span></div>`).join('')}
    </div>
    <div class="pay-row">
      <section class="sheet pay-win">
        <header class="pw-hd"><span class="pw-logo">${icon('landmark')}</span><div><b>my.gov.uz</b><span>${t('Personal account · Payment')}</span></div></header>
        <div class="pw-body">
          <label class="pw-f"><span>${t('Invoice number')}</span><span class="inp"><span class="typed mono"></span><i class="caret"></i></span></label>
          <div class="pw-kv"><span>${t('Service')}</span><b>${t('State ecological expertise')}</b></div>
          <div class="pw-kv"><span>${t('Amount')}</span><i class="redact w6"></i></div>
          <span class="btn pay-btn">${icon('creditCard')}${t('Pay')}</span>
        </div>
      </section>
      <section class="panel bal">
        <div class="bal-hd"><span class="bal-ic">${icon('building')}</span><div><b>${t('State Ecological Expertise Center')}</b><span>${t('Account balance')}</span></div></div>
        <div class="bal-in">${icon('banknote')}<div><b>${t('Incoming payment')}</b><span class="mono">${INVOICE_NO}</span></div><span class="chip leaf">${icon('check')}${t('Received')}</span></div>
      </section>
      <svg class="fly" aria-hidden="true">${coin('c0', 'plane')}${coin('c1', 'banknote')}${coin('c2', 'banknote')}</svg>
    </div>
    <div class="status">
      <span class="k">${t('Application status')}</span>
      <span class="flip"><span class="face a chip amber">${icon('clock')}${t('Awaiting payment')}</span><span class="face b chip leaf">${icon('check')}${t('Paid')}</span></span>
    </div>
    <p class="auto">${icon('circleCheck')}${t('No manual confirmation required: the status changes automatically.')}</p>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.mtrack'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.9, ease: 'power2.inOut' });
      pop(tl, qa(r, '.mst'), '<0.1');
      tl.call(() => mark(q(r, '.m0'), 'done'), null, '+=0.1');
      tl.to(r, { '--pay': '33.33%', duration: 0.8, ease: 'power2.inOut' });
      tl.call(() => mark(q(r, '.m1'), 'now'));
      pop(tl, [q(r, '.pay-win'), q(r, '.bal'), q(r, '.status')], '<0.2');
    },
    (r, tl) => {
      const row = q(r, '.pay-row');
      const svg = q(r, '.fly');
      const btn = q(r, '.pay-btn');
      // The flight: from the Pay button, arcing over the gap, into the Center's account.
      const box = row.getBoundingClientRect();
      const b = btn.getBoundingClientRect();
      const a = q(r, '.bal-ic').getBoundingClientRect();
      const x1 = b.right - box.left - 8;
      const y1 = b.top + b.height / 2 - box.top;
      const x2 = a.left + a.width / 2 - box.left;
      const y2 = a.top + a.height / 2 - box.top;
      const lift = Math.max(70, (x2 - x1) * 0.35);
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.insertAdjacentHTML('afterbegin', `<path class="fpath" d="M${x1} ${y1} C${x1 + (x2 - x1) * 0.3} ${Math.min(y1, y2) - lift} ${x2 - (x2 - x1) * 0.3} ${Math.min(y1, y2) - lift} ${x2} ${y2}"/>`);
      const path = q(svg, '.fpath');

      tl.call(() => { mark(q(r, '.m1'), 'done'); mark(q(r, '.m2'), 'now'); });
      tl.call(() => q(r, '.inp').classList.add('focus'), null, '+=0.2');
      typeIn(tl, q(r, '.typed'), INVOICE_NO, { d: 1.2, at: '+=0.15' });
      tl.call(() => q(r, '.inp').classList.remove('focus'), null, '+=0.15');
      tl.to(btn, { scale: 0.92, duration: 0.14, ease: 'power2.in' }, '+=0.2');
      tl.call(() => btn.classList.add('pressed'));
      tl.to(btn, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      draw(tl, path, { d: 1, at: '<' });
      ['.c0', '.c1', '.c2'].forEach((c, i) => {
        ride(tl, q(r, c), path, { d: 1.25, at: i ? '<0.2' : '<0.05', e: 'power2.inOut' });
      });
      tl.to(qa(r, '.coin'), { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.3, ease: 'power2.in', stagger: 0.12 }, '>-0.45');
      tl.call(() => q(r, '.bal').classList.add('credited'), null, '<');
      tl.fromTo(q(r, '.bal-ic'), { scale: 1 }, { scale: 1.18, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, '<');
      tl.fromTo(q(r, '.bal-in'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '<0.1');
      tl.to(path, { autoAlpha: 0, duration: 0.6 }, '<0.3');
      tl.call(() => mark(q(r, '.m2'), 'done'), null, '<');
      tl.to(r, { '--pay': '66.66%', duration: 0.7, ease: 'power2.inOut' }, '<');
    },
    (r, tl) => {
      tl.to(r, { '--pay': '100%', duration: 0.7, ease: 'power2.inOut' });
      tl.call(() => mark(q(r, '.m3'), 'done'));
      tl.to(q(r, '.face.a'), { rotateX: -90, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '<0.2');
      tl.fromTo(q(r, '.face.b'), { rotateX: 90, autoAlpha: 0 }, { rotateX: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' });
      pop(tl, q(r, '.auto'), '<0.2');
    },
  ]);
}

/* ---------- Stage 3: assignment ---------- */
function assign(host) {
  const areas = [['wind', t('Atmospheric air')], ['droplets', t('Water resources')], ['trash', t('Waste')], ['bird', t('Biodiversity')]];
  const log = [
    'Received from my.gov.uz',
    'Routed to the inspector and the Intake Department',
    'On-site inspection: accepted',
    'Intake review: approved, designer rated',
    'Invoice paid: status “Paid”',
    'Assigned to the responsible expert',
  ].map(t);
  return viz(host, `
  <div class="viz viz-assign">
    <div class="sheet as-main">
      ${sheetHead(`${t('Application No.')} <span class="mono">${APP_NO}</span>`, t('Assignment to an expert'), `<span class="chip leaf">${t('Paid')}</span>`)}
      <dl class="kv">
        <div><dt>${t('Object')}</dt><dd>${t('School building construction')}</dd></div>
        <div><dt>${t('Category')}</dt><dd>${t('Category III')}</dd></div>
        <div class="dl-row"><dt>${t('Deadline')}</dt><dd class="ic-l">${icon('calendarClock')}${t('Calculated automatically')}</dd></div>
        <div class="expert"><dt>${t('Expert')}</dt><dd><span class="pend">${t('Being assigned…')}</span><span class="got ic-l">${icon('userCheck')}${t('Responsible expert')}</span></dd></div>
      </dl>
      <div class="as-act"><span class="btn">${icon('userCheck')}${t('Assign')}</span></div>
    </div>
    <div class="as-side">
      <section class="panel areas"><h3>${t('Areas of expertise')}</h3><div class="chips">${areas.map(([ic, s]) => `<span class="chip">${icon(ic)}${s}</span>`).join('')}</div></section>
      <section class="panel log"><h3>${icon('history')}${t('Every action in the history')}</h3><ol>${log.map((s) => `<li>${s}</li>`).join('')}</ol></section>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.as-main'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(qa(r, '.kv > div'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.1 }, '<0.25');
      pop(tl, q(r, '.areas'), '<0.3');
      tl.from(qa(r, '.areas .chip'), { autoAlpha: 0, scale: 0.8, duration: 0.5, ease: 'back.out(2)', stagger: 0.08 }, '<0.2');
      tl.to(q(r, '.btn'), { scale: 0.93, duration: 0.14, ease: 'power2.in' }, '+=0.2');
      tl.call(() => q(r, '.btn').classList.add('pressed'));
      tl.to(q(r, '.btn'), { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      tl.to(q(r, '.pend'), { autoAlpha: 0, y: -8, duration: 0.3 }, '<');
      tl.fromTo(q(r, '.got'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '<0.15');
    },
    (r, tl) => {
      // One idea per step: the deadline row and the history carry it; the rest steps back.
      tl.to([q(r, '.areas'), q(r, '.as-act')], { opacity: 0.28, duration: 0.6, ease: 'power2.out' });
      tl.call(() => q(r, '.kv .dl-row')?.classList.add('lit'), null, '<');
      pop(tl, q(r, '.log'), '<0.1');
      tl.from(qa(r, '.log li'), { autoAlpha: 0, x: -12, duration: 0.5, ease: 'expo.out', stagger: 0.14 }, '<0.2');
    },
  ]);
}

/* ---------- Stage 1: the inspector's digital site inspection act ----------
   The form the inspector fills in on the system: the object on the satellite map, its corners as
   measured on site (they must match the application), and the nine criteria with comments. */
let ZRES = null;
ZONES.then((res) => { ZRES = res; });

function inspect(host) {
  const Y = t('Present');
  const N = t('Absent');
  let zv = N;
  let zc = t('Checked against the restricted-zone layers');
  if (ZRES?.complete) {
    if (ZRES.insideAny) {
      const hit = ZRES.layers.find((l) => l.inside?.length);
      zv = Y;
      zc = zoneName(hit.inside[0]);
    } else zc = `${t('Outside the zones; nearest')} ${fmtDistance(ZRES.nearest.distance)}`;
  }
  const FOUND = [
    [Y, t('Four trees along the edge of the plot')],
    [Y, t('Two trees; to be transplanted under a permit')],
    [N, '—'],
    [Y, t('Houses about 140 m to the east')],
    [Y, t('Irrigation canal about 145 m to the south-west')],
    [Y, t('Fields about 160 m to the west')],
    [Y, t('Road and power line about 150 m to the north')],
    [N, '—'],
    [zv, zc],
  ];
  return viz(host, `
  <div class="viz viz-insp">
    <section class="sheet">
      ${sheetHead(`${t('Application review')} № <span class="mono">${APP_NO}</span>`, t('Digital site inspection act · District Ecological Inspector'), `<span class="chip cyan">${icon('monitor')}${t('Online')}</span>`)}
      <div class="in-top">
        <div class="in-map">${minimap(SITE_GPS, { W: 250, H: 112.5 })}</div>
        <div class="in-crd">
          <h4>${t('Geographic coordinates of the object')}</h4>
          <table>
            <thead><tr><th>№</th><th>${t('Latitude')}</th><th>${t('Longitude')}</th></tr></thead>
            <tbody>${SITE_GPS.map(([la, lo], i) => `<tr><td>${i + 1}</td><td class="mono">${la.toFixed(6)}</td><td class="mono">${lo.toFixed(6)}</td></tr>`).join('')}</tbody>
          </table>
          <span class="chip leaf in-match">${icon('check')}${t('Match the application coordinates')}</span>
        </div>
      </div>
      <div class="in-rows">
        ${CRITERIA.map((c, i) => `
          <div class="in-r">
            <span class="in-l">${icon(c.icon)}<span>${c.label}</span></span>
            <span class="inp sel ${FOUND[i][0] === Y ? 'y' : 'n'}"><span class="typed" data-text="${FOUND[i][0]}"></span><span class="sel-ic">${icon('chevronDown')}</span></span>
            <span class="inp cm"><span class="typed" data-text="${FOUND[i][1]}"></span><i class="caret"></i></span>
          </div>`).join('')}
      </div>
    </section>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.sheet'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from([q(r, '.in-map'), q(r, '.in-crd')], { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.1 }, '<0.3');
      tl.from(qa(r, '.in-crd tbody tr'), { autoAlpha: 0, x: -8, duration: 0.4, ease: 'expo.out', stagger: 0.08 }, '<0.2');
      tl.fromTo(q(r, '.in-match'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' });
      tl.from(qa(r, '.in-r'), { autoAlpha: 0, y: 6, duration: 0.4, ease: 'expo.out', stagger: 0.04 }, '<');
      qa(r, '.in-r').forEach((row) => {
        const [s, c] = qa(row, '.inp');
        const st = q(s, '.typed');
        const ct = q(c, '.typed');
        tl.call(() => s.classList.add('focus'), null, '+=0.04');
        typeIn(tl, st, st.dataset.text, { d: 0.22, at: '+=0.03' });
        tl.call(() => { s.classList.remove('focus'); s.classList.add('done'); c.classList.add('focus'); }, null, '+=0.03');
        typeIn(tl, ct, ct.dataset.text, { d: Math.min(0.6, 0.1 + ct.dataset.text.length * 0.011), at: '+=0.02' });
        tl.call(() => { c.classList.remove('focus'); c.classList.add('done'); }, null, '+=0.02');
      });
    },
  ]);
}

/* ---------- Stage 4: the public hearing ----------
   Phase 0: announced online; the district services, the mahalla and the residents are heard.
   Phase 1: the signed protocol, photos and video join the application's electronic file. */
function hearing(host) {
  const C = [300, 262];
  const R = 168;
  const at = (deg, r = R) => [C[0] + r * Math.cos((deg * Math.PI) / 180), C[1] + r * Math.sin((deg * Math.PI) / 180)];
  const P = [
    ['landmark', t('District ecology department'), 180],
    ['building', t('District administration'), -132],
    ['heartPulse', t('Sanitary and epidemiological service'), -90],
    ['users', t('Mahalla chairpersons'), -48],
    ['userCheck', t('Responsible expert'), 0],
  ];
  const people = [];
  for (let i = 0; i < 13; i++) {
    const deg = 30 + i * 10;
    people.push(at(deg, i % 2 ? 128 : 172));
  }
  const pct = (x, y) => `left:${(x / 600) * 100}%;top:${(y / 500) * 100}%`;
  const tally = [['users', t('Participants'), 52, ''], ['thumbsUp', t('In favour'), 49, 'leaf'], ['x', t('Objections'), 0, ''], ['messageCircle', t('Proposals'), 3, 'cyan']];
  const files = [['fileText', t('Hearing protocol'), 'PDF'], ['camera', t('Photos'), '12'], ['video', t('Video recording'), 'MP4']];
  return viz(host, `
  <div class="viz viz-hear">
    <div class="hr-scene viz-geo" style="--ar:600/500">
      <svg class="geo" viewBox="0 0 600 500" aria-hidden="true">
        <circle class="hr-ring" cx="${C[0]}" cy="${C[1]}" r="${R}"/>
        <g class="tracks">${P.map(([, , d]) => { const [x, y] = at(d); return `<path class="route hr-sp" d="M${x} ${y} L${C[0]} ${C[1]}"/>`; }).join('')}</g>
        <g class="node hub n-obj todo"><circle class="halo" cx="${C[0]}" cy="${C[1]}" r="66"/><circle class="disc" cx="${C[0]}" cy="${C[1]}" r="46"/>${svgIcon('school', C[0], C[1], 40)}</g>
        ${P.map(([ic, , d], i) => { const [x, y] = at(d); return `<g class="node hr-p p${i} todo"><circle class="disc" cx="${x}" cy="${y}" r="27"/>${svgIcon(ic, x, y, 24)}</g>`; }).join('')}
        ${people.map(([x, y]) => `<g class="hr-res"><circle cx="${x}" cy="${y}" r="15"/>${svgIcon('user', x, y, 16)}</g>`).join('')}
      </svg>
      ${P.map(([, l, d]) => { const [x, y] = at(d); const up = y < C[1] - 20; return `<div class="lbl hr-l ${up ? 'up' : ''}" style="${pct(x, up ? y - 31 : y + 31)}"><span>${l}</span></div>`; }).join('')}
      <div class="lbl hr-l hr-rl" style="${pct(300, 474)}"><b>${t('Residents of the neighbouring mahallas')}</b></div>
      <div class="hr-bub b1" style="${pct(78, 392)}">${t('The district needs a new school')}</div>
      <div class="hr-bub b2" style="${pct(522, 392)}">${t('Please keep the trees')}</div>
    </div>
    <div class="hr-side">
      <section class="panel hr-note">
        <span class="hr-ic">${icon('megaphone')}</span>
        <div><b>${t('Public hearing')}</b><span>${t('Announced online in advance')}</span><span class="mono">25.09.2026 · 10:00</span><span>${t('Mahalla citizens’ assembly, Baliqchi district')}</span></div>
      </section>
      <section class="panel hr-tally">
        ${tally.map(([ic, l, v, c]) => `<div class="ht ${c}">${icon(ic)}<b class="mono" data-v="${v}">0</b><span>${l}</span></div>`).join('')}
      </section>
      <section class="panel hr-proto">
        <h3>${icon('upload')}${t('Uploaded to the electronic file')}</h3>
        <ul>${files.map(([ic, l, m]) => `<li>${icon(ic)}<span>${l}</span><span class="mono">${m}</span><span class="ok">${icon('check')}</span></li>`).join('')}</ul>
        <span class="att-bar"><i></i></span>
        <span class="chip leaf hr-ok">${icon('check')}${t('Attached to application No.')} <span class="mono">${APP_NO}</span></span>
      </section>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.hr-note'), { autoAlpha: 0, y: 20, duration: 0.8, ease: 'expo.out' });
      tl.from(q(r, '.n-obj'), { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.7)' }, '<0.2');
      tl.call(() => mark(q(r, '.n-obj'), 'now'));
      draw(tl, q(r, '.hr-ring'), { d: 1.2, at: '<' });
      tl.from(qa(r, '.hr-p'), { autoAlpha: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)', stagger: 0.12 }, '<0.3');
      tl.from(qa(r, '.hr-l:not(.hr-rl)'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out', stagger: 0.12 }, '<0.1');
      qa(r, '.hr-sp').forEach((p, i) => draw(tl, p, { d: 0.6, at: i ? '<0.1' : '-=0.3' }));
      tl.call(() => qa(r, '.hr-p').forEach((p) => mark(p, 'done')));
      tl.from(qa(r, '.hr-res'), { autoAlpha: 0, scale: 0.3, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(2.4)', stagger: 0.05 }, '+=0.1');
      tl.from(q(r, '.hr-rl'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out' }, '<0.3');
      tl.fromTo(q(r, '.halo'), { scale: 0.8, autoAlpha: 0.9, transformOrigin: '50% 50%' }, { scale: 1.4, autoAlpha: 0, duration: 1.3, ease: 'power2.out' }, '<');
      ['.b1', '.b2'].forEach((b, i) => tl.fromTo(q(r, b), { autoAlpha: 0, scale: 0.7, y: 10 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(2)' }, i ? '+=0.35' : '+=0.2'));
      tl.from(q(r, '.hr-tally'), { autoAlpha: 0, y: 16, duration: 0.6, ease: 'expo.out' }, '<0.2');
      qa(r, '.ht b').forEach((b, i) => {
        const o = { v: 0 };
        tl.to(o, { v: Number(b.dataset.v), duration: 1.1, ease: 'power2.out', onUpdate: () => { b.textContent = Math.round(o.v); } }, i ? '<' : '<0.2');
      });
      tl.call(() => mark(q(r, '.n-obj'), 'done'));
    },
    (r, tl) => {
      tl.to([q(r, '.hr-scene'), q(r, '.hr-tally')], { opacity: 0.35, duration: 0.6, ease: 'power2.out' });
      tl.fromTo(q(r, '.hr-proto'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '<0.1');
      tl.from(qa(r, '.hr-proto li'), { autoAlpha: 0, x: -12, duration: 0.45, ease: 'expo.out', stagger: 0.15 }, '<0.25');
      tl.to(r, { '--up': '100%', duration: 1.1, ease: 'power2.inOut' }, '+=0.1');
      tl.fromTo(qa(r, '.hr-proto .ok'), { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(2.4)', stagger: 0.12 }, '>-0.2');
      tl.fromTo(q(r, '.hr-ok'), { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, '+=0.1');
    },
  ]);
}

/* ---------- Stage 4: the conclusion, drafted on the official blank ----------
   Phase 0: the expert's five sources and the blank, still empty.
   Phase 1: the blank is filled in; the passport of indicators comes from the e-application. */
function conclusion(host) {
  const [la, lo] = SITE_COORDS[0];
  const S = [
    ['fileText', t('Electronic application'), t('Object, indicators, impact, map')],
    ['mapPinned', t('Inspector’s digital site act'), t('Coordinates and nine criteria')],
    ['userCheck', t('Expert’s site visit'), t('The expert’s own findings on the ground')],
    ['megaphone', t('Public hearing protocol'), t('Residents’ opinion, uploaded online')],
    ['locateFixed', t('Object coordinates'), `<span class="mono">${la.toFixed(5)}, ${lo.toFixed(5)} …</span>`],
  ];
  return viz(host, `
  <div class="viz viz-concl">
    <svg class="links" aria-hidden="true"></svg>
    <div class="srcs">${S.map(([ic, b, s]) => `<div class="src">${icon(ic)}<div><b>${b}</b><span>${s}</span></div></div>`).join('')}</div>
    <div class="doc-col">
      <div class="dc-top"><ol class="prog"><li>${t('Review')}</li><li>${t('Analysis')}</li><li>${t('Draft conclusion')}</li></ol><span class="pd-status chip amber">${t('Draft')}</span></div>
      <div class="bk-wrap">${blank('empty')}</div>
      <span class="chip cyan dc-auto">${icon('zap')}${t('The passport of indicators is filled in from the e-application automatically')}</span>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(qa(r, '.src'), { autoAlpha: 0, x: -24, duration: 0.8, ease: 'expo.out', stagger: 0.12 });
      tl.from(q(r, '.doc-col'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' }, '<0.2');
    },
    (r, tl) => {
      // Connector lines from each source to the blank, measured from the live layout.
      const svg = q(r, '.links');
      const box = r.getBoundingClientRect();
      const doc = q(r, '.blank').getBoundingClientRect();
      const srcs = qa(r, '.src');
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = srcs.map((s, i) => {
        const b = s.getBoundingClientRect();
        const x1 = b.right - box.left;
        const y1 = b.top + b.height / 2 - box.top;
        const x2 = doc.left - box.left;
        const y2 = doc.top - box.top + doc.height * (0.22 + (i * 0.56) / Math.max(srcs.length - 1, 1));
        const mx = (x1 + x2) / 2;
        return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;
      }).join('');
      qa(svg, 'path').forEach((p, i) => draw(tl, p, { d: 0.7, at: i ? '<0.12' : 0 }));
      const prog = qa(r, '.prog li');
      tl.call(() => prog[0].classList.add('on'));
      const fs = qa(r, '.bk-f');
      const passStart = fs.findIndex((f) => f.dataset.k === 'p0');
      fs.forEach((f, i) => {
        if (i === passStart) {
          tl.call(() => prog[1].classList.add('on'));
          tl.fromTo(q(r, '.dc-auto'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' });
        }
        const row = f.closest('tr');
        tl.fromTo(f, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: row ? 0.3 : 0.4, ease: 'power2.out' }, i ? '>-0.08' : '+=0.15');
        if (row) tl.call(() => row.classList.add('bk-auto'), null, '<');
      });
      tl.call(() => prog[2].classList.add('on'), null, '+=0.1');
      tl.fromTo(q(r, '.pd-status'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, '+=0.15');
    },
  ]);
}

/* ---------- Stage 5: review by expert supervisors ---------- */
function review(host) {
  const P = { fwd: 'M238 230 H642', loop: 'M680 268 C680 448 200 448 200 268', exit: 'M718 230 H975' };
  return viz(host, `
  <div class="viz viz-geo viz-review" style="--ar:1000/560">
    <svg class="geo" viewBox="0 0 1000 560" aria-hidden="true">
      <g class="tracks"><path class="track" d="${P.fwd}"/><path class="track" d="${P.loop}"/><path class="track" d="${P.exit}"/></g>
      <path class="route r-fwd" d="${P.fwd}"/>
      <path class="route back r-loop" d="${P.loop}"/>
      <path class="route ok r-exit" d="${P.exit}"/>
      <g class="node n-x todo"><circle class="disc" cx="200" cy="230" r="38"/>${svgIcon('user', 200, 230, 30)}</g>
      <g class="node n-s todo"><circle class="disc" cx="680" cy="230" r="38"/>${svgIcon('users', 680, 230, 30)}</g>
      ${token('tk', t('Draft conclusion'), 190)}
    </svg>
    <div class="lbl up" style="left:20%;top:33%"><b>${t('Expert')}</b><span>${t('Writes the conclusion')}</span></div>
    <div class="lbl up" style="left:68%;top:33%"><b>${t('Expert supervisors')}</b><span>${t('Review and approve')}</span></div>
    <div class="lbl loop-l" style="left:44%;top:83%"><b class="coral">${t('If issues are found, it is returned for revision')}</b><span>${t('The expert resolves them and resubmits')}</span></div>
    <div class="lbl exit-l" style="left:97.5%;top:46.5%"><span class="chip leaf">${icon('check')}${t('Approves')}</span><b>${t('To Stage 6: coordination')}</b></div>
  </div>`, [
    (r, tl) => {
      const tk = q(r, '.tk');
      tl.from(qa(r, '.node'), { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.7)', stagger: 0.12 });
      tl.from(qa(r, '.lbl.up'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.1 }, '<0.2');
      tl.call(() => mark(q(r, '.n-x'), 'now'));
      draw(tl, q(r, '.r-fwd'), { d: 1, at: '+=0.2' });
      ride(tl, tk, q(r, '.r-fwd'), { d: 1, at: '<' });
      tl.call(() => { mark(q(r, '.n-x'), 'done'); mark(q(r, '.n-s'), 'now'); });
      draw(tl, q(r, '.r-loop'), { d: 1.3, at: '+=0.3' });
      ride(tl, tk, q(r, '.r-loop'), { d: 1.3, at: '<' });
      tl.call(() => { mark(q(r, '.n-s'), 'todo'); mark(q(r, '.n-x'), 'back'); }, null, '<0.2');
      pop(tl, q(r, '.loop-l'), '<0.3');
      tl.call(() => { mark(q(r, '.n-x'), 'done'); mark(q(r, '.n-s'), 'now'); }, null, '+=0.5');
      ride(tl, tk, q(r, '.r-fwd'), { d: 0.9, at: '<' });
      tl.to(tk, { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' });
    },
    (r, tl) => {
      tl.call(() => mark(q(r, '.n-s'), 'done'));
      draw(tl, q(r, '.r-exit'), { d: 0.8, at: '+=0.1' });
      ride(tl, q(r, '.tk'), q(r, '.r-exit'), { d: 0.8, at: '<' });
      tl.to(q(r, '.tk'), { autoAlpha: 0, duration: 0.35 });
      pop(tl, q(r, '.exit-l'), '<');
    },
  ]);
}

/* ---------- Stage 6: coordination with the National Committee ---------- */
function coord(host) {
  const P = {
    ca: 'M148 300 C262 300 392 215 530 215',
    cb: 'M148 300 C262 300 392 405 530 405',
    ad: 'M590 215 C722 215 762 300 867 300',
    bd: 'M590 405 C722 405 762 300 867 300',
  };
  const paths = (cls) => Object.entries(P).map(([k, d]) => `<path class="${cls}${cls === 'route' ? ` r-${k}` : ''}" d="${d}"/>`).join('');
  return viz(host, `
  <div class="viz viz-geo viz-coord" style="--ar:1000/600">
    <svg class="geo" viewBox="0 0 1000 600" aria-hidden="true">
      <rect class="frame" x="356" y="64" width="408" height="472" rx="22"/>
      <g class="tracks">${paths('track')}</g>
      <g class="routes">${paths('route')}</g>
      <g class="node n-c todo"><circle class="disc" cx="110" cy="300" r="36"/>${svgIcon('fileText', 110, 300, 28)}</g>
      <g class="node n-a todo"><circle class="disc" cx="560" cy="215" r="30"/>${svgIcon('landmark', 560, 215, 26)}</g>
      <g class="node n-b todo"><circle class="disc" cx="560" cy="405" r="30"/>${svgIcon('shieldCheck', 560, 405, 26)}</g>
      <g class="node n-d todo"><circle class="disc" cx="905" cy="300" r="36"/>${svgIcon('userCheck', 905, 300, 28)}</g>
      ${token('t1', t('Conclusion'), 136)}${token('t2', t('Conclusion'), 136)}${token('t3', t('Agreed'), 112)}${token('t4', t('Agreed'), 112)}
    </svg>
    <div class="lbl frame-l" style="left:56%;top:15%"><b>${t('National Committee for Ecology and Climate Change')}</b></div>
    <div class="lbl" style="left:11%;top:58%"><b>${t('Expert conclusion')}</b><span>${t('Approved by supervisors')}</span></div>
    <div class="lbl" style="left:56%;top:42%"><b>${t('Department of Environmental Policy')}</b><span>${t('Reviews it and gives an opinion')}</span></div>
    <div class="lbl" style="left:56%;top:74%"><b>${t('State Environmental Control Inspectorate')}</b><span>${t('Reviews it and gives an opinion')}</span></div>
    <div class="lbl" style="left:90.5%;top:58%"><b>${t('Center’s director')}</b><span>${t('Receives the agreed conclusion')}</span></div>
  </div>`, [
    (r, tl) => {
      const frame = q(r, '.frame');
      tl.from(qa(r, '.node'), { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(1.7)', stagger: 0.1 });
      draw(tl, frame, { d: 1.2, at: '<' });
      tl.from(qa(r, '.lbl'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, '<0.2');
      tl.call(() => mark(q(r, '.n-c'), 'now'));
      draw(tl, q(r, '.r-ca'), { d: 1.1, at: '+=0.2' });
      draw(tl, q(r, '.r-cb'), { d: 1.1, at: '<' });
      ride(tl, q(r, '.t1'), q(r, '.r-ca'), { d: 1.1, at: '<' });
      ride(tl, q(r, '.t2'), q(r, '.r-cb'), { d: 1.1, at: '<' });
      tl.call(() => { mark(q(r, '.n-c'), 'done'); mark(q(r, '.n-a'), 'now'); mark(q(r, '.n-b'), 'now'); });
      tl.to([q(r, '.t1'), q(r, '.t2')], { autoAlpha: 0, duration: 0.4 }, '+=0.3');
    },
    (r, tl) => {
      tl.call(() => { mark(q(r, '.n-a'), 'done'); mark(q(r, '.n-b'), 'done'); });
      draw(tl, q(r, '.r-ad'), { d: 1.1, at: '+=0.2' });
      draw(tl, q(r, '.r-bd'), { d: 1.1, at: '<' });
      ride(tl, q(r, '.t3'), q(r, '.r-ad'), { d: 1.1, at: '<' });
      ride(tl, q(r, '.t4'), q(r, '.r-bd'), { d: 1.1, at: '<' });
      tl.to([q(r, '.t3'), q(r, '.t4')], { autoAlpha: 0, scale: 0.7, transformOrigin: '50% 50%', duration: 0.35, ease: 'power2.in' });
      tl.call(() => mark(q(r, '.n-d'), 'now'), null, '<');
    },
  ]);
}

/* ---------- Stage 7: the director's final decision ---------- */
function approval(host) {
  const done = ['Expert conclusion prepared', 'Approved by expert supervisors', 'Department of Environmental Policy', 'State Environmental Control Inspectorate'].map(t);
  return viz(host, `
  <div class="viz viz-approve">
    <section class="panel apv">
      <h3>${t('Completed approvals')}</h3>
      <ol class="apv-list">
        ${done.map((s) => `<li>${tick()}<span>${s}</span></li>`).join('')}
        <li class="dir now"><span class="ring"></span><span><b>${t('Center Director')}</b>: ${t('final decision')}</span></li>
      </ol>
    </section>
    <div class="verdict">
      <div class="opt yes"><span class="vi">${icon('check')}</span><b>${t('Approves')}</b><span>${t('The conclusion proceeds to signing')}</span></div>
      <div class="opt no"><span class="vi">${icon('x')}</span><b>${t('Rejects')}</b><span>${t('The conclusion is not approved')}</span></div>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.apv'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(qa(r, '.apv-list li'), { autoAlpha: 0, x: -12, duration: 0.6, ease: 'expo.out', stagger: 0.14 }, '<0.25');
      qa(r, '.apv-list .tick').forEach((tk, i) => {
        draw(tl, tk.querySelector('path'), { d: 0.4, at: i ? '<0.14' : '<' });
        tl.to(tk, { '--on': 1, duration: 0.3 }, '<');
      });
    },
    (r, tl) => {
      tl.fromTo(qa(r, '.verdict .opt'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.12 });
      tl.call(() => q(r, '.opt.yes').classList.add('sel'), null, '+=0.3');
      tl.fromTo(q(r, '.opt.yes'), { scale: 0.95 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }, '<');
      tl.to(q(r, '.opt.no'), { opacity: 0.38, duration: 0.5 }, '<');
      tl.call(() => { const d = q(r, '.dir'); d.classList.remove('now'); d.classList.add('done'); }, null, '<0.2');
    },
  ]);
}

/* ---------- Stage 8: E-IMZO signing on the blank ----------
   Each signature puts its QR code on the blank: the expert's at the foot, the director's
   "Tasdiqlayman" at the top. E-IMZO is a digital signature: no ink, no stamp pad. */
function sign(host) {
  const who = [[t('Ecologist expert'), SIGN_TIMES[0], '.q-exp', '.s1'], [t('Center Director'), SIGN_TIMES[1], '.q-dir', '.s2']];
  return viz(host, `
  <div class="viz viz-sign">
    <div class="bk-wrap">${blank('filled')}</div>
    <section class="panel ez">
      <h3>${icon('keyRound')}E-IMZO</h3>
      <p class="ez-sub">${t('Electronic digital signature')}</p>
      <ol class="ez-list">
        ${who.map(([role, time], i) => `
          <li class="ez-i e${i}">
            <span class="ez-ic">${icon('fingerprint')}</span>
            <div><b>${role}</b><i class="redact w6"></i><span class="mono">${time}</span></div>
            <span class="chip leaf ez-ok">${icon('check')}${t('Signed')}</span>
          </li>`).join('')}
      </ol>
      <span class="chip leaf ez-st">${icon('stamp')}${t('Finalized in the system')}</span>
      <p class="ez-q">${icon('qrCode')}<span>${t('The QR codes let anyone verify the conclusion online')}</span></p>
    </section>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.bk-wrap'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(q(r, '.ez'), { autoAlpha: 0, x: 24, duration: 0.8, ease: 'expo.out' }, '<0.2');
      tl.from(qa(r, '.ez-i'), { autoAlpha: 0, y: 8, duration: 0.5, ease: 'expo.out', stagger: 0.1 }, '<0.2');
      who.forEach(([, , qsel, ssel], i) => {
        const li = q(r, `.e${i}`);
        tl.call(() => li.classList.add('now'), null, '+=0.3');
        tl.fromTo(q(li, '.ez-ic'), { scale: 1 }, { scale: 1.16, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' });
        tl.fromTo(q(li, '.ez-ok'), { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)' });
        tl.call(() => { li.classList.remove('now'); li.classList.add('done'); }, null, '<');
        tl.fromTo(q(r, qsel), { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: 'back.out(2)' }, '<0.1');
        tl.fromTo(q(r, ssel), { autoAlpha: 0, x: -8 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out' }, '<0.15');
        if (i === 0) tl.fromTo(q(r, '.bk-esig > b'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, '<');
      });
      tl.fromTo(q(r, '.ez-st'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, '+=0.25');
      tl.fromTo(q(r, '.ez-q'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '<0.2');
    },
  ]);
}

/* ---------- Delivery: the applicant's phone ----------
   Phase 0: a my.gov.uz notification arrives, the application's status turns to "Conclusion ready".
   Phase 1: the applicant opens it; the signed conclusion is there to download.
   Phase 2: downloaded and opened: the same official blank, with its QR codes. */
function phone(host) {
  return viz(host, `
  <div class="viz viz-phone">
    <div class="phone">
      <div class="ph-screen">
        <div class="ph-bar"><span class="mono">09:41</span><span class="ph-sys">${icon('signal')}${icon('wifi')}${icon('battery')}</span></div>
        <header class="ph-hd"><span class="pw-logo">${icon('landmark')}</span><div><b>my.gov.uz</b><span>${t('Personal account')}</span></div></header>
        <h4 class="ph-h">${t('My applications')}</h4>
        <div class="ph-item">
          <div class="ph-it"><span>${t('Application No.')} <span class="mono">${APP_NO}</span></span><b>${t('School building construction')}</b></div>
          <span class="flip"><span class="face a chip amber">${icon('clock')}${t('In progress')}</span><span class="face b chip leaf">${icon('check')}${t('Conclusion ready')}</span></span>
        </div>
        <div class="ph-doc">
          <span class="ph-doc-ic">${icon('fileText')}</span>
          <div><b>${t('Ecological expertise conclusion')}</b><span>${icon('keyRound')}${t('Signed with E-IMZO')}</span></div>
          <span class="btn ph-dl">${icon('download')}${t('Download')}</span>
        </div>
        <div class="ph-notif">
          <span class="ph-bell">${icon('bellRing')}</span>
          <div><span class="nt-app">MY.GOV.UZ · ${t('now')}</span><b>${t('Conclusion ready')}</b><span>${t('The conclusion on your application has been signed and issued.')}</span></div>
        </div>
        <div class="ph-view">
          <div class="pv-hd">${icon('fileText')}<b class="mono">${t('Conclusion')}_${APP_NO}.pdf</b><span class="chip leaf">${icon('check')}E-IMZO</span></div>
          <div class="pv-body">${blank('signed')}</div>
        </div>
      </div>
    </div>
    <div class="ph-big">
      ${blank('signed')}
      <span class="chip cyan pb-cap">${icon('qrCode')}${t('Scan the QR code to verify the conclusion online')}</span>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.phone'), { autoAlpha: 0, y: 40, rotate: -4, duration: 1, ease: 'expo.out' });
      tl.from(qa(r, '.ph-hd, .ph-h, .ph-item'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.1 }, '<0.3');
      tl.fromTo(q(r, '.ph-notif'), { autoAlpha: 0, yPercent: -140 }, { autoAlpha: 1, yPercent: 0, duration: 0.8, ease: 'back.out(1.6)' }, '+=0.5');
      tl.to(q(r, '.ph-bell'), { keyframes: { rotate: [0, -18, 16, -12, 8, 0] }, duration: 0.9, ease: 'power1.inOut' }, '<0.3');
      tl.to(q(r, '.phone'), { keyframes: { x: [0, -4, 4, -3, 3, 0] }, duration: 0.5, ease: 'none' }, '<');
      tl.to(q(r, '.ph-item .face.a'), { rotateX: -90, autoAlpha: 0, duration: 0.35, ease: 'power2.in' }, '+=0.3');
      tl.fromTo(q(r, '.ph-item .face.b'), { rotateX: 90, autoAlpha: 0 }, { rotateX: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' });
      tl.call(() => q(r, '.ph-item').classList.add('ready'), null, '<');
    },
    (r, tl) => {
      tl.to(q(r, '.ph-notif'), { scale: 0.95, duration: 0.14, ease: 'power2.in' });
      tl.to(q(r, '.ph-notif'), { scale: 1, yPercent: -140, autoAlpha: 0, duration: 0.5, ease: 'power2.in' });
      tl.fromTo(q(r, '.ph-doc'), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '<0.2');
      tl.to(q(r, '.ph-dl'), { scale: 0.92, duration: 0.14, ease: 'power2.in' }, '+=0.5');
      tl.call(() => q(r, '.ph-dl').classList.add('pressed'));
      tl.to(q(r, '.ph-dl'), { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    },
    (r, tl) => {
      const ph = q(r, '.phone');
      const big = q(r, '.ph-big');
      let dx = 0;
      tl.fromTo(q(r, '.ph-view'), { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0, duration: 0.7, ease: 'expo.out' });
      tl.from(q(r, '.pv-body .blank'), { y: 30, duration: 1.2, ease: 'expo.out' }, '<0.2');
      // Phone and the opened blank side by side, centred together.
      tl.call(() => {
        const vb = r.getBoundingClientRect();
        const pb = ph.getBoundingClientRect();
        const gap = pb.width * 0.14;
        dx = -(gap + big.offsetWidth) / 2;
        big.style.left = `${pb.right - vb.left + gap + dx}px`;
      }, null, '+=0.2');
      tl.to(ph, { x: () => dx, duration: 0.9, ease: 'expo.inOut' });
      tl.fromTo(big, { autoAlpha: 0, x: -40, scale: 0.9, transformOrigin: '0% 100%' }, { autoAlpha: 1, x: 0, scale: 1, duration: 0.9, ease: 'expo.out' }, '<0.35');
      tl.fromTo(q(r, '.pb-cap'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '+=0.1');
    },
  ]);
}

/* ---------- The eight stations, large (overview and finale) ---------- */
function rail(host) {
  return viz(host, `
  <div class="viz viz-rail">
    <div class="frail">
      <div class="ftrack"><span class="ffill"></span></div>
      ${STAGES.map((s, i) => `
        <div class="fst todo" style="left:${railX(i)}%">
          <span class="d"><span class="n mono">${i + 1}</span>${icon('check', 'ck')}</span>
          <b>${s}</b><span class="desc">${STAGE_NOTES[i]}</span>
        </div>`).join('')}
    </div>
    <div class="span">
      <i class="brk" aria-hidden="true"></i>
      <span class="span-lb"><span class="mono">15–25</span> ${t('working days')}</span>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.ftrack'), { scaleX: 0, transformOrigin: '0 50%', duration: 1.4, ease: 'power2.inOut' });
      tl.from(qa(r, '.fst .d'), { autoAlpha: 0, scale: 0.4, duration: 0.6, ease: 'back.out(2)', stagger: 0.12 }, '<0.1');
      tl.from(qa(r, '.fst b, .fst .desc'), { autoAlpha: 0, y: 10, duration: 0.6, ease: 'expo.out', stagger: 0.05 }, '<0.2');
    },
    (r, tl) => {
      qa(r, '.fst').forEach((st, i) => {
        tl.to(r, { '--fill': `${(i / 7) * 100}%`, duration: 0.22, ease: 'none' }, i ? '>' : '+=0.2');
        tl.call(() => mark(st, 'done'));
      });
      tl.fromTo(q(r, '.brk'), { clipPath: 'inset(0 100% 0 0)', autoAlpha: 1 }, { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power2.inOut' }, '+=0.2');
      tl.fromTo(q(r, '.span-lb'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '<0.4');
    },
  ]);
}

export const VISUALS = { apply, flow, record, inspect, intake, payment, assign, hearing, conclusion, review, coord, approval, sign, phone, rail };
