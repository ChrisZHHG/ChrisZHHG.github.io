import Lenis from '../lib/lenis.mjs';

// Instant native placement. html carries `scroll-behavior: smooth`, which
// would turn a plain scrollTo into a glide, so it is overridden for one call.
function jumpNative(top) {
  const style = document.documentElement.style;
  const prev = style.scrollBehavior;
  style.scrollBehavior = 'auto';
  window.scrollTo(0, top);
  style.scrollBehavior = prev;
}

/**
 * createScroll — the smooth-scroll spine (the "tunnel corridor").
 *
 * Lenis replaces native wheel scrolling with a lerped virtual scroll: the single
 * biggest contributor to the "smooth, no-stutter, one continuous path" feel of the
 * 35mm reference. It still scrolls the real document, so window 'scroll' events
 * keep firing and getBoundingClientRect stays accurate — the archive scroll math
 * and the TOC scroll-spy continue to work unchanged.
 *
 * Fallbacks (CLAUDE.md §2.4, §6): reduced-motion and the mobile reel keep the
 * OS scroll. The reel rides CSS scroll-snap, which Lenis cannot coexist with, so
 * a desktop window narrowed into the reel gets native scroll too. We never
 * depend on Lenis for the page to be usable.
 *
 * Mode-bound: core/fold.js rebuilds this when the layout mode changes.
 *
 * @param {{ isReducedMotion: () => boolean, native: boolean }} options
 */
export function createScroll({ isReducedMotion, native }) {
  // No topbar anymore (removed with the sidebar chrome), so in-page anchor
  // jumps land the target flush at the top — no stale offset gap.
  const topbarH = () => 0;

  // ── Native fallback ──────────────────────────────────────────────────────
  if (isReducedMotion() || native) {
    return {
      lenis: null,
      jumpTo: jumpNative,
      scrollTo(target, opts = {}) {
        const top = typeof target === 'number'
          ? target
          : (target?.getBoundingClientRect().top ?? 0) + window.scrollY - (opts.offset ? -opts.offset : 0);
        window.scrollTo({ top, behavior: isReducedMotion() ? 'auto' : 'smooth' });
      },
      dispose() {},
    };
  }

  // ── Lenis spine ──────────────────────────────────────────────────────────
  const lenis = new Lenis({
    // 0.13 settles a touch faster than the old 0.1 — keeps the weighty 35mm
    // glide on a trackpad but feels more connected (less "floaty drift after
    // you stop") on a Windows mouse wheel, where each notch is a discrete jump.
    lerp: 0.13,
    smoothWheel: true,
    wheelMultiplier: 1.1,
  });

  // Lenis owns the scroll position; disable CSS smooth-scroll so they don't fight.
  const prevScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';

  let rafId = null;
  function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  // Smooth in-page anchor jumps (TOC, topbar, brand).
  const onAnchorClick = (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -topbarH() });
  };
  document.addEventListener('click', onAnchorClick);

  return {
    lenis,
    // Public scrollTo: callers pass either an absolute pixel target (archive math
    // already accounts for the topbar) or a node + explicit offset.
    scrollTo(target, opts = {}) {
      lenis.scrollTo(target, opts);
    },
    // Instant, inertia-free placement used by the fold controller. Lenis has
    // to re-measure first: its scroll limit is stale right after a resize.
    jumpTo(top) {
      lenis.resize();
      lenis.scrollTo(top, { immediate: true, force: true });
    },
    dispose() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.removeEventListener('click', onAnchorClick);
      document.documentElement.style.scrollBehavior = prevScrollBehavior;
      // Lenis arms a 400ms velocity-reset timer on every native scroll; if it
      // fires after destroy() it re-adds the `lenis` class to <html>. Cancel
      // it and silence the dead instance so a rebuilt reel starts clean.
      clearTimeout(lenis._resetVelocityTimeout);
      lenis.destroy();
      lenis.updateClassName = () => {};
      lenis.cleanUpClassName();
    },
  };
}
