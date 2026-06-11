export const root = document.documentElement;
export const body = document.body;
// "Touch-only device" = no hover AND coarse primary pointer (phones, tablets).
// NOT a touchscreen laptop: those report (hover: hover) / (any-pointer: fine)
// via their trackpad, so they correctly keep the desktop experience (custom
// cursor + coverflow carousel). Using bare (pointer: coarse) here mis-classified
// touchscreen Windows laptops (e.g. ThinkPad T14s in Edge) as phones — it hid
// the cursor and forced the mobile static stack on a 1920px screen.
export const isCoarsePointer =
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function setVar(name, value) {
  root.style.setProperty(name, value);
}

export function createReducedMotionController() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = mq.matches;
  const onChange = (e) => { reduced = e.matches; };
  mq.addEventListener('change', onChange);
  return {
    isReduced: () => reduced,
    dispose() {
      mq.removeEventListener('change', onChange);
    },
  };
}
