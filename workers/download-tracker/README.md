# Whitestone download tracker (Cloudflare Worker)

Counts optional software-zip downloads for **Whitestone** across the
canonical repository, other branches, and forks. Forks are identified
by GitHub `owner/repo`.

Homepage is an **isolated counter**: the number is on the download
button. Nobody reports a download. The click is the count.

GET `/download` **serves** `whitestone-standalone.zip` via
`env.ASSETS.fetch` (HTTP 200). It does not 302 to GitHub.
`Cache-Control: private, no-store`. If the hosted asset is missing,
the Worker streams the latest GitHub Release zip and still returns 200.

`totalKey()` = `whitestone|__total__`. PROJECT `whitestone`. Worker
`whitestone-download-tracker`. KV namespace `WHITESTONE_DOWNLOADS`
bound as `DOWNLOADS`.

This Worker does **not** replace the live app at
https://whitestone.vibelock.workers.dev/ — that Worker stays the
product UI. This hostname is the counted zip + Views/Downloads page.

No secrets belong in this directory.

One ephemeral pro se advisor for Criminal, Civil, and Divorce.
Author: **Aziel Eliab** only.

This worker is Whitestone only. It is not mixed with The ARK, AZ-OS,
GodLock, ForgeReceipts, Glossa Filter, AZ-CLCE, or any other product.

Isolated counter: Worker `whitestone-download-tracker`, project
`whitestone`.

## Bindings

| Binding     | Type | Purpose |
|-------------|------|---------|
| `DOWNLOADS` | KV   | Counters keyed `project\|owner\|repo\|branch\|fork` |
| `AZIEL_RUNTIME` | service | Suite mesh `/v1/mesh/*` PROXY to aziel-runtime (HTTP fallback when unbound) |
| `ASSETS` | dir | Counted zip + `sigil.png` |

Binding name MUST stay `DOWNLOADS` (not `WHITESTONE_DOWNLOADS` — that
is the Cloudflare namespace title).

## Routes

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/` | Isolated homepage: increment views, live counts, Live Nodes strip. Rose-star brand mark top-left (`/sigil.png`, empty alt). |
| GET | `/sigil.png` | Same-origin Aziel Eliab rose-star brand mark (Worker assets). |
| GET | `/download?repo=&tag=&asset=` | Increment downloads, serve the zip from `ASSETS` (or stream GitHub if missing) |
| GET | `/count` | JSON `{project, views, downloads, total}` plus additive `views_human` / `views_bot` / `downloads_human` / `downloads_bot` (does not increment) |
| GET | `/stats` | JSON totals plus per-repo / per-branch breakdown plus the same human/bot fields |
| POST | `/event` | A fork reports a download |
| GET | `/v1/mesh` · `/v1/mesh/status` | PROXY suite mesh status via `AZIEL_RUNTIME`. Default OFF. Never enables. |
| GET | `/v1/mesh/nodes` | PROXY Live Nodes roster (5-minute presence) |
| POST | `/v1/mesh/{enable,disable,join,heartbeat,leave,broadcast}` | PROXY. Bearer required to enable. No auto-heal. |

Tracked asset URL:

```
https://whitestone-download-tracker.vibelock.workers.dev/download?asset=whitestone-standalone.zip
```

Live app (unchanged):

```
https://whitestone.vibelock.workers.dev/
```

The app Worker `GET /download` may still 302 to GitHub. That path is
**not** this tracker. Use this Worker when the count must increment
and the zip must be served as HTTP 200.

## CORS

All responses include `Access-Control-Allow-Origin: *`.

## AI runtime (`/v1`)

CORS `*`. `GET /v1/health`, `GET /v1/skill`, `GET /openapi.json`
(OpenAPI 3.1), `GET /ai`, `GET /mcp`.
`/v1/mesh/*` PROXY to aziel-runtime suite mesh (`AZIEL_RUNTIME`).
Default OFF. QNM-BUILD-1.0 live|locked|isolated. QNS-CD-1.0 hub cite /
Worker mesh cross-map only. No public qnsd proxy. No Node Gate. No
auto-heal.

Whitestone is a **catalog placement**. Do not invent door ops. Routes
under `/v1` do not increment download KV.

Works with ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude
(Anthropic), Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot /
Bing, Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence
surfaces, Amazon Q tooling, DuckAssist, You.com, Cohere, and other
MCP/OpenAPI-capable assistants. Always send `User-Agent: Mozilla/5.0`.

## Human / bot schema (`/stats` and `/count`)

Additive dual-count so digests can report real human counts. Old clients
keep working: `project`, `views`, `downloads`, and `total` (`total` =
downloads) are unchanged. New keys start at 0. Existing KV totals are
**never reset**.

Classification runs at the edge on each counted GET (`/`, `/download`,
`/go`) and on counted `POST /event`:

1. Health-check / uptime UA → bot bucket (counted, not skipped).
2. Cloudflare `request.cf.botManagement` when present: `verifiedBot ===
   true` or `score <= 30` → bot. Score `0` means not computed — ignored,
   never invented.
3. UA denylist (Googlebot, bingbot, GPTBot, ClaudeBot, Bytespider,
   PetalBot, Yandex, Semrush, Ahrefs, DotBot, curl/wget/python-requests
   defaults, CF-Healthchecks, …) → bot.
4. Empty UA → bot.
5. Else → human.

If Bot Management is unavailable, method is `ua_denylist +
healthcheck_ua` only.

**Invariant (always, on the JSON response):**
`views === views_human + views_bot` and
`downloads === downloads_human + downloads_bot`.

**Legacy strategy (b) — display remainder:** stored `views_human` /
`downloads_human` start at 0. The response sets `views_bot = views -
views_human` (same for downloads) so pre-split totals show as bot until
proven human. KV history is not rewritten. New traffic updates both the
total and one bucket. Shared modules (copy into other product trackers):
`src/classify.js` and `src/stats-shape.js`.

Homepage HTML is unchanged. Metrics / subsurface only.

## Deploy

After CLEAR, GitBaby deploys. From this directory:

```bash
cd workers/download-tracker
npx wrangler deploy
```

First-time KV (already pinned in `wrangler.toml` for this Worker):

```bash
cd workers/download-tracker
npx wrangler login
npx wrangler kv namespace create DOWNLOADS
# paste the id into wrangler.toml as the DOWNLOADS binding
npx wrangler deploy
```

Expected hostname:

`https://whitestone-download-tracker.vibelock.workers.dev`

## Verify (no deploy)

```bash
cd workers/download-tracker
node scripts/verify-mesh-proxy.mjs
node scripts/verify-human-bot.mjs
```
