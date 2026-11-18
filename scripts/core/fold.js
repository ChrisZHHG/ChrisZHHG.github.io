import { readLayoutMode, onLayoutQueryChange, clamp } from '../lib/env.js';

/**
 * createFold — continuity across every viewport change, like a foldable phone
 * opening: the layout morphs, the reader stays on the same frame.
 *
 * The site has two layouts (CLAUDE.md §4): the desktop cinema (coverflow +
 * Lenis) and the mobile 35mm reel (static stack + native scroll-snap). CSS
 * swaps them through media queries the instant the viewport crosses 880px or
 * the pointer type changes; the JS that drives each one used to be decided
 * once at load, so a resized, rotated or unfolded page kept the wrong engine.
 *
 * This controller owns the mode-bound modules. On every viewport change it:
 *   1. reads the live mode (readLayoutMode) — the same query the CSS uses;
 *   2. if the mode flipped, closes a shutter, disposes the old modules and
 *      builds the new ones;
 *   3. puts the logical frame the reader was on (hero, project card N,
 *      section) back at the same place in the new layout;
 *   4. lets the modules re-derive their state, then opens the shutter.
 * All of it runs inside the resize / media-query event, which the browser
 * dispatches before style, layout and paint of that frame, so the first frame
 * painted at the new size is already the finished layout at the same frame.
 *
 * @param {{
 *   build: (mode: ReturnType<typeof readLayoutMode>) => { scroll: { jumpTo: (y: number) => void }, parts: Array<any> },
 *   isReducedMotion: () => boolean,
 * }} options
 */
export function createFold({ build, isReducedMotion }) {
  const root = document.documentElement;
  const archive = document.getElementById('archive');
  const cards = archive ? Array.from(archive.querySelectorAll('.card')) : [];
  const hero = document.querySelector('.act-hero');
  const flowSections = Array.from(document.querySelectorAll('.act-quiet, .act-coda'));

  let mode = readLayoutMode();
  let current = build(mode);
  let anchor = null;
  let expectY = null;
  let lastW = window.innerWidth;
  let lastH = window.innerHeight;

  const stats = { mode: mode.key, switches: 0, restores: 0, lastCostMs: 0, maxCostMs: 0, anchor: null };
  window.__fold = stats;
  root.dataset.layout = mode.key;

  // ── Shutter: a dark veil that is closed for the swap frame, then opens ────
  const veil = document.createElement('div');
  veil.className = 'fold-veil';
  veil.setAttribute('aria-hidden', 'true');
  document.body.appendChild(veil);
  let openRaf = 0;

  function closeShutter() {
    if (isReducedMotion()) return;
    cancelAnimationFrame(openRaf);
    veil.classList.remove('is-opening');
    veil.classList.add('is-closed');
    // Two frames: the first paints the closed veil over the new layout, the
    // second starts the opening transition from that painted state.
    openRaf = requestAnimationFrame(() => {
      openRaf = requestAnimationFrame(() => {
        veil.classList.remove('is-closed');
        veil.classList.add('is-opening');
      });
    });
  }

  // ── Anchor: which logical frame sits at the viewport center ───────────────
  const isCarousel = (m) => !m.reel && !m.reduced;

  function locate(el, vc) {
    const r = el.getBoundingClientRect();
    return { r, inside: r.top <= vc && r.bottom > vc, distance: Math.min(Math.abs(r.top - vc), Math.abs(r.bottom - vc)) };
  }

  function measure() {
    const vh = window.innerHeight;
    const vc = vh / 2;

    if (archive && cards.length && isCarousel(mode)) {
      const r = archive.getBoundingClientRect();
      const total = r.height - vh;
      if (total > 0 && r.top <= 1 && r.bottom >= vh - 1) {
        // Same index math as archive.js updateFromScroll.
        const x = clamp(-r.top / total, 0, 1) * cards.length + 0.15;
        const index = clamp(Math.floor(x), 0, cards.length - 1);
        return { kind: 'card', index, f: clamp(x - index, 0, 1) };
      }
    }

    const candidates = [];
    if (hero) candidates.push({ kind: 'el', id: 'hero', el: hero });
    if (archive) {
      if (isCarousel(mode)) candidates.push({ kind: 'el', id: 'archive', el: archive });
      else cards.forEach((el, index) => candidates.push({ kind: 'card', index, el }));
    }
    flowSections.forEach((el) => candidates.push({ kind: 'el', id: el.id, el }));

    let best = null;
    for (const c of candidates) {
      const hit = locate(c.el, vc);
      if (hit.r.height <= 0) continue;
      if (hit.inside) { best = { c, r: hit.r }; break; }
      if (!best || hit.distance < best.distance) best = { c, r: hit.r, distance: hit.distance };
    }
    if (!best) return null;
    const f = clamp((vc - best.r.top) / best.r.height, 0, 1);
    return best.c.kind === 'card'
      ? { kind: 'card', index: best.c.index, f }
      : { kind: 'el', id: best.c.id, f };
  }

  function targetY(a) {
    const vh = window.innerHeight;
    const vc = vh / 2;
    const y0 = window.scrollY;

    if (a.kind === 'card' && archive && cards[a.index]) {
      if (isCarousel(mode)) {
        const r = archive.getBoundingClientRect();
        const total = Math.max(0, r.height - vh);
        // Inverse of the index math, kept off the slice edges so rounding can
        // never tip the reader onto the neighbouring card.
        const p = clamp((a.index - 0.15 + clamp(a.f, 0.1, 0.9)) / cards.length, 0, 1);
        return y0 + r.top + p * total;
      }
      const r = cards[a.index].getBoundingClientRect();
      return y0 + r.top + a.f * r.height - vc;
    }

    let el = null;
    if (a.id === 'hero') el = hero;
    else if (a.id === 'archive') el = archive;
    else el = document.getElementById(a.id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return y0 + r.top + a.f * r.height - vc;
  }

  function capture() {
    if (expectY !== null) {
      const own = Math.abs(window.scrollY - expectY) < 2;
      expectY = null;
      if (own) return;
    }
    anchor = measure();
    stats.anchor = anchor;
  }

  function restore() {
    if (!anchor) return;
    const y = targetY(anchor);
    if (y === null || !Number.isFinite(y)) return;
    const max = Math.max(0, root.scrollHeight - window.innerHeight);
    const top = Math.round(clamp(y, 0, max));
    expectY = top;
    current.scroll.jumpTo(top);
    stats.restores += 1;
  }

  function syncParts() {
    current.parts.forEach((part) => {
      if (part && typeof part.sync === 'function') {
        try { part.sync(); } catch (error) { console.error('[fold:sync]', error); }
      }
    });
  }

  function disposeParts() {
    for (let i = current.parts.length - 1; i >= 0; i--) {
      const part = current.parts[i];
      if (part && typeof part.dispose === 'function') {
        try { part.dispose(); } catch (error) { console.error('[fold:dispose]', error); }
      }
    }
  }

  function onViewportChange() {
    const next = readLayoutMode();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const modeChanged = next.key !== mode.key;
    const widthChanged = w !== lastW;
    // A height-only change on touch is the browser toolbar collapsing during a
    // flick. Re-seating there would kill the momentum, so only width changes
    // (rotation, unfold, split view) or desktop window drags re-seat.
    const heightChanged = h !== lastH && !next.coarse;
    lastW = w;
    lastH = h;
    if (!modeChanged && !widthChanged && !heightChanged) return;

    const t0 = performance.now();
    if (modeChanged) {
      closeShutter();
      disposeParts();
      mode = next;
      current = build(mode);
      root.dataset.layout = mode.key;
      stats.mode = mode.key;
      stats.switches += 1;
    }
    restore();
    syncParts();
    const cost = performance.now() - t0;
    stats.lastCostMs = cost;
    stats.maxCostMs = Math.max(stats.maxCostMs, cost);
  }

  window.addEventListener('scroll', capture, { passive: true });
  window.addEventListener('resize', onViewportChange);
  const offQueries = onLayoutQueryChange(onViewportChange);
  capture();

  return {
    get mode() { return mode; },
    get scroll() { return current.scroll; },
    dispose() {
      window.removeEventListener('scroll', capture);
      window.removeEventListener('resize', onViewportChange);
      offQueries();
      cancelAnimationFrame(openRaf);
      disposeParts();
      veil.remove();
    },
  };
}
