// The docked 8-station route rail: where the application is right now.
import { STAGES } from './data.js';
import { icon } from './icons.js';

export const railX = (i) => 3 + i * (94 / 7); // station position, % of rail width

export function createRail(el) {
  el.innerHTML = `
    <div class="rail-track"><div class="rail-fill"></div></div>
    ${STAGES.map(
      (name, i) => `
      <div class="rail-st" style="left:${railX(i)}%">
        <span class="dot">${icon('check', 'ck')}</span>
        <span class="lb"><span class="n">${i + 1}</span>${name}</span>
      </div>`,
    ).join('')}`;
  const fill = el.querySelector('.rail-fill');
  const stations = [...el.querySelectorAll('.rail-st')];

  return {
    set({ show = false, at = 0, done = 0 } = {}) {
      el.classList.toggle('on', show);
      stations.forEach((st, i) => {
        st.classList.toggle('done', i < done);
        st.classList.toggle('now', i === at - 1 && i >= done);
        st.toggleAttribute('aria-current', i === at - 1);
      });
      const reach = done >= STAGES.length ? STAGES.length - 1 : Math.max(at - 1, 0);
      fill.style.width = `${(reach / (STAGES.length - 1)) * 100}%`;
    },
  };
}
