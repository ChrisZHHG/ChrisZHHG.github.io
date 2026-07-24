import { SkipInitError } from '../lib/safe.js';

/**
 * initIndexMenu — the minimal viewfinder chrome's behaviour.
 *
 * Two jobs:
 *   1. Open/close the full-screen INDEX chapter overlay (button, ✕, ESC,
 *      click-on-backdrop). Chapter links are plain in-page anchors, so the
 *      global smooth-scroll handler in core/scroll.js does the gliding — here
 *      we only need to close the overlay on click.
 *   2. Auto-fade the floating chrome (.chrome) while the page is actively
 *      scrolling, and bring it back a beat after scrolling stops. Keeps the
 *      "ride" pure film; orientation returns when you pause.
 */
export function initIndexMenu() {
  const chrome = document.querySelector('[data-role="chrome"]');
  const menu = document.querySelector('[data-role="index-menu"]');
  const openBtn = document.querySelector('[data-role="index-open"]');
  const closeBtn = document.querySelector('[data-role="index-close"]');
  if (!menu || !openBtn) throw new SkipInitError('index menu markup missing');

  // Closed state is now driven by CSS (opacity/visibility); drop the pre-JS
  // `hidden` attribute so the overlay can fade instead of display:none-ing.
  menu.removeAttribute('hidden');

  const links = Array.from(menu.querySelectorAll('.index-list a'));
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('index-open');
    (links[0] || closeBtn || menu).focus?.();
  }
  function close() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('index-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  const onOpen = () => open();
  const onClose = () => close();
  openBtn.addEventListener('click', onOpen);
  closeBtn && closeBtn.addEventListener('click', onClose);

  // Close on chapter click; the global anchor handler (core/scroll.js) scrolls.
  const linkHandlers = links.map((a) => {
    const h = () => close();
    a.addEventListener('click', h);
    return [a, h];
  });

  // ESC closes; clicking the backdrop (the overlay itself, not a child) closes.
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const onBackdrop = (e) => { if (e.target === menu) close(); };
  document.addEventListener('keydown', onKey);
  menu.addEventListener('click', onBackdrop);

  // Auto-fade the chrome while scrolling; restore on pause.
  let fadeTimer = null;
  const onScroll = () => {
    if (!chrome) return;
    chrome.classList.add('is-hidden');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => chrome.classList.remove('is-hidden'), 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  return {
    dispose() {
      openBtn.removeEventListener('click', onOpen);
      closeBtn && closeBtn.removeEventListener('click', onClose);
      linkHandlers.forEach(([a, h]) => a.removeEventListener('click', h));
      document.removeEventListener('keydown', onKey);
      menu.removeEventListener('click', onBackdrop);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(fadeTimer);
    },
  };
}
