// Liquid Glass navbar: horizontal pill on mobile, vertical rail on desktop (layout handled in CSS).
const S = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const NimbusIcons = {
  home: S('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5.5h4V20"/>'),
  search: S('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  plus: S('<path d="M12 5v14M5 12h14"/>'),
  message: S('<path d="M20.5 4 3.5 11l6.5 2.5L12.5 20z"/><path d="m10 13.5 10.5-9.5"/>'),
  account: S('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.6 3.9-5.6 7.5-5.6s6.7 2 7.5 5.6"/>'),
};

export class LiquidNavbar {
  constructor(el, { items, active, onSelect }) {
    this.el = el; this.items = items; this.active = active; this.onSelect = onSelect;
    this.render();
    addEventListener('resize', () => this.sync());
    document.fonts?.ready.then(() => this.sync());
  }
  render() {
    this.el.className = 'lnav glass';
    this.el.innerHTML = '<span class="lnav-ind"></span>' + this.items.map((it, i) =>
      `<button class="lnav-btn${i === 2 ? ' is-plus' : ''}" data-key="${it.key}" data-fx="${it.fx}" aria-label="${it.label}">
        <i>${it.icon}</i><span>${it.label}</span><b class="lnav-badge" hidden></b></button>`).join('');
    this.el.onclick = (e) => {
      const b = e.target.closest('.lnav-btn'); if (!b) return;
      this.play(b);
      this.onSelect(b.dataset.key);
    };
    this.el.addEventListener('animationend', (e) => e.target.closest('.lnav-btn')?.classList.remove('go'));
    this.select(this.active);
  }
  play(b) { b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); }
  select(key) {
    this.active = key;
    this.el.querySelectorAll('.lnav-btn').forEach((b) => b.classList.toggle('on', b.dataset.key === key));
    this.sync();
  }
  badge(key, n) {
    const b = this.el.querySelector(`[data-key="${key}"] .lnav-badge`);
    if (b) { b.textContent = n > 9 ? '9+' : n; b.hidden = !n; }
  }
  sync() {
    const b = this.el.querySelector('.lnav-btn.on'), ind = this.el.querySelector('.lnav-ind');
    if (!b || b.classList.contains('is-plus')) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.width = b.offsetWidth + 'px'; ind.style.height = b.offsetHeight + 'px';
    ind.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
  }
}
