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
    body.classList.remove('is-gated');
    try { localStorage.setItem(VISIT_KEY, '1'); } catch (_) {}
    setTimeout(() => gate.remove(), 750);
  }

  const dismissEvents = ['click', 'touchend', 'keydown'];
  dismissEvents.forEach((eventName) => {
    window.addEventListener(eventName, dismiss, { once: true, capture: true });
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
