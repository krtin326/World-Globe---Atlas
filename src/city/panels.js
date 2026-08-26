/**
 * panels.js — a small floating-window manager for the city view.
 *
 * The city view had one fixed information card welded to the corner of the map.
 * This turns it into as many draggable, closable panels as you like: the live
 * "detail" panel follows your selection, and any panel can be pinned into a
 * frozen copy you drag aside and keep — so you can line up an event, a family
 * and a ward next to each other for whatever task you are on.
 *
 * The manager owns nothing about *content*; callers set HTML. It only handles
 * the window behaviour: dragging, stacking order, cascading new windows, and
 * teardown. Panels live inside one overlay element that is itself
 * pointer-transparent, so only the panels themselves catch the mouse and the
 * map underneath stays fully interactive.
 */

let zTop = 40;             // shared stacking counter across all panels
let cascade = 0;           // so successive new panels do not land exactly stacked

export class Panel {
  /**
   * @param {PanelManager} manager
   * @param {object} opts  { title, kind, width, closable, onClose }
   */
  constructor(manager, opts = {}) {
    this.manager = manager;
    this.kind = opts.kind || 'panel';
    this.onClose = opts.onClose || null;

    const el = document.createElement('section');
    el.className = 'cv-panel';
    el.style.width = `${opts.width || 300}px`;
    el.style.zIndex = String(++zTop);
    el.innerHTML = `
      <header class="cv-panel-bar">
        <span class="cv-panel-title"></span>
        <span class="cv-panel-tools">
          <button class="cv-panel-pin" title="Pin a copy" aria-label="Pin a copy">◈</button>
          <button class="cv-panel-close" title="Close" aria-label="Close">✕</button>
        </span>
      </header>
      <div class="cv-panel-body"></div>`;
    this.el = el;
    this.bar = el.querySelector('.cv-panel-bar');
    this.titleEl = el.querySelector('.cv-panel-title');
    this.bodyEl = el.querySelector('.cv-panel-body');
    this.pinBtn = el.querySelector('.cv-panel-pin');
    this.closeBtn = el.querySelector('.cv-panel-close');

    this.setTitle(opts.title || '');
    if (opts.closable === false) this.closeBtn.style.display = 'none';
    if (!opts.pinnable) this.pinBtn.style.display = 'none';

    this.closeBtn.addEventListener('click', () => this.close());
    this.pinBtn.addEventListener('click', () => this.manager._pin(this));

    // Any touch on the window raises it above the others.
    el.addEventListener('pointerdown', () => this.toFront());

    this._bindDrag();
    manager.layer.appendChild(el);
  }

  setTitle(t) { this.titleEl.textContent = t; this.title = t; }
  setContent(html) { this.bodyEl.innerHTML = html; }
  get body() { return this.bodyEl; }

  toFront() { this.el.style.zIndex = String(++zTop); }

  /** Place the top-left corner at (x, y) in layer coordinates, clamped inside. */
  moveTo(x, y) {
    const bounds = this.manager.layer.getBoundingClientRect();
    const w = this.el.offsetWidth || 300;
    const h = this.el.offsetHeight || 120;
    const cx = Math.max(4, Math.min(x, bounds.width - w - 4));
    const cy = Math.max(4, Math.min(y, bounds.height - h - 4));
    this.el.style.left = `${Math.round(cx)}px`;
    this.el.style.top = `${Math.round(cy)}px`;
  }

  _bindDrag() {
    let start = null;
    const down = (e) => {
      // Only the title bar drags — buttons inside it must still click.
      if (e.target.closest('.cv-panel-tools')) return;
      const r = this.el.getBoundingClientRect();
      const lr = this.manager.layer.getBoundingClientRect();
      start = { px: e.clientX, py: e.clientY, x: r.left - lr.left, y: r.top - lr.top };
      this.bar.setPointerCapture?.(e.pointerId);
      this.el.classList.add('is-dragging');
    };
    const move = (e) => {
      if (!start) return;
      this.moveTo(start.x + (e.clientX - start.px), start.y + (e.clientY - start.py));
    };
    const up = (e) => {
      start = null;
      this.bar.releasePointerCapture?.(e.pointerId);
      this.el.classList.remove('is-dragging');
    };
    this.bar.addEventListener('pointerdown', down);
    this.bar.addEventListener('pointermove', move);
    this.bar.addEventListener('pointerup', up);
    this.bar.addEventListener('pointercancel', up);
  }

  close() {
    this.onClose?.(this);
    this.manager._remove(this);
    this.el.remove();
  }
}

export class PanelManager {
  /**
   * @param {HTMLElement} layer      the pointer-transparent overlay panels live in
   * @param {object} [handlers]      { onPin: (sourcePanel) => void }
   */
  constructor(layer, handlers = {}) {
    this.layer = layer;
    this.handlers = handlers;
    this.panels = new Set();
    this.singletons = new Map(); // kind -> Panel, for one-of-a-kind windows
  }

  /** A fresh panel, cascaded so it does not sit exactly on the last one. */
  spawn(opts = {}) {
    const panel = new Panel(this, opts);
    this.panels.add(panel);

    const step = 26;
    const base = 16 + (cascade % 6) * step;
    cascade++;
    panel.moveTo(opts.x ?? base, opts.y ?? base);
    return panel;
  }

  /**
   * Get the single panel of a kind, creating it if absent. Used for the windows
   * that only make sense one at a time (legend, coordinates, notes).
   * @returns {Panel}
   */
  ensure(kind, opts = {}) {
    let panel = this.singletons.get(kind);
    if (panel) { panel.toFront(); return panel; }
    panel = this.spawn({ ...opts, kind });
    this.singletons.set(kind, panel);
    return panel;
  }

  /** Open the kind if closed, close it if already open. Returns the panel or null. */
  toggle(kind, opts = {}) {
    const existing = this.singletons.get(kind);
    if (existing) { existing.close(); return null; }
    return this.ensure(kind, opts);
  }

  isOpen(kind) { return this.singletons.has(kind); }

  _pin(panel) { this.handlers.onPin?.(panel); }

  _remove(panel) {
    this.panels.delete(panel);
    for (const [kind, p] of this.singletons) {
      if (p === panel) this.singletons.delete(kind);
    }
  }

  destroy() {
    for (const p of [...this.panels]) { p.el.remove(); }
    this.panels.clear();
    this.singletons.clear();
  }
}
