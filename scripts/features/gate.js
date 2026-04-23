export function initGate({ body, prefersReducedMotion }) {
  const gate = document.querySelector('[data-role="gate"]');
  if (!gate) return;

  const VISIT_KEY = 'cz_visited_v2';
  const alreadyVisited = (() => {
    try { return !!localStorage.getItem(VISIT_KEY); } catch (_) { return false; }
  })();

  if (alreadyVisited || prefersReducedMotion) {
    gate.remove();
    return;
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

  ['click', 'touchend', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, dismiss, { once: true, capture: true });
  });

  setTimeout(dismiss, 6000);
}
