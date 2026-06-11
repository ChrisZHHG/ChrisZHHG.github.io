/**
 * initPerfMode — automatic low-power degrade.
 *
 * Some effects are cheap on a discrete/ProMotion Mac GPU but starve a weaker
 * integrated GPU (e.g. a ThinkPad T14s): the always-on bellows "breathing"
 * recomposites a full-viewport masked + mix-blend layer every frame, and the
 * backdrop-filter blurs repaint on scroll. On a 120Hz Mac this is invisible;
 * on a 60Hz laptop that can't keep up it shows as scroll jank.
 *
 * We sample real frame timings for the first ~20s. If a sustained window is
 * janky (lots of frames slower than ~45fps), we add `html.perf-lite` ONCE
 * (sticky for the session) — CSS then freezes the breathing, drops the
 * mix-blend rim light, and removes backdrop blurs — and call onDegrade so the
 * JS breathing loop can stop too. A healthy 60Hz (or 120Hz) display never trips
 * it, so the curated look is untouched where the hardware can afford it.
 *
 * @param {{ isReducedMotion: () => boolean, onDegrade?: () => void }} options
 */
export function initPerfMode({ isReducedMotion, onDegrade }) {
  // Reduced-motion already ships a static, effect-free page — nothing to watch.
  if (isReducedMotion()) return { dispose() {} };

  const root = document.documentElement;
  const START_DELAY = 1200;      // ignore first-paint / font-swap jank
  const MONITOR_MS = 20000;      // watch the opening ~20s (covers first scrolls)
  const WINDOW = 90;             // rolling window ≈ 1.5s at 60fps
  const SLOW_FRAME_MS = 22;      // a frame slower than this missed ~45fps
  const STALL_MS = 100;          // above this = tab-switch/GC stall, not a render frame
  const BAD_RATIO = 0.4;         // >40% slow frames in the window → degrade

  let rafId = null;
  let last = performance.now();
  let begin = last;
  const recent = [];
  let done = false;

  function degrade() {
    done = true;
    root.classList.add('perf-lite');
    if (typeof onDegrade === 'function') {
      try { onDegrade(); } catch (_) { /* never let degrade throw */ }
    }
  }

  function tick(now) {
    const dt = now - last;
    last = now;

    if (now - begin > START_DELAY && dt <= STALL_MS) {
      recent.push(dt);
      if (recent.length > WINDOW) recent.shift();
      if (recent.length >= 60) {
        let slow = 0;
        for (let i = 0; i < recent.length; i++) if (recent[i] > SLOW_FRAME_MS) slow++;
        if (slow / recent.length > BAD_RATIO) { degrade(); return; }
      }
    }

    if (!done && now - begin < MONITOR_MS) {
      rafId = requestAnimationFrame(tick);
    }
  }

  rafId = requestAnimationFrame(tick);

  return {
    dispose() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}
