/**
 * VirtualList.js — a scrolling list that only ever has ~30 elements in the DOM.
 *
 * The city browser can be asked to show all 34,027 rows at once. Building that
 * many DOM nodes takes seconds and then scrolls badly forever after. Instead a
 * spacer element gives the scrollbar the correct height, and only the rows
 * inside the viewport (plus a small overscan) actually exist, recycled as the
 * user scrolls.
 *
 * Rows must be a uniform height — that is what makes the index arithmetic a
 * division instead of a search.
 */

export class VirtualList {
  /**
   * @param {HTMLElement} container  scrolling element; must be position:relative
   * @param {object} options
   * @param {number} options.rowHeight  px, must match the CSS
   * @param {(index:number, item:any, el:HTMLElement) => void} options.render
   * @param {(index:number, item:any) => void} [options.onSelect]
   * @param {number} [options.overscan]  extra rows above and below the viewport
   */
  constructor(container, { rowHeight, render, onSelect, overscan = 6 }) {
    this.container = container;
    this.rowHeight = rowHeight;
    this.renderRow = render;
    this.onSelect = onSelect;
    this.overscan = overscan;

    this.items = [];
    this._pool = [];
    this._first = -1;
    this._count = 0;

    this.viewport = document.createElement('div');
    this.viewport.className = 'vlist-viewport';
    this.container.appendChild(this.viewport);

    this.spacer = document.createElement('div');
    this.spacer.className = 'vlist-spacer';
    this.viewport.appendChild(this.spacer);

    this._onScroll = () => this._update();
    this.container.addEventListener('scroll', this._onScroll, { passive: true });

    // Event delegation: one listener for the whole list, not one per row.
    this.viewport.addEventListener('click', (e) => {
      const row = e.target.closest('.vlist-row');
      if (!row || !this.onSelect) return;
      const index = Number(row.dataset.index);
      if (Number.isFinite(index)) this.onSelect(index, this.items[index]);
    });

    this._ro = new ResizeObserver(() => this._update());
    this._ro.observe(this.container);
  }

  /** Replace the backing data and jump back to the top. */
  setItems(items, { keepScroll = false } = {}) {
    this.items = items || [];
    this.spacer.style.height = `${this.items.length * this.rowHeight}px`;
    if (!keepScroll) this.container.scrollTop = 0;
    // Force a rebuild: the row at a given position is almost certainly a
    // different item now, even if the window happens to be unchanged.
    this._first = -1;
    this._update();
  }

  /** Re-render the visible rows in place, e.g. after a selection change. */
  refresh() {
    this._first = -1;
    this._update();
  }

  scrollToIndex(index, position = 'center') {
    const max = this.items.length * this.rowHeight - this.container.clientHeight;
    let top = index * this.rowHeight;
    if (position === 'center') top -= this.container.clientHeight / 2 - this.rowHeight / 2;
    this.container.scrollTop = Math.max(0, Math.min(top, Math.max(0, max)));
    this._update();
  }

  _row(i) {
    if (!this._pool[i]) {
      const el = document.createElement('div');
      el.className = 'vlist-row';
      this.viewport.appendChild(el);
      this._pool[i] = el;
    }
    return this._pool[i];
  }

  _update() {
    const scrollTop = this.container.scrollTop;
    const height = this.container.clientHeight;
    if (!height) return;

    const visible = Math.ceil(height / this.rowHeight);
    const first = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.overscan);
    const count = Math.min(this.items.length - first, visible + this.overscan * 2);

    if (first === this._first && count === this._count) return;
    this._first = first;
    this._count = count;

    for (let k = 0; k < count; k++) {
      const index = first + k;
      const el = this._row(k);
      el.style.display = 'block';
      el.style.transform = `translateY(${index * this.rowHeight}px)`;
      el.dataset.index = String(index);
      this.renderRow(index, this.items[index], el);
    }

    // Park the surplus rather than removing it — they will very likely be
    // needed again on the next scroll tick.
    for (let k = count; k < this._pool.length; k++) {
      this._pool[k].style.display = 'none';
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this._onScroll);
    this._ro.disconnect();
    this.viewport.remove();
  }
}
