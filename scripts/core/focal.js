export function createFocalPlane({ cursorEl, isReducedMotion }) {
  let pulseTimer = null;

  function lock() {
    if (isReducedMotion() || !cursorEl) return;
    if (pulseTimer) clearTimeout(pulseTimer);
    cursorEl.classList.add('is-flash');
    pulseTimer = setTimeout(() => cursorEl.classList.remove('is-flash'), 220);
  }

  function unlock() {
    if (!cursorEl) return;
    if (pulseTimer) {
      clearTimeout(pulseTimer);
      pulseTimer = null;
    }
    cursorEl.classList.remove('is-flash');
  }

  function onMotion() { unlock(); }

  return {
    lock,
    unlock,
    onMotion,
    dispose() { unlock(); },
  };
}
