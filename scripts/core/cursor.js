import { setVar, lerp } from '../lib/env.js';
import { SkipInitError } from '../lib/safe.js';

export function initCursor({ Stage, FocalPlane, isCoarsePointer, isReducedMotion }) {
  const el = document.querySelector('.cursor');
  if (!el) throw new SkipInitError('missing .cursor element');

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
    if (isReducedMotion() || isCoarsePointer) return;
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

  const onMouseMove = (e) => moveTo(e.clientX, e.clientY);
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  const hoverSelector = 'a, button, .manifesto-item, .card-flip-hint, .card-split-cta, .demo-link, .demo-video-tile, .poster-cta, .nod-hotspot, [data-role="flip-back"], [data-role="prev"], [data-role="next"]';
  const onMouseOver = (e) => {
    if (e.target.closest(hoverSelector)) el.classList.add('is-hover');
  };
  const onMouseOut = (e) => {
    if (e.target.closest(hoverSelector)) el.classList.remove('is-hover');
  };
  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout', onMouseOut);

  const frameListeners = [];
  document.querySelectorAll('iframe').forEach((frame) => {
    const onEnter = () => setVar('--bracket-opacity', '0');
    const onLeave = () => setVar('--bracket-opacity', '1');
    frame.addEventListener('mouseenter', onEnter);
    frame.addEventListener('mouseleave', onLeave);
    frameListeners.push([frame, onEnter, onLeave]);
  });

  const onDocLeave = () => setVar('--bracket-opacity', '0');
  const onDocEnter = () => setVar('--bracket-opacity', '1');
  document.addEventListener('mouseleave', onDocLeave);
  document.addEventListener('mouseenter', onDocEnter);

  const idleInterval = setInterval(() => {
    if (performance.now() - lastT > 180) scheduleDwell();
  }, 120);

  return {
    velocity: () => velocityEMA,
    get x() { return x; },
    get y() { return y; },
    el,
    dispose() {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mouseleave', onDocLeave);
      document.removeEventListener('mouseenter', onDocEnter);
      frameListeners.forEach(([frame, onEnter, onLeave]) => {
        frame.removeEventListener('mouseenter', onEnter);
        frame.removeEventListener('mouseleave', onLeave);
      });
      if (dwellTimer) clearTimeout(dwellTimer);
      clearInterval(idleInterval);
    },
  };
}
