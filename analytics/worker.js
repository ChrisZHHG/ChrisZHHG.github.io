/**
 * chriszhang.me — first-party visit logger (Cloudflare Worker).
 *
 * POST /            → record a visit { ip, geo, ref, referrer, path, ua, time } to KV
 * GET  /log?key=…   → view the log as an HTML table (newest first), gated by ADMIN_KEY
 *
 * Bindings required (set in the Cloudflare dashboard — see analytics/README.md):
 *   - KV namespace bound as  VISITS
 *   - Secret/variable        ADMIN_KEY   (your private password to view the log)
 *
 * The visitor IP + geo are read SERVER-SIDE from Cloudflare headers, so the client
 * can't spoof them. The page only sends ref/referrer/path.
 */
const ORIGIN = 'https://chriszhang.me';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': ORIGIN,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    // ---- PUBLIC visit count — GET /count (no key; aggregate number only, no IPs) ----
    if (url.pathname === '/count' && request.method === 'GET') {
      const total = parseInt(await env.VISITS.get('stats:total'), 10) || 0;
      return new Response(JSON.stringify({ total }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
      });
    }

    // ---- View the log (HTML table) — GET /log?key=SECRET ----
    if (url.pathname === '/log' && request.method === 'GET') {
      if (!env.ADMIN_KEY || url.searchParams.get('key') !== env.ADMIN_KEY) {
        return new Response('forbidden', { status: 403 });
      }
      const list = await env.VISITS.list({ prefix: 'v:', limit: 1000 });
      const rows = (await Promise.all(list.keys.map((k) => env.VISITS.get(k.name, 'json'))))
        .filter(Boolean)
        .sort((a, b) => b.t - a.t);
      const esc = (s) =>
        String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      const trs = rows
        .map(
          (r) => `<tr>
            <td>${esc(new Date(r.t).toISOString().replace('T', ' ').slice(0, 19))}</td>
            <td>${esc(r.ip)}</td>
            <td>${esc([r.city, r.region, r.country].filter(Boolean).join(', ')) || '—'}</td>
            <td>${esc(r.ref || '—')}</td>
            <td>${esc(r.referrer || 'direct')}</td>
            <td>${esc(r.path)}</td>
            <td title="${esc(r.ua)}">${esc((r.ua || '').slice(0, 38))}</td>
          </tr>`
        )
        .join('');
      const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>visits · chriszhang.me</title>
        <style>
          body{font:13px/1.5 ui-monospace,SFMono-Regular,monospace;background:#14100d;color:#ece6d9;margin:0;padding:20px}
          h1{font-size:15px;color:#e8b84f;letter-spacing:.04em;margin:0 0 14px}
          table{border-collapse:collapse;width:100%}
          th,td{border:1px solid #2f2722;padding:6px 9px;text-align:left;vertical-align:top;white-space:nowrap}
          th{color:#e8b84f;position:sticky;top:0;background:#1b1511}
          td:nth-child(7){white-space:normal;max-width:280px;color:#9a8f7f}
          tr:hover td{background:#1b1511}
        </style>
        <h1>chriszhang.me — ${rows.length} visits (newest first)</h1>
        <table>
          <thead><tr><th>time (UTC)</th><th>IP</th><th>location</th><th>ref</th><th>referrer</th><th>path</th><th>user-agent</th></tr></thead>
          <tbody>${trs || '<tr><td colspan="7">no visits yet</td></tr>'}</tbody>
        </table>`;
      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
    }

    // ---- Record a visit — POST / ----
    if (request.method === 'POST') {
      let b = {};
      try {
        b = JSON.parse(await request.text());
      } catch (_) {}
      const cf = request.cf || {};
      const rec = {
        t: Date.now(),
        ip: request.headers.get('CF-Connecting-IP') || 'unknown',
        ref: String(b.ref || '').slice(0, 64),
        referrer: String(b.referrer || '').slice(0, 256),
        path: String(b.path || '').slice(0, 256),
        ua: request.headers.get('User-Agent') || '',
        country: cf.country || '',
        city: cf.city || '',
        region: cf.region || '',
      };
      const key = `v:${rec.t}-${Math.random().toString(36).slice(2, 8)}`;
      // detailed record: keep 180 days, then auto-expire
      await env.VISITS.put(key, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 180 });
      // public running total (never expires; the owner is already excluded via ?notrack).
      // Low-traffic read-increment-write; races are negligible for a personal site.
      const total = (parseInt(await env.VISITS.get('stats:total'), 10) || 0) + 1;
      await env.VISITS.put('stats:total', String(total));
      return new Response('ok', { headers: cors });
    }

    return new Response('cz-analytics', { headers: cors });
  },
};
