import { SkipInitError } from '../lib/safe.js';

/**
 * initEmbeds — click-to-load for heavy third-party embeds
 * (Hugging Face Space, Loom, the CyberTao site, the YouTube walkthrough).
 *
 * Why: auto-loading these inside the focal card caused three real problems —
 *   1. cold-start WHITE screens (the HF Space "Preparing Space" flash) that
 *      broke the dark cinematic mood;
 *   2. a scroll-TRAP — wheeling with the cursor over a live iframe scrolled the
 *      iframe, not the page, so the visitor got stuck on the card;
 *   3. a pile of third-party JS / trackers / console noise loaded on every view.
 *
 * The fix: each embed slot shows a dark, on-brand poster button first. Wheeling
 * over the poster scrolls the PAGE (it's our element, not the iframe), and no
 * cold-start screen shows. Only when the visitor clicks "load" is the real
 * iframe injected — an explicit, intentional interaction (very on-theme).
 *
 * Markup contract: <iframe data-embed-src="…" data-embed-label="…"> inside a
 * positioned holder. The iframe is left srcless until the poster is clicked.
 */
export function initEmbeds() {
  const frames = Array.from(document.querySelectorAll('iframe[data-embed-src]'));
  if (!frames.length) throw new SkipInitError('no [data-embed-src] iframes');

  const cleanups = [];

  frames.forEach((frame) => {
    const holder = frame.parentElement;
    if (!holder) return;

    // Video embeds carry autoplay=1 in their src, so the single poster click
    // both loads AND starts playback — no second "start" (the native play
    // button) to hunt for. Interactive apps (HF Space, CyberTao) have no
    // playback, so they just load. Reflect that in the poster's wording.
    const src = frame.dataset.embedSrc || '';
    const isVideo = /youtube|youtu\.be|loom\.com|vimeo/.test(src);
    const label = frame.getAttribute('data-embed-label') || 'live demo';
    const poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'embed-poster';
    poster.setAttribute('aria-label', (isVideo ? 'Play ' : 'Load ') + label);
    poster.innerHTML =
      '<span class="embed-poster-play" aria-hidden="true">▶</span>' +
      '<span class="embed-poster-label">' + label + '</span>' +
      '<span class="embed-poster-hint">' + (isVideo ? 'click to play' : 'click to load') + '</span>';

    frame.style.display = 'none';
    holder.appendChild(poster);

    const load = () => {
      if (frame.src) return;
      poster.classList.add('is-loading');
      frame.src = frame.dataset.embedSrc;
      frame.style.display = '';
      // Reveal the iframe once it actually paints, so we never flash the slot.
      frame.addEventListener('load', () => poster.remove(), { once: true });
      // Safety: drop the poster after a beat even if 'load' never fires.
      setTimeout(() => poster.remove(), 4000);
    };
    poster.addEventListener('click', load);
    cleanups.push(() => poster.removeEventListener('click', load));
  });

  return {
    dispose() { cleanups.forEach((fn) => fn()); },
  };
}
