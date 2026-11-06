// Right-hand visuals. Each one is a template plus phase builders; a phase adds its
// animation to a GSAP timeline. Jumping (or going back) rebuilds the template and
// fast-forwards the same timeline, so the animated and the static states never drift apart.
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { APP_NO, INVOICE_NO, SITE_COORDS, STAGES, STAGE_NOTES } from './data.js';
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

const SECTIONS = ['General information', 'Environmental impact analysis', 'Conclusion and requirements'].map(t);
const paperSections = (done = false) => `
  <ol class="pd-secs">
    ${SECTIONS.map((s, i) => `
      <li class="${done ? 'done' : ''}">
        <div class="pd-row"><span class="pd-n mono">${i + 1}</span><span class="pd-st">${s}</span><span class="pd-ok">${icon('check')}</span></div>
        <i class="pd-rule"></i><i class="pd-rule"></i>
      </li>`).join('')}
  </ol>`;

const paperSigns = () => `
  <div class="pd-signs">
    ${[t('Expert'), t('Center Director')].map((role) => `
      <div class="pd-sign">
        <div class="pd-eimzo"><span class="pd-ek">${icon('keyRound')}${t('E-IMZO electronic signature')}</span><span class="chip leaf">${icon('check')}${t('Signed')}</span></div>
        <i class="pd-sline"></i>
        <span class="pd-role">${role}</span>
      </div>`).join('')}
  </div>`;

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

/* ---------- Stage 1: the applicant fills in the application on my.gov.uz ---------- */
function apply(host) {
  const [la, lo] = SITE_COORDS[0];
  const field = (cls, label, value, wide = false) =>
    `<label class="ap-f ${cls} ${wide ? 'wide' : ''}"><span class="ap-l">${label}</span><span class="inp">${value}<i class="caret"></i><span class="ap-ok">${icon('check')}</span></span></label>`;
  const typed = (text, mono = false) => `<span class="typed ${mono ? 'mono' : ''}" data-text="${text}"></span>`;
  return viz(host, `
  <div class="viz viz-apply">
    <section class="sheet ap-win">
      <header class="pw-hd"><span class="pw-logo">${icon('landmark')}</span><div><b>my.gov.uz</b><span>${t('Single Portal of Interactive Public Services')}</span></div></header>
      <div class="ap-body">
        <h3 class="ap-title">${t('Application for state ecological expertise')}</h3>
        <div class="ap-grid">
          ${field('f0', t('Applicant: full name or company name'), '<i class="redact w9 rv"></i>')}
          ${field('f1', t('TIN / PINFL'), '<i class="redact w6 rv"></i>')}
          ${field('f2', t('Object of expertise'), typed(t('School building construction')))}
          ${field('f3', t('Environmental impact category'), `${typed(t('Category III'))}<span class="sel-ic">${icon('chevronDown')}</span>`)}
          ${field('f4', t('Location'), typed(t('Andijan region, Baliqchi district')))}
          ${field('f5', t('Object coordinates'), typed(`${la.toFixed(5)}, ${lo.toFixed(5)} …`, true))}
        </div>
        <div class="ap-att"><span class="att-ic">${icon('paperclip')}</span><span class="att-t"><b>${t('Project documents')}</b><span class="att-bar"><i></i></span></span><span class="att-ok chip leaf">${icon('check')}${t('Attached')}</span></div>
        <span class="btn ap-send">${icon('send')}${t('Submit')}</span>
      </div>
    </section>
    <div class="ap-done chip leaf">${icon('circleCheck')}${t('Application submitted')} · № <span class="mono">${APP_NO}</span></div>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.ap-win'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      tl.from(qa(r, '.ap-f, .ap-att'), { autoAlpha: 0, y: 10, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, '<0.3');
      qa(r, '.ap-f').forEach((f, i) => {
        const inp = q(f, '.inp');
        tl.call(() => inp.classList.add('focus'), null, i ? '+=0.08' : '+=0.2');
        const tx = q(f, '.typed');
        if (tx) typeIn(tl, tx, tx.dataset.text, { d: Math.min(0.9, 0.3 + tx.dataset.text.length * 0.022), at: '+=0.05' });
        else tl.fromTo(q(f, '.rv'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.45, ease: 'power2.out' }, '+=0.05');
        tl.call(() => { inp.classList.remove('focus'); inp.classList.add('done'); }, null, '+=0.05');
      });
      tl.to(r, { '--att': '100%', duration: 1, ease: 'power2.inOut' }, '+=0.15');
      tl.fromTo(q(r, '.att-ok'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' });
      tl.to(q(r, '.ap-send'), { scale: 0.93, duration: 0.14, ease: 'power2.in' }, '+=0.3');
      tl.call(() => q(r, '.ap-send').classList.add('pressed'));
      tl.to(q(r, '.ap-send'), { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      tl.fromTo(q(r, '.ap-done'), { autoAlpha: 0, y: 12, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' }, '<0.15');
    },
  ]);
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

/* ---------- Stage 4: the conclusion ---------- */
function conclusion(host) {
  const [la, lo] = SITE_COORDS[0];
  return viz(host, `
  <div class="viz viz-concl">
    <svg class="links" aria-hidden="true"></svg>
    <div class="srcs">
      <div class="src">${icon('fileText')}<div><b>${t('Project documents')}</b><span>${t('Submitted with the application')}</span></div></div>
      <div class="src">${icon('mapPinned')}<div><b>${t('Inspector’s site schematic')}</b><span>${t('Findings from the on-site inspection')}</span></div></div>
      <div class="src">${icon('userCheck')}<div><b>${t('Expert’s site visit')}</b><span>${t('The expert’s own findings on the ground')}</span></div></div>
      <div class="src">${icon('locateFixed')}<div><b>${t('Object coordinates')}</b><span class="mono">${la.toFixed(5)}, ${lo.toFixed(5)} …</span></div></div>
    </div>
    <div class="doc-col">
      <ol class="prog"><li>${t('Review')}</li><li>${t('Analysis')}</li><li>${t('Draft conclusion')}</li></ol>
      <article class="paper doc">
        ${paperHead(t('ECOLOGICAL EXPERTISE CONCLUSION'))}
        <span class="pd-status chip amber">${t('Draft')}</span>
        ${paperSections()}
        ${paperSigns()}
      </article>
    </div>
  </div>`, [
    (r, tl) => {
      tl.from(qa(r, '.src'), { autoAlpha: 0, x: -24, duration: 0.8, ease: 'expo.out', stagger: 0.14 });
      tl.from(q(r, '.doc-col'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' }, '<0.2');
    },
    (r, tl) => {
      // Connector lines from each source to the document, measured from the live layout.
      const svg = q(r, '.links');
      const box = r.getBoundingClientRect();
      const doc = q(r, '.doc').getBoundingClientRect();
      const srcs = qa(r, '.src');
      svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
      svg.innerHTML = srcs.map((s, i) => {
        const b = s.getBoundingClientRect();
        const x1 = b.right - box.left;
        const y1 = b.top + b.height / 2 - box.top;
        const x2 = doc.left - box.left;
        const y2 = doc.top - box.top + doc.height * (0.3 + (i * 0.48) / Math.max(srcs.length - 1, 1));
        const mx = (x1 + x2) / 2;
        return `<path d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;
      }).join('');
      qa(svg, 'path').forEach((p, i) => draw(tl, p, { d: 0.8, at: i ? '<0.15' : 0 }));
      // Review, analysis, draft: each section of the form is completed in turn.
      const secs = qa(r, '.pd-secs li');
      qa(r, '.prog li').forEach((li, i) => {
        tl.call(() => {
          li.classList.add('on');
          secs[i]?.classList.add('done');
        }, null, i ? '+=0.55' : '+=0.1');
      });
      tl.fromTo(q(r, '.pd-status'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, '+=0.2');
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

/* ---------- Stage 8: E-IMZO signing ---------- */
function sign(host) {
  // E-IMZO is a digital signature: each signature line receives its E-IMZO record, not ink.
  return viz(host, `
  <div class="viz viz-paper viz-sign">
    <article class="paper doc">
      ${paperHead(t('ECOLOGICAL EXPERTISE CONCLUSION'))}
      <span class="pd-status chip leaf">${icon('stamp')}${t('Finalized')}</span>
      ${paperSections(true)}
      ${paperSigns()}
    </article>
  </div>`, [
    (r, tl) => {
      tl.from(q(r, '.paper'), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'expo.out' });
      qa(r, '.pd-eimzo').forEach((b) => {
        tl.fromTo(b, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'expo.out' }, '+=0.35');
        tl.fromTo(b.querySelector('.chip'), { scale: 0.6 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)' }, '<0.15');
        tl.call(() => b.parentElement.classList.add('signed'), null, '<');
      });
      tl.fromTo(q(r, '.pd-status'), { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.2)' }, '+=0.25');
    },
  ]);
}

/* ---------- Delivery: the applicant's phone ----------
   Phase 0: a my.gov.uz notification arrives, the application's status turns to "Conclusion ready".
   Phase 1: the applicant opens it; the signed conclusion is there to download. */
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
      </div>
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

export const VISUALS = { apply, flow, record, intake, payment, assign, conclusion, review, coord, approval, sign, phone, rail };
