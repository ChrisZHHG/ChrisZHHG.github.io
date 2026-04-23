/**
 * createViewfinder — drives the four bellows telemetry readouts.
 *
 * Updates (all via requestAnimationFrame, coalesced):
 *   - [data-viewfinder="timer"]  — mm:ss since page load
 *   - [data-viewfinder="res"]    — viewport width × height in px
 *   - [data-viewfinder="fps"]    — instantaneous frame rate
 *   - [data-viewfinder="scroll"] — scroll progress as percentage
 *   - [data-viewfinder="frame"]  — current scene number out of 6 (derived from scroll)
 *   - [data-viewfinder="act"]    — current act label (stays static unless acts.js updates)
 *
 * Design: these are all cosmetic camera telemetry, inspired by 35mm.vercel.app.
 * They create the sense of "inside a piece of equipment" without drawing
 * attention away from content.
 *
 * @returns {{ dispose: () => void }}
 */
export function createViewfinder() {
  const byKey = (key) =>
    document.querySelectorAll(`[data-viewfinder="${key}"]`);
  const set = (key, value) => {
    byKey(key).forEach((el) => {
      if (el.textContent !== value) el.textContent = value;
    });
  };

  const bellows = document.querySelector('.bellows');
  if (!bellows) return { dispose() {} };

  const ACT_LABELS = [
    'ACT 01 · HERO',
    'ACT 02 · THEORY',
    'ACT 03 · FRICTION',
    'ACT 04 · ARCHIVE',
    'ACT 05 · WRITING',
    'ACT 06 · CODA',
  ];

  const startTs = performance.now();
  let rafId = null;
  let frameCount = 0;
  let lastFpsTs = startTs;
  let currentFps = 24;

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function computeScrollProgress() {
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (maxY <= 0) return 0;
    return Math.min(1, Math.max(0, window.scrollY / maxY));
  }

  function tick(ts) {
    frameCount += 1;
    // Update FPS once per second
    if (ts - lastFpsTs >= 1000) {
      currentFps = Math.round((frameCount * 1000) / (ts - lastFpsTs));
      frameCount = 0;
      lastFpsTs = ts;
      set('fps', `${String(currentFps).padStart(2, '0')} FPS`);
    }

    // Timer (updates every frame but only rewrites when seconds change)
    set('timer', formatTime(ts - startTs));

    // Resolution
    set('res', `${window.innerWidth}×${window.innerHeight}`);

    // Scroll + frame + act derivation
    const progress = computeScrollProgress();
    set('scroll', `SCROLL ${Math.round(progress * 100)}%`);

    const frameIdx = Math.min(5, Math.floor(progress * 6));
    set('frame', `FRAME ${frameIdx + 1} / 6`);
    set('act', ACT_LABELS[frameIdx]);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return {
    dispose() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
