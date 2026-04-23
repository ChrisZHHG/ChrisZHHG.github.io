import { setVar } from '../lib/env.js';

/**
 * createBellows — drives the subtle breathing animation of the bellows
 * proscenium frame in bellows.css via --bellows-t.
 *
 * The variable oscillates sinusoidally between 0 and 0.02 with a ~6s period.
 * bellows.css maps this to a 1.5% scale pulse: imperceptible as motion,
 * but physiologically present — the camera is alive.
 *
 * @param {{ isReducedMotion: () => boolean }} options
 * @returns {{ dispose: () => void }}
 */
export function createBellows({ isReducedMotion }) {
  if (isReducedMotion()) {
    // Freeze at midpoint — bellows visible but still.
    setVar('--bellows-t', '0.01');
    return { dispose() {} };
  }

  const PERIOD_MS = 6000; // one full breath every 6 seconds
  let rafId = null;

  function tick(ts) {
    // Sine wave: 0 → 0.02, full cycle every PERIOD_MS
    const t = (Math.sin((ts / PERIOD_MS) * Math.PI * 2) * 0.5 + 0.5) * 0.02;
    setVar('--bellows-t', t.toFixed(4));
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return {
    dispose() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setVar('--bellows-t', '0');
    },
  };
}
