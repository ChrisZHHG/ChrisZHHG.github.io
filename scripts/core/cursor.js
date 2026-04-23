import { setVar, lerp } from '../lib/env.js';

export function initCursor({ Stage, FocalPlane, isCoarsePointer, prefersReducedMotion }) {
  const el = document.querySelector('.cursor');
  if (!el) return { velocity: () => 0, get x() { return 0; }, get y() { return 0; }, el: null };

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let lastX = x;
  let lastY = y;
  let lastT = performance.now();
  let velocityEMA = 0;
  let dwellTimer = null;
  let isLocking = false;

  const STILL_THRESHOLD = 4;
  const DWELL_MS = 1800;

  setVar('--cx', `${x}px`);
  setVar('--cy', `${y}px`);

  function resetDwell() {
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
    if (isLocking) {
      FocalPlane.onMotion();
      isLocking = false;
    }
  }

  function scheduleDwell() {
    if (prefersReducedMotion || isCoarsePointer) return;
    if (Stage.current === 'archive') return;
    if (dwellTimer) return;
    dwellTimer = setTimeout(() => {
      if (!isLocking) {
        isLocking = true;
        FocalPlane.lock(x, y);
      }
    }, DWELL_MS);
  }

  function moveTo(nx, ny) {
    const now = performance.now();
    const dt = Math.max(1, now - lastT);
    const dx = nx - lastX;
    const dy = ny - lastY;
    const speed = Math.hypot(dx, dy) / dt * 1000;
    velocityEMA = lerp(velocityEMA, speed, 0.3);

    lastX = nx;
    lastY = ny;
    lastT = now;
    x = nx;
    y = ny;
    setVar('--cx', `${x}px`);
    setVar('--cy', `${y}px`);

    if (Math.hypot(dx, dy) > STILL_THRESHOLD) resetDwell();
  }

  window.addEventListener('mousemove', (e) => moveTo(e.clientX, e.clientY), { passive: true });

  const hoverSelector = 'a, button, .manifesto-item, .card-flip-hint, .card-split-cta, .demo-link, .demo-video-tile, .poster-cta, .nod-hotspot, [data-role="flip-back"], [data-role="prev"], [data-role="next"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelector)) el.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelector)) el.classList.remove('is-hover');
  });

  document.querySelectorAll('iframe').forEach((frame) => {
    frame.addEventListener('mouseenter', () => setVar('--bracket-opacity', '0'));
    frame.addEventListener('mouseleave', () => setVar('--bracket-opacity', '1'));
  });

  document.addEventListener('mouseleave', () => setVar('--bracket-opacity', '0'));
  document.addEventListener('mouseenter', () => setVar('--bracket-opacity', '1'));

  setInterval(() => {
    if (performance.now() - lastT > 180) scheduleDwell();
  }, 120);

  return {
    velocity: () => velocityEMA,
    get x() { return x; },
    get y() { return y; },
    el,
  };
}
