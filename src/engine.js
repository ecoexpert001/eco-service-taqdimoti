// Step engine: keyboard / clicker / mouse navigation, card and visual transitions, deep links (#12).
import { gsap } from 'gsap';
import { renderCard } from './card.js';
import { VISUALS } from './visuals.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createEngine({ steps, stage, cardSlot, visualSlot, rail, mapApi, count, cue, mark }) {
  let i = -1;
  let card = null;
  let vis = null;
  let visType = null;

  const layoutOf = (s) => s.layout || 'side';
  const padFor = (layout) => {
    if (layout === 'side') return Math.round(cardSlot.getBoundingClientRect().right + window.innerWidth * 0.03);
    if (layout === 'hero') return Math.round(window.innerWidth * 0.4);
    return 0;
  };

  // How long a card or panel takes to leave (s). The next one starts only after it has gone, so
  // two steps' words are never on screen at once.
  const OUT = 0.3;

  // A card or panel on its way out leaves from where it is. Its slot moves at once when the next
  // step has another layout (a centred statement, then a heading over a panel), which made the old
  // words jump across the screen while they faded. So before the layout changes, what leaves is
  // lifted out of its slot and pinned to the stage at the same place, behind the new step.
  function pin(el) {
    if (!el || !el.parentNode || el.parentNode === stage) return;
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'transform' });
    const r = el.getBoundingClientRect();
    const st = stage.getBoundingClientRect();
    Object.assign(el.style, {
      position: 'absolute', margin: '0', left: `${r.left - st.left}px`, top: `${r.top - st.top}px`,
      width: `${r.width}px`, height: `${r.height}px`,
    });
    stage.insertBefore(el, stage.firstChild);
  }

  function swapCard(spec, layout, instant) {
    const old = card;
    const el = renderCard(spec, layout);
    cardSlot.appendChild(el);
    card = el;
    if (old) {
      gsap.killTweensOf(old);
      if (instant || REDUCED) old.remove();
      else gsap.to(old, { autoAlpha: 0, y: -12, filter: 'blur(6px)', duration: OUT, ease: 'power2.in', onComplete: () => old.remove() });
    }
    if (instant || REDUCED) return;
    const delay = old ? OUT + 0.02 : 0.2;
    gsap.from(el, { autoAlpha: 0, y: 18, duration: 0.8, ease: 'expo.out', delay, clearProps: 'transform' });
    gsap.from(el.querySelectorAll('[data-in]'), {
      autoAlpha: 0, y: 20, filter: 'blur(8px)', duration: 1.05, ease: 'expo.out', stagger: 0.08, delay: delay + 0.06,
      clearProps: 'filter,transform',
    });
  }

  function swapVisual(spec, instant) {
    let leaving = false;
    if (vis && (!spec || spec.type !== visType)) {
      const o = vis;
      vis = null;
      visType = null;
      if (instant || REDUCED) o.destroy();
      else {
        leaving = true;
        gsap.to(o.el, { autoAlpha: 0, y: -14, filter: 'blur(8px)', duration: OUT, ease: 'power2.in', onComplete: () => o.destroy() });
      }
    }
    if (!spec) return;
    const fresh = !vis;
    if (fresh) {
      vis = VISUALS[spec.type](visualSlot);
      visType = spec.type;
      if (!(instant || REDUCED)) gsap.from(vis.el, { autoAlpha: 0, duration: 0.5, delay: leaving ? OUT + 0.04 : 0.25, ease: 'power2.out' });
    }
    vis.set(spec.phase ?? 0, { instant: instant || REDUCED, lead: fresh ? 0.5 : 0.3 });
  }

  function go(n, { instant = false } = {}) {
    n = Math.max(0, Math.min(steps.length - 1, n));
    if (n === i) return;
    const back = n < i;
    i = n;
    const s = steps[n];
    const layout = layoutOf(s);
    // What leaves is pinned where it stands before the layout below moves the slots. Going back,
    // panels are rebuilt at once, so only the card leaves with an animation.
    if (!(instant || REDUCED)) {
      pin(card);
      if (!back && vis && (!s.visual || s.visual.type !== visType)) pin(vis.el);
    }
    stage.dataset.layout = layout;
    document.body.dataset.layout = layout;
    swapCard(s.card, layout, instant);
    swapVisual(s.visual, instant || back);
    mapApi.apply(s.map || {}, { instant, padLeft: padFor(layout) }); // dims via the map's own veil layer
    document.body.dataset.cam = String(s.map?.cam || '').split(':')[0];
    rail.set(s.rail);
    count.innerHTML = `<b>${String(n + 1).padStart(2, '0')}</b> / ${steps.length}`;
    cue.classList.toggle('on', !!s.cue);
    mark.classList.toggle('on', layout !== 'hero');
    window.history.replaceState(null, '', `#${n + 1}`);
  }

  const next = () => go(i + 1);
  const prev = () => go(i - 1);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  };

  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (onUi(e) && (e.key === ' ' || e.key === 'Enter')) return; // a focused control handles its own key
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); go(0, { instant: true }); }
    else if (k === 'End') { e.preventDefault(); go(steps.length - 1, { instant: true }); }
    else if (k === 'f' || k === 'F') toggleFullscreen();
  });
  // Like a slide show: left click forward, right click back.
  // Clicks on the presenter's controls ([data-ui]) never advance the deck.
  const onUi = (e) => !!e.target.closest?.('[data-ui]');
  window.addEventListener('click', (e) => { if (e.button === 0 && !onUi(e)) next(); });
  window.addEventListener('contextmenu', (e) => { e.preventDefault(); if (!onUi(e)) prev(); });
  window.addEventListener('hashchange', () => {
    const n = parseInt(window.location.hash.slice(1), 10);
    if (Number.isFinite(n) && n - 1 !== i) go(n - 1, { instant: true });
  });

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const s = steps[i];
      if (s) mapApi.refit(padFor(layoutOf(s)));
    }, 200);
  });

  // Hide the pointer while presenting.
  let idleT = 0;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idleT);
    idleT = setTimeout(() => document.body.classList.add('idle'), 2200);
  };
  window.addEventListener('mousemove', wake);
  wake();

  return { go, next, prev, get index() { return i; } };
}
