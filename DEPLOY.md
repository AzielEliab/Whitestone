# Deploy Whitestone

Whitestone is a **Cloudflare Worker** named `whitestone` that serves the built SPA from `dist/` and hosts view/download counters.

## One-time

1. Install Node 20+ and a Cloudflare account.
2. Log in:

```bash
npx wrangler login
```

3. Deploy (creates the Worker, Durable Object namespace, and `*.workers.dev` hostname):

```bash
npm install
npm run deploy
```

That is `npm run build && wrangler deploy`.

Expected hostname pattern:

`https://whitestone.<your-subdomain>.workers.dev`

If you own a custom domain, attach it in the Cloudflare dashboard to the `whitestone` Worker. Then update:

- `public/robots.txt` sitemap URL
- `public/sitemap.xml` locs
- README badge URLs
- `index.html` canonical link

## Counters

| Path | Behavior |
| --- | --- |
| `GET /count/view` | Increment views; SVG badge |
| `GET /count/download` | Increment downloads; SVG badge |
| `GET /count/view?format=json` | `{ key, count }` |
| `GET /download` | Increment downloads and 302 to the GitHub Release zip |
| `GET /v1/software` | Agent-facing catalog card |
| `GET /catalog.json` | Same product card as static JSON |
| `GET /api/research` | Research capability + allowlist summary (no case body) |
| `POST /api/research` | Allowlisted public-page fetch → `{ sources, notes }` |

Counters use a **Durable Object** (`CounterDO`). No KV namespace has to be created first.

## GitHub Release zip

```bash
git tag v1.0.0
git push origin v1.0.0
```

The `Release` workflow builds `release/whitestone-standalone.zip` and publishes it. Update `RELEASE_ASSET_URL` in `wrangler.toml` only if the asset name changes.

## CI without Cloudflare credentials

GitHub Actions **builds and tests** on every push. It does **not** deploy. Deploy stays `npx wrangler deploy` from a machine that has Wrangler auth (or add `CLOUDFLARE_API_TOKEN` later and a deploy job if you want).

## Local Worker

```bash
npm run build
npx wrangler dev
```

Open the printed `localhost` URL. `/count/view`, `/v1/software`, and `/api/research` work there.

## Redeploy note (web research)

`/api/research` is Worker code, not a static asset. **After this feature merges, redeploy the Worker** (`npm run deploy`) so the live hostname serves the new routes. Until then, the SPA falls back to the bundled knowledge layer and says the live lookup is unavailable.

The Worker must not log request bodies (query text). Short metrics only (`qlen`, jurisdiction, matter, source count). URL excerpts may be cached for ~15 minutes by URL, never as a case file.

## Honesty

This deploy hosts **software**, not user case files. The Worker must not log request bodies or store uploads. Whitestone's UI keeps case state in the browser session only.

The Worker URL is the product for **phone and desktop**. Open `https://whitestone.vibelock.workers.dev` and complete a session in the browser. A software zip is optional (header / Welcome **Download software**, or `GET /download`). `manifest.webmanifest` and `sw.js` support Add to Home Screen; the service worker caches the static shell only and is unregistered on End & erase. After a merge that changes the Worker or UI, redeploy.
