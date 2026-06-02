import { SkipInitError } from '../lib/safe.js';

export function initGate({ body, isReducedMotion }) {
  const gate = document.querySelector('[data-role="gate"]');
  if (!gate) throw new SkipInitError('missing [data-role="gate"]');

  const VISIT_KEY = 'cz_visited_v2';
  const alreadyVisited = (() => {
    try { return !!localStorage.getItem(VISIT_KEY); } catch (_) { return false; }
  })();

  if (alreadyVisited || isReducedMotion()) {
    gate.remove();
    return { status: 'skipped', reason: 'already visited or reduced-motion' };
  }

  body.classList.add('is-gated');
  gate.setAttribute('aria-hidden', 'false');

  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    gate.classList.add('is-leaving');
    gate.setAttribute('aria-hidden', 'true');
    body.classList.remove('is-gated');
    try { localStorage.setItem(VISIT_KEY, '1'); } catch (_) {}
    setTimeout(() => gate.remove(), 750);
  }

  // "scroll to enter" — wheel/touchmove count as scroll intent. click/key/touchend
  // still work as fallbacks. All one-shot; whichever fires first dismisses.
  const dismissEvents = ['click', 'touchend', 'keydown', 'wheel', 'touchmove'];
  dismissEvents.forEach((eventName) => {
    window.addEventListener(eventName, dismiss, { once: true, capture: true, passive: true });
  });

  const failSafeTimer = setTimeout(dismiss, 6000);

  return {
    dispose() {
      clearTimeout(failSafeTimer);
      dismissEvents.forEach((eventName) => {
        window.removeEventListener(eventName, dismiss, { capture: true });
      });
    },
  };
}
