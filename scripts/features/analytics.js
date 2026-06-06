/**
 * First-party visit ping → your Cloudflare Worker (see analytics/worker.js).
 *
 * Privacy / correctness:
 *  - never fires on localhost / 127.0.0.1 (dev)
 *  - ?notrack permanently opts THIS browser out (how you exclude yourself —
 *    visit https://chriszhang.me/?notrack once on each of your devices)
 *  - sends only { ref, referrer, path }; the IP + geo are read server-side by the
 *    Worker from Cloudflare headers, so nothing sensitive is computed client-side
 *  - fire-and-forget via sendBeacon; failures are swallowed (never affects the page)
 *
 * Channel attribution: tag each entry point so you can tell where a visitor came
 * from, e.g. put these URLs in each place:
 *    LinkedIn  → https://chriszhang.me/?ref=linkedin
 *    Resume    → https://chriszhang.me/?ref=resume
 *    (untagged / direct / search engines show up as referrer or "direct")
 */

const ENDPOINT = 'https://cz-analytics.zhang-hange.workers.dev';

export function initAnalytics() {
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return { status: 'skipped', reason: 'localhost' };
  }

  const params = new URLSearchParams(location.search);

  // Owner opt-out: ?notrack sets a permanent flag for this browser.
  if (params.has('notrack')) {
    try { localStorage.setItem('cz_notrack', '1'); } catch (_) {}
  }
  let excluded = false;
  try { excluded = localStorage.getItem('cz_notrack') === '1'; } catch (_) {}
  if (excluded) return { status: 'skipped', reason: 'notrack opt-out' };

  if (!ENDPOINT) return { status: 'skipped', reason: 'endpoint not configured' };

  const payload = JSON.stringify({
    ref: params.get('ref') || '',
    referrer: document.referrer || '',
    path: location.pathname + location.search,
  });

  try {
    if (navigator.sendBeacon) {
      // text/plain avoids a CORS preflight; the Worker parses the body as JSON.
      navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'text/plain' }));
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        body: payload,
        keepalive: true,
        headers: { 'Content-Type': 'text/plain' },
      }).catch(() => {});
    }
  } catch (_) {}

  return { ok: true };
}

/**
 * Public visit counter — fetches the aggregate total from the Worker and shows it
 * in the footer. Runs for EVERYONE (it is public, and not affected by ?notrack —
 * the owner is excluded from the COUNT itself, but still sees the number).
 * Aggregate only; never exposes individual IPs.
 */
export function showVisitCount() {
  if (!ENDPOINT) return { status: 'skipped', reason: 'endpoint not configured' };
  const el = document.querySelector('[data-role="visit-count"]');
  if (!el) return { status: 'skipped', reason: 'no counter element' };

  fetch(ENDPOINT + '/count')
    .then((r) => r.json())
    .then((d) => {
      if (typeof d.total === 'number') {
        el.textContent = d.total.toLocaleString() + (d.total === 1 ? ' visit' : ' visits');
        el.classList.add('is-loaded');
      }
    })
    .catch(() => {});

  return { ok: true };
}
