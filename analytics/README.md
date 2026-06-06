# Visitor logger — setup (≈5 min)

A tiny first-party analytics endpoint: every visit to chriszhang.me (from any entry
point — LinkedIn, resume, Google, direct) pings a Cloudflare Worker that records
**IP · location · ref · referrer · path · time** to KV. You view it as a table.

## 1. Deploy the Worker (Cloudflare dashboard)

1. Sign in at <https://dash.cloudflare.com> (free account is fine).
2. **Workers & Pages → Create → Workers → Create Worker.** Name it e.g. `cz-analytics`.
3. Click **Edit code**, delete the sample, paste the contents of **`worker.js`**, **Save & Deploy**.
4. Create the storage:
   - **Storage & Databases → KV → Create namespace**, name it `visits`.
   - Back in the Worker → **Settings → Bindings → Add → KV namespace**:
     - Variable name: **`VISITS`**  → select the `visits` namespace. Save.
5. Add your view password:
   - Worker → **Settings → Variables and Secrets → Add → Secret**:
     - Name: **`ADMIN_KEY`**, Value: pick a long random password. Save & deploy.
6. Copy the Worker URL (looks like `https://cz-analytics.<your-subdomain>.workers.dev`).

## 2. Point the site at it

In **`scripts/features/analytics.js`**, set:

```js
const ENDPOINT = 'https://cz-analytics.<your-subdomain>.workers.dev';
```

Commit + push (or tell me the URL and I'll do it). Tracking is off until this is set.

## 3. View who visited

Open: `https://cz-analytics.<your-subdomain>.workers.dev/log?key=YOUR_ADMIN_KEY`

A dark table, newest first, with IP / location / ref / referrer / path / user-agent.

## 4. Tell entry points apart (channel attribution)

Use a tagged URL in each place — the `ref` column then shows the source:

| Where | URL to use |
|---|---|
| LinkedIn (website field) | `https://chriszhang.me/?ref=linkedin` |
| Résumé (the link) | `https://chriszhang.me/?ref=resume` |
| Email signature | `https://chriszhang.me/?ref=email` |
| (anything else / typed / Google) | shows up via `referrer` or as `direct` |

## 4b. Public visit counter (everyone sees it)

Once `ENDPOINT` is set, the site footer automatically shows a **public running total**
("N visits"), fetched from the Worker's `GET /count` (aggregate number only — it
**never** exposes anyone's IP). Your own visits are excluded from this count via
`?notrack` (step 5). Nothing else to configure.

- Public, no key: `https://cz-analytics.<you>.workers.dev/count` → `{"total": N}`
- Private, key-gated (IPs): `https://cz-analytics.<you>.workers.dev/log?key=…`

## 5. Exclude yourself

Visit **`https://chriszhang.me/?notrack`** once on each of your devices/browsers.
That sets a permanent local opt-out — far more reliable than IP filtering, because
home/mobile IPs change. (You can clear it with `localStorage.removeItem('cz_notrack')`.)

## Notes

- IP + geo are read server-side from Cloudflare headers (the page can't spoof them).
- Records auto-expire after 180 days.
- Logging visitor IPs is fine for personal use; if you ever need it, add a short
  privacy note to the site. EU/GDPR only matters at scale.
