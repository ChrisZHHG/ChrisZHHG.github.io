export const root = document.documentElement;
export const body = document.body;
export const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function setVar(name, value) {
  root.style.setProperty(name, value);
}
