export const root = document.documentElement;
export const body = document.body;
// "Touch-only device" = no hover AND coarse primary pointer (phones, tablets).
// NOT a touchscreen laptop: those report (hover: hover) / (any-pointer: fine)
// via their trackpad, so they correctly keep the desktop experience (custom
// cursor + coverflow carousel). Using bare (pointer: coarse) here mis-classified
// touchscreen Windows laptops (e.g. ThinkPad T14s in Edge) as phones — it hid
// the cursor and forced the mobile static stack on a 1920px screen.
const coarseQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
export const isCoarsePointer = () => coarseQuery.matches;

// The reel query is the single JS mirror of the CSS breakpoint that swaps the
// desktop cinema (coverflow + Lenis) for the mobile 35mm reel (static stack +
// native scroll-snap). mobile-film.css and archive.css use the same query, so
// JS and CSS always agree on which layout is live.
export const REEL_QUERY = '(max-width: 880px), (hover: none) and (pointer: coarse)';
const reelQuery = window.matchMedia(REEL_QUERY);
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * readLayoutMode — the layout the CSS is rendering right now.
 * `MediaQueryList.matches` is evaluated on read, so this is correct inside a
 * resize handler, before the matching `change` event has fired.
 *   reel    → touch or narrow: static stack, native scroll, scroll-snap
 *   reduced → prefers-reduced-motion: no flash, no inertia
 *   key     → changes exactly when the mode-bound modules must be rebuilt
 */
export function readLayoutMode() {
  const reel = reelQuery.matches;
  const reduced = reducedQuery.matches;
  return {
    reel,
    reduced,
    coarse: coarseQuery.matches,
    key: `${reel ? 'reel' : 'cinema'}${reduced ? '-still' : ''}`,
  };
}

/** Subscribe to every media query that can change the layout mode. */
export function onLayoutQueryChange(fn) {
  const queries = [reelQuery, reducedQuery, coarseQuery];
  const add = (q) => (q.addEventListener ? q.addEventListener('change', fn) : q.addListener(fn));
  const remove = (q) => (q.removeEventListener ? q.removeEventListener('change', fn) : q.removeListener(fn));
  queries.forEach(add);
  return () => queries.forEach(remove);
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function setVar(name, value) {
  root.style.setProperty(name, value);
}

export function createReducedMotionController() {
  return {
    isReduced: () => reducedQuery.matches,
    dispose() {},
  };
}
