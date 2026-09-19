import { classifyRequest, readBotManagement } from "./classify.js";
import * as engine from "./engine.js";
import {
  isMeshPath,
  meshOpenApiPaths,
  meshPointer,
  runMeshProxy,
} from "./mesh.js";
import {
  isolatedKeys,
  isReservedCounterKey,
  shapeCountBody,
  shapeHumanBotFields,
} from "./stats-shape.js";

const EXAMPLE_PAYLOAD = {
  text: "session-only educational procedural overview",
};

const SKILL_MARKDOWN = `---
name: Whitestone
description: Use when calling the Whitestone download tracker /v1 or installing the optional software zip. Dual surface: Worker /v1 + GET /mcp. Whitestone is a catalog placement. Do not invent door ops. This Worker /v1/mesh/* PROXY to aziel-runtime via AZIEL_RUNTIME. Suite mesh default OFF. QNM-BUILD-1.0 live|locked|isolated. QNS-CD-1.0 photon QNS1 packet transfer (hub cite / Worker mesh cross-map only; no public qnsd proxy). No Node Gate. No auto-heal. Author Aziel Eliab.
---

# Whitestone

One ephemeral pro se advisor with Criminal, Civil, and Divorce practice areas. Live Worker URL on phone or desktop — zip optional. Session-only memory; wipe on close. Uploads only, no case exports, no third-party LLM APIs. Author: Aziel Eliab.

**THIS IS:** one ephemeral pro se advisor — educational procedural software for Criminal, Civil, and Divorce.

Author: **Aziel Eliab**. Forks are welcome and always allowed. Apache-2.0.

Always send \`User-Agent: Mozilla/5.0\`. Cloudflare Workers may 403 an empty agent.

## Call these URLs

- Live app: https://whitestone.vibelock.workers.dev/
- Worker OpenAPI: https://whitestone-download-tracker.vibelock.workers.dev/openapi.json
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- MCP: \`POST https://aziel-runtime.vibelock.workers.dev/mcp\`
- This Worker MCP pointer: \`GET https://whitestone-download-tracker.vibelock.workers.dev/mcp\`
- Live skill (this markdown): \`GET https://whitestone-download-tracker.vibelock.workers.dev/v1/skill\`
- Suite mesh PROXY: \`GET https://whitestone-download-tracker.vibelock.workers.dev/v1/mesh\` (default OFF)

Ops (do **not** increment downloads or views):

| Method | Path | What |
|--------|------|------|
| GET | \`/v1/health\` | Liveness. Does not increment downloads. |
| GET | \`/v1/skill\` | This markdown. Does not increment downloads. |
| GET | \`/v1/mesh\` | PROXY suite mesh status. Default OFF. QNM live\\|locked\\|isolated. QNS-CD-1.0 cross-map. Never enables. No public qnsd proxy. |
| GET | \`/v1/mesh/nodes\` | PROXY Live Nodes roster (5-minute presence). |
| POST | \`/v1/mesh/{enable,disable,join,heartbeat,leave,broadcast}\` | PROXY. Bearer required to enable. No auto-heal. Anon-broadcast is not a publish path. |

Works with ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude (Anthropic), Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot / Bing, Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence surfaces, Amazon Q tooling, DuckAssist, You.com, Cohere, and other MCP/OpenAPI-capable assistants. Import OpenAPI as a custom tool or GPT Action, or connect MCP. This Worker \`/v1/mesh/*\` PROXY to aziel-runtime via AZIEL_RUNTIME. Catalog MCP \`mesh_*\` + FragGate \`slug=mesh\`. Suite mesh default OFF. QNM-BUILD-1.0 live|locked|isolated. QNS-CD-1.0 photon QNS1 packet transfer (hub cite / Worker mesh cross-map only; local qnsd in qnm-node; no public proxy). No Node Gate. No auto-heal.

## Example

\`\`\`bash
curl -s -A 'Mozilla/5.0' https://whitestone-download-tracker.vibelock.workers.dev/v1/health
curl -s -A 'Mozilla/5.0' https://whitestone-download-tracker.vibelock.workers.dev/v1/skill
curl -s -A 'Mozilla/5.0' https://whitestone-download-tracker.vibelock.workers.dev/v1/mesh
\`\`\`

Counted download (zip HTTP 200, no 302): https://whitestone-download-tracker.vibelock.workers.dev/download?asset=whitestone-standalone.zip
GitHub: https://github.com/AzielEliab/Whitestone
Live app: https://whitestone.vibelock.workers.dev/

## Catalog + local UI

Author: **Aziel Eliab**. Honest scope: educational procedural overview. Hosted never stores case files.

- Catalog: https://aziel-runtime.vibelock.workers.dev/
- Catalog OpenAPI: https://aziel-runtime.vibelock.workers.dev/openapi.json
- Catalog MCP: \`POST https://aziel-runtime.vibelock.workers.dev/mcp\`
- This Worker skill: \`GET https://whitestone-download-tracker.vibelock.workers.dev/v1/skill\`
- This Worker OpenAPI: https://whitestone-download-tracker.vibelock.workers.dev/openapi.json
- Sample payload: \`GET https://whitestone-download-tracker.vibelock.workers.dev/v1/example\`

Worker homepage Live Nodes strip polls \`GET /v1/mesh\` (default OFF). QNS-CD-1.0 is a hub cite / Worker mesh cross-map only.

Works with ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude (Anthropic), Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot / Bing, Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence surfaces, Amazon Q tooling, DuckAssist, You.com, Cohere, and other MCP/OpenAPI-capable assistants.
`;

/**
 * Whitestone download tracker (Cloudflare Worker).
 *
 * GET  /        increments views (KV whitestone|__views__) + human/bot bucket
 * GET  /download increments downloads, serves zip via env.ASSETS.fetch (no 302)
 * GET  /count   JSON {project, views, downloads, total} plus additive human/bot
 * GET  /stats   JSON totals + per-repo + per-branch breakdown + human/bot
 * POST /event   forks report a download {owner,repo,branch,fork,asset}
 * /v1, /mcp, and /v1/mesh/* do not increment views or downloads.
 *
 * KV binding DOWNLOADS. Keys: project|owner|repo|branch|fork
 * totalKey() = whitestone|__total__
 * Additive split keys: views_human / views_bot / downloads_human / downloads_bot
 * Existing views/downloads totals are never reset. Human/bot start at 0.
 * CORS *. No secrets in this tree.
 * Isolated counter: Worker whitestone-download-tracker, project whitestone.
 * Not mixed with any other product.
 *
 * Hosted /v1 never stores case files or uploads.
 * Do NOT add unlock/encrypt/decrypt or case-export paths.
 */

const PROJECT = "whitestone";
const KEYS = isolatedKeys(PROJECT);
const DEFAULT_ASSET = "whitestone-standalone.zip";
const DEFAULT_OWNER = "AzielEliab";
const DEFAULT_REPO = "Whitestone";
const DEFAULT_BRANCH = "main";
const HOST = "https://whitestone-download-tracker.vibelock.workers.dev";
const GITHUB_REPO = "https://github.com/AzielEliab/Whitestone";
const GITHUB_RELEASES = "https://github.com/AzielEliab/Whitestone/releases";
const GITHUB_LATEST = "https://github.com/AzielEliab/Whitestone/releases/latest";
const APP_WORKER = "https://whitestone.vibelock.workers.dev";
const INSTALL_LINE = "curl -fsSL https://whitestone-download-tracker.vibelock.workers.dev/install.sh | bash";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, X-Aziel-Runtime-Token, User-Agent, MCP-Protocol-Version, mcp-session-id",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function splitOwnerRepo(value, fallbackOwner, fallbackRepo) {
  if (typeof value === "string" && value.includes("/")) {
    const [o, r] = value.split("/").filter(Boolean);
    if (o && r) return { owner: o, repo: r };
  }
  return { owner: fallbackOwner, repo: fallbackRepo };
}

function parseDims(src) {
  const get = (k) => {
    if (src == null) return null;
    if (typeof src.get === "function") {
      const v = src.get(k);
      return v == null || v === "" ? null : v;
    }
    const v = src[k];
    return v == null || v === "" ? null : v;
  };

  let owner = get("owner") || DEFAULT_OWNER;
  let repo = get("repo") || DEFAULT_REPO;
  if (typeof repo === "string" && repo.includes("/")) {
    const split = splitOwnerRepo(repo, owner, DEFAULT_REPO);
    owner = split.owner;
    repo = split.repo;
  }

  const branch = get("branch") || DEFAULT_BRANCH;
  const tag = get("tag") || "latest";
  const asset = get("asset") || "";

  const forkRaw = get("fork");
  let fork = "0";
  if (forkRaw === 1 || forkRaw === true || forkRaw === "1" || forkRaw === "true") {
    fork = "1";
  } else if (typeof forkRaw === "string" && forkRaw.includes("/")) {
    const split = splitOwnerRepo(forkRaw, owner, repo);
    owner = split.owner;
    repo = split.repo;
    fork = "1";
  } else if (forkRaw != null && forkRaw !== 0 && forkRaw !== false && forkRaw !== "0" && forkRaw !== "false") {
    fork = "1";
  }

  if (`${owner}/${repo}`.toLowerCase() !== `${DEFAULT_OWNER}/${DEFAULT_REPO}`.toLowerCase()) {
    fork = "1";
  }

  return { project: PROJECT, owner, repo, branch, fork, tag, asset };
}

function kvKey(dims) {
  return `${dims.project}|${dims.owner}|${dims.repo}|${dims.branch}|${dims.fork}`;
}

function githubAssetUrl(owner, repo, tag, asset) {
  if (!asset) {
    if (owner === DEFAULT_OWNER && repo === DEFAULT_REPO) return GITHUB_RELEASES;
    return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases`;
  }
  if (!tag || tag === "latest") {
    return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest/download/${encodeURIComponent(asset)}`;
  }
  return `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(asset)}`;
}

function totalKey() {
  return KEYS.total;
}

function viewsKey() {
  return KEYS.views;
}

function githubCacheKey() {
  return KEYS.github;
}

async function bump(env, key) {
  const n = parseInt((await env.DOWNLOADS.get(key)) || "0", 10) + 1;
  await env.DOWNLOADS.put(key, String(n));
  return n;
}

async function incrementSplit(env, humanKey, botKey, request) {
  const cls = classifyRequest(request);
  const splitKey = cls.bucket === "human" ? humanKey : botKey;
  await bump(env, splitKey);
  return cls;
}

async function increment(env, dims, request) {
  const key = kvKey(dims);
  await bump(env, key);
  const tot = await bump(env, totalKey());
  await incrementSplit(env, KEYS.downloads_human, KEYS.downloads_bot, request);
  return tot;
}

async function listAllKeys(env) {
  const keys = [];
  let cursor;
  do {
    const page = await env.DOWNLOADS.list(cursor ? { cursor } : {});
    keys.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return keys;
}

async function collectStats(env, request) {
  const keys = await listAllKeys(env);
  let total = 0;
  const by_repo = {};
  const by_branch = {};
  const by_fork = { "0": 0, "1": 0 };
  const breakdown = [];

  for (const k of keys) {
    const name = k.name;
    if (isReservedCounterKey(name, PROJECT)) continue;
    const n = parseInt((await env.DOWNLOADS.get(name)) || "0", 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    const parts = name.split("|");
    if (parts.length < 5) continue;
    const [project, owner, repo, branch, fork] = parts;
    total += n;
    const repoId = `${owner}/${repo}`;
    by_repo[repoId] = (by_repo[repoId] || 0) + n;
    by_branch[branch] = (by_branch[branch] || 0) + n;
    const forkFlag = fork === "1" ? "1" : "0";
    by_fork[forkFlag] = (by_fork[forkFlag] || 0) + n;
    breakdown.push({ project, owner, repo, branch, fork: forkFlag, count: n });
  }

  const totalDirect = parseInt((await env.DOWNLOADS.get(totalKey())) || "0", 10);
  const shown = Number.isFinite(totalDirect) && totalDirect > 0 ? totalDirect : total;
  const views = parseInt((await env.DOWNLOADS.get(viewsKey())) || "0", 10) || 0;
  const viewsHuman = parseInt((await env.DOWNLOADS.get(KEYS.views_human)) || "0", 10) || 0;
  const downloadsHuman = parseInt((await env.DOWNLOADS.get(KEYS.downloads_human)) || "0", 10) || 0;
  const botManagementAvailable = readBotManagement(request).available;
  const split = shapeHumanBotFields({
    views,
    downloads: shown,
    views_human: viewsHuman,
    downloads_human: downloadsHuman,
    botManagementAvailable,
  });
  return {
    project: PROJECT,
    total: shown,
    views,
    downloads: shown,
    ...split,
    by_repo,
    by_branch,
    by_fork,
    breakdown,
    github: (await githubStats(env)),
    note: "Forks identified by GitHub owner/repo. Key layout: project|owner|repo|branch|fork",
  };
}

async function incrementViews(env, request) {
  const n = await bump(env, viewsKey());
  await incrementSplit(env, KEYS.views_human, KEYS.views_bot, request);
  return n;
}

async function githubStats(env) {
  const cached = await env.DOWNLOADS.get(githubCacheKey());
  if (cached) {
    try {
      const obj = JSON.parse(cached);
      if (obj && obj.fetched_at && Date.now() - obj.fetched_at < 5 * 60 * 1000) {
        return obj;
      }
    } catch {
      /* ignore */
    }
  }
  const headers = { "User-Agent": "Mozilla/5.0 Whitestone-download-tracker", Accept: "application/vnd.github+json" };
  let stars = 0;
  let forks = 0;
  let watchers = 0;
  let release_download_count = 0;
  try {
    const repoRes = await fetch("https://api.github.com/repos/AzielEliab/Whitestone", { headers });
    if (repoRes.ok) {
      const repo = await repoRes.json();
      stars = Number(repo.stargazers_count) || 0;
      forks = Number(repo.forks_count) || 0;
      watchers = Number(repo.subscribers_count != null ? repo.subscribers_count : repo.watchers_count) || 0;
    }
    const relRes = await fetch("https://api.github.com/repos/AzielEliab/Whitestone/releases/latest", { headers });
    if (relRes.ok) {
      const rel = await relRes.json();
      const assets = Array.isArray(rel.assets) ? rel.assets : [];
      release_download_count = assets.reduce((s, a) => s + (Number(a.download_count) || 0), 0);
    }
  } catch {
    /* public API; empty is fine */
  }
  const out = { stars, forks, watchers, release_download_count, fetched_at: Date.now() };
  try {
    await env.DOWNLOADS.put(githubCacheKey(), JSON.stringify(out));
  } catch {
    /* ignore */
  }
  return out;
}

function installScript() {
  return `#!/usr/bin/env bash
# Whitestone optional software zip. Counted download via this Worker.
# The live app is https://whitestone.vibelock.workers.dev/ — zip is optional.
set -euo pipefail
HOST="${HOST}"
ASSET="${DEFAULT_ASSET}"
WORKDIR="\${WHITESTONE_HOME:-\$HOME/whitestone}"
mkdir -p "\$WORKDIR"
cd "\$WORKDIR"
echo "Downloading counted zip from \${HOST}/download (User-Agent Mozilla/5.0)…"
curl -fsSL -A 'Mozilla/5.0' "\${HOST}/download?asset=\${ASSET}" -o "\${ASSET}"
unzip -o "\${ASSET}"
DIR="\$(find . -maxdepth 1 -type d -name 'whitestone' | head -n 1)"
if [ -n "\${DIR}" ]; then
  cd "\${DIR}"
fi
echo
echo "Unzipped Whitestone (optional offline copy)."
echo "Serve this folder:  npx --yes serve .   or   python3 -m http.server 4173"
echo "The live product is ${APP_WORKER}"
echo "Author: Aziel Eliab."
`;
}

function contentTypeFor(asset) {
  const name = String(asset || "").toLowerCase();
  if (name.endsWith(".zip")) return "application/zip";
  if (name.endsWith(".tar.gz") || name.endsWith(".gz")) return "application/gzip";
  return "application/octet-stream";
}

async function serveAsset(request, env, asset, { head = false } = {}) {
  let assetRes = null;
  if (env.ASSETS) {
    const assetUrl = new URL("/" + asset, request.url);
    assetRes = await env.ASSETS.fetch(new Request(assetUrl, { method: "GET" }));
  }
  if (!assetRes || !assetRes.ok) {
    const dest = githubAssetUrl(DEFAULT_OWNER, DEFAULT_REPO, "latest", asset);
    assetRes = await fetch(dest, { headers: { "User-Agent": "Mozilla/5.0" } });
  }
  if (!assetRes || !assetRes.ok) {
    return json({ error: "asset not hosted", asset, status: assetRes ? assetRes.status : 0 }, 404);
  }
  const headers = new Headers();
  headers.set("Content-Type", contentTypeFor(asset));
  headers.set("Content-Disposition", 'attachment; filename="' + asset.replaceAll('"', "") + '"');
  headers.set("Cache-Control", "private, no-store");
  const len = assetRes.headers.get("Content-Length");
  if (len) headers.set("Content-Length", len);
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  if (head) {
    return new Response(null, { status: 200, headers });
  }
  return new Response(assetRes.body, { status: 200, headers });
}

async function indexHtml(env) {
  const stats = await collectStats(env);
  const downloads = Number(stats.downloads != null ? stats.downloads : stats.total) || 0;
  const views = parseInt((await env.DOWNLOADS.get(viewsKey())) || "0", 10) || 0;
  const v = views.toLocaleString("en-US");
  const n = downloads.toLocaleString("en-US");
  const breakdown = (stats.breakdown || [])
    .map(
      (b) =>
        `<li><code>${b.owner}/${b.repo}</code> branch <code>${b.branch}</code> fork=${b.fork} → ${b.count}</li>`,
    )
    .join("") || "<li>none yet</li>";
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Whitestone — Aziel Eliab</title>
<meta name="description" content="Whitestone by Aziel Eliab is one ephemeral pro se advisor for Criminal, Civil, and Divorce. Educational procedural guidance. Optional software zip.">
<meta name="author" content="Aziel Eliab">
<link rel="canonical" href="${HOST}/">
<link rel="icon" href="/sigil.png" type="image/png">
<meta property="og:title" content="Whitestone — Aziel Eliab">
<meta property="og:description" content="One ephemeral pro se advisor by Aziel Eliab for Criminal, Civil, and Divorce. Optional software zip.">
<meta property="og:url" content="${HOST}/">
<meta property="og:image" content="${HOST}/sigil.png">
<meta property="og:image:alt" content="Aziel Eliab rose-star brand mark. Author Aziel Eliab.">
<meta name="twitter:image" content="${HOST}/sigil.png">
<meta name="twitter:image:alt" content="Aziel Eliab rose-star brand mark. Author Aziel Eliab.">
<meta property="og:type" content="website">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Whitestone",
  "author": { "@type": "Person", "name": "Aziel Eliab" },
  "codeRepository": "${GITHUB_REPO}",
  "downloadUrl": "${HOST}/download",
  "license": "https://www.apache.org/licenses/LICENSE-2.0",
  "url": "${HOST}/",
  "description": "One ephemeral pro se advisor by Aziel Eliab for Criminal, Civil, and Divorce."
}
</script>
<style>
  :root { color-scheme: light; --bg:#f4efe6; --paper:#fffdf8; --ink:#241f1a; --muted:#5d564d; --line:#d8cfc0; --accent:#4f6f5a; --gold:#c9a227; }
  body { font: 16px/1.45 "Segoe UI", system-ui, sans-serif; max-width: 42rem; margin: 3rem auto; padding: 0 1.25rem 4rem; background: var(--bg); color: var(--ink); }
  .brandrow { display: flex; align-items: center; justify-content: flex-start; gap: 12px; margin: 0 0 1.15rem; }
  .brandmark { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; flex: 0 0 auto; box-shadow: 0 0 0 1px #d4af3733; }
  h1 { font-family: Palatino, Georgia, serif; font-size: 1.75rem; margin: 0 0 .35rem; }
  .motto { color: var(--muted); margin: 0 0 1.5rem; }
  .card { border: 1px solid var(--line); border-radius: 12px; padding: 1.25rem 1.35rem; background: var(--paper); }
  .nums { display: grid; grid-template-columns: 1fr 1fr; gap: .8rem; margin: 0 0 1rem; }
  .count { font-size: 2.2rem; font-variant-numeric: tabular-nums; font-weight: 700; margin: 0; }
  .count span { display: block; font-size: .95rem; font-weight: 500; color: var(--muted); }
  .kid { font-size: 1.05rem; margin: 0 0 1rem; }
  .btns { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin: 0 0 .85rem; }
  @media (max-width: 520px) { .btns { grid-template-columns: 1fr; } }
  a.btn, button.btn { display: block; width: 100%; box-sizing: border-box; text-align: center; font: inherit; font-size: 1.2rem; font-weight: 750; padding: 1rem 1.1rem; border-radius: 10px; border: 0; cursor: pointer; text-decoration: none; }
  a.btn.primary { background: var(--accent); color: #f4efe6; }
  a.btn.live { background: #241f1a; color: #f4efe6; }
  button.btn.install { background: var(--gold); color: #14110a; }
  button.btn.install.copied { background: #7dcf9a; color: #0e1014; }
  .meta { margin-top: 1.1rem; color: var(--muted); font-size: .92rem; }
  .meta a { color: #2f5d8c; }
  .iso { margin-top: .85rem; font-size: .85rem; color: #7d8696; }
  .banner { border: 1px solid #c4a27a; background: #f8efe4; color: #8a4b2f; padding: .85rem 1rem; border-radius: 8px; margin: 0 0 1.2rem; font-size: .92rem; }
  pre { background: #efe7da; padding: .75rem .9rem; overflow: auto; border-radius: 8px; font-size: .82rem; }
  code { font-size: .88rem; }
  .cite { margin-top: 1.4rem; padding-top: 1rem; border-top: 1px solid var(--line); }
  .cite h2 { font-size: 1.05rem; margin: 0 0 .4rem; }
  .cite p { color: #3a342c; font-size: .95rem; }
  .cite a { color: #2f5d8c; }
  #meshStrip { border: 1px solid var(--gold); border-radius: 12px; padding: .85rem 1rem; background: var(--paper); margin: 0 0 1.1rem; display: flex; flex-wrap: wrap; align-items: center; gap: .7rem 1rem; font-size: .88rem; color: var(--muted); }
  #meshStrip .live { color: var(--ink); }
  #meshStrip .live b { color: var(--gold); font-size: 1.35rem; margin-right: .35rem; }
  #meshStrip .rollup b { color: var(--gold); }
  #meshStrip button { font: 700 .78rem/1 ui-monospace, Menlo, Consolas, monospace; height: 2rem; padding: 0 .75rem; border-radius: 8px; background: #241f1a; color: #efe7da; border: 1px solid var(--gold); cursor: pointer; }
  #meshStrip button:hover { background: #3a2f14; color: var(--gold); }
  #meshStrip input { width: 10rem; padding: .4rem .55rem; border: 1px solid var(--gold); border-radius: 8px; background: #fffdf8; color: var(--ink); font: inherit; }
  #meshProducts { flex-basis: 100%; margin: 0; }
</style>
<body>
  <div class="brandrow"><img class="brandmark" src="/sigil.png" width="40" height="40" alt="" decoding="async"></div>
  <h1>Whitestone</h1>
  <p class="motto">Ephemeral pro se advisor. Criminal, Civil, Divorce. Author Aziel Eliab.</p>
  <p class="banner">One ephemeral pro se advisor for Criminal, Civil, and Divorce. Educational procedural software. Session-only memory. Uploads only. The live app is the product — this page counts the optional zip.</p>
  <aside id="meshStrip" aria-label="Live Nodes">
    <span class="live"><b id="meshLiveCount">0</b> Live Nodes</span>
    <span id="meshLine">Suite mesh: off (default). QNM-BUILD-1.0. QNS-CD-1.0. Not an anonymity network.</span>
    <span class="rollup">live <b id="qnmLive">0</b> · locked <b id="qnmLocked">0</b> · isolated <b id="qnmIsolated">0</b></span>
    <span>No Node Gate · No auto-heal · Aziel Eliab only</span>
    <span>
      <input id="meshBearer" type="text" placeholder="bearer (required to enable)" autocomplete="off" spellcheck="false">
      <button type="button" id="meshEnable">Enable</button>
      <button type="button" id="meshDisable">Disable</button>
      <button type="button" id="meshJoin">Join</button>
      <button type="button" id="meshLeave">Leave</button>
    </span>
    <p id="meshProducts">Catalog MCP mesh_* · FragGate slug=mesh · /v1/mesh/* PROXY · QNS-CD-1.0 cite · not AnonBroadcast · not AZMail ring · not a Node Gate · no public qnsd proxy</p>
  </aside>
  <div class="card">
    <div class="nums">
      <p class="count">${v}<span>Views</span></p>
      <p class="count">${n}<span>Downloads</span></p>
    </div>
    <p class="kid"><strong>Two big buttons.</strong> Download saves the zip (the Downloads number goes up). Open live app uses the hosted product without installing.</p>
    <div class="btns">
      <a class="btn primary dl" href="/download?asset=${DEFAULT_ASSET}">Download</a>
      <a class="btn live" href="${APP_WORKER}/">Open live app</a>
    </div>
    <p class="kid">Optional unzip helper (copies a Terminal command). After it finishes, serve the <code>whitestone/</code> folder.</p>
    <div class="btns">
      <button type="button" class="btn install" id="install-btn">Copy unzip command</button>
    </div>
    <pre id="install-cmd">${INSTALL_LINE}</pre>
    <p class="meta">The download count ticks on the Download click. The Worker serves the zip (HTTP 200). No 302 to GitHub. Forks using this same link are counted automatically. ${DEFAULT_ASSET} — ${n} counted.</p>
    <p class="iso">Isolated counter: Worker <code>whitestone-download-tracker</code>, project <code>whitestone</code>, KV <code>WHITESTONE_DOWNLOADS</code>. Not mixed with any other product. /v1, /mcp, and /v1/mesh/* do not increment downloads. The app Worker at ${APP_WORKER} is unchanged.</p>
    <p class="meta">Apache-2.0 · Aziel Eliab</p>
    <p class="meta"><a href="/stats">JSON stats</a> · <a href="/count">/count</a> · <a href="/openapi.json">OpenAPI</a> · <a href="/mcp">MCP</a> · <a href="/v1/mesh">/v1/mesh</a> · <a href="/v1/skill">Skill</a> · <a href="/ai">AI runtime</a> · <a href="${GITHUB_REPO}">GitHub</a> · <a href="${GITHUB_LATEST}">releases</a> · <a href="${APP_WORKER}/">live app</a></p>
    <script>
      (function () {
        var cmd = ${JSON.stringify(INSTALL_LINE)};
        var btn = document.getElementById("install-btn");
        var pre = document.getElementById("install-cmd");
        if (!btn) return;
        btn.addEventListener("click", function () {
          function done(ok) {
            btn.textContent = ok ? "Copied! Paste in Terminal" : "Select the command and copy it";
            btn.classList.add("copied");
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(cmd).then(function () { done(true); }).catch(function () { done(false); });
          } else {
            done(false);
            if (pre && window.getSelection) {
              var r = document.createRange();
              r.selectNodeContents(pre);
              var sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(r);
            }
          }
        });
      })();
      (function () {
        function $(id) { return document.getElementById(id); }
        function meshNum() {
          for (var i = 0; i < arguments.length; i++) {
            var raw = arguments[i];
            if (raw == null || raw === "") continue;
            var n = typeof raw === "number" ? raw : Number(String(raw).replace(/,/g, ""));
            if (Number.isFinite(n) && n >= 0) return Math.floor(n);
          }
          return 0;
        }
        function unwrapMesh(j) {
          if (!j || typeof j !== "object") return {};
          if (j.result && typeof j.result === "object") return Object.assign({}, j, j.result);
          if (j.mesh && typeof j.mesh === "object") return Object.assign({}, j, j.mesh);
          return j;
        }
        function paintMesh(raw) {
          var j = unwrapMesh(raw);
          var on = j.enabled === true || j.enabled === 1 || String(j.status || "").toLowerCase() === "on";
          var r = (j.rollup && typeof j.rollup === "object") ? j.rollup : {};
          var live = on ? meshNum(r.live, j.live_nodes, j.live) : 0;
          var locked = on ? meshNum(r.locked, j.locked_nodes, j.locked) : 0;
          var isolated = on ? meshNum(r.isolated, j.isolated_nodes, j.isolated) : 0;
          if ($("meshLiveCount")) $("meshLiveCount").textContent = String(live);
          if ($("qnmLive")) $("qnmLive").textContent = String(live);
          if ($("qnmLocked")) $("qnmLocked").textContent = String(locked);
          if ($("qnmIsolated")) $("qnmIsolated").textContent = String(isolated);
          var line = $("meshLine");
          if (line) {
            if (on) line.textContent = "Suite mesh: on · live " + live + " · locked " + locked + " · isolated " + isolated + ". QNS-CD-1.0. Not an anonymity network.";
            else if (j.status === "unavailable" || (j.ok === false && j.error)) line.textContent = "Suite mesh: off (unavailable). QNM-BUILD-1.0. QNS-CD-1.0. Not an anonymity network.";
            else line.textContent = "Suite mesh: off (default). QNM-BUILD-1.0. QNS-CD-1.0. Not an anonymity network.";
          }
          var products = j.products_present || j.products || [];
          var names = Array.isArray(products) ? products.map(function (p) { return typeof p === "string" ? p : (p && (p.product || p.slug)) || ""; }).filter(Boolean) : [];
          var nodes = Array.isArray(j.nodes) ? j.nodes : [];
          var extra = names.length ? " · products " + names.join(", ") : (nodes.length ? " · " + nodes.length + " node labels" : "");
          if ($("meshProducts")) $("meshProducts").textContent = "Catalog MCP mesh_* · FragGate slug=mesh · /v1/mesh/* PROXY · QNS-CD-1.0 cite · not AnonBroadcast · not AZMail ring · not a Node Gate · no public qnsd proxy" + extra;
        }
        async function meshGet(path) {
          var r = await fetch(path, { headers: { "user-agent": "Mozilla/5.0", accept: "application/json" } });
          return r.json();
        }
        async function meshPost(path, payload) {
          var r = await fetch(path, { method: "POST", headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" }, body: JSON.stringify(payload || {}) });
          return r.json();
        }
        async function refreshMesh() {
          try {
            var status = await meshGet("/v1/mesh");
            var merged = status;
            var inner = unwrapMesh(status);
            var on = inner.enabled === true;
            if (on) {
              try {
                var nodes = await meshGet("/v1/mesh/nodes");
                merged = Object.assign({}, inner, unwrapMesh(nodes));
              } catch (e) { /* status is enough */ }
            }
            paintMesh(merged);
            var nodeId = sessionStorage.getItem("whitestone_mesh_node");
            if (on && nodeId) {
              try { await meshPost("/v1/mesh/heartbeat", { node_id: nodeId }); } catch (e) { /* no auto-heal */ }
            }
          } catch (e) {
            paintMesh({ ok: false, enabled: false, status: "unavailable", error: "mesh_unavailable" });
          }
        }
        if ($("meshEnable")) $("meshEnable").onclick = async function () {
          var bearer = ($("meshBearer") && $("meshBearer").value || "").trim();
          paintMesh(await meshPost("/v1/mesh/enable", bearer ? { bearer: bearer } : {}));
          refreshMesh();
        };
        if ($("meshDisable")) $("meshDisable").onclick = async function () {
          sessionStorage.removeItem("whitestone_mesh_node");
          paintMesh(await meshPost("/v1/mesh/disable", {}));
          refreshMesh();
        };
        if ($("meshJoin")) $("meshJoin").onclick = async function () {
          var j = await meshPost("/v1/mesh/join", { product: "whitestone", label: "Whitestone Worker" });
          var inner = unwrapMesh(j);
          var id = inner.node_id || inner.id || (inner.session && inner.session.node_id);
          if (id) sessionStorage.setItem("whitestone_mesh_node", String(id));
          paintMesh(j);
          refreshMesh();
        };
        if ($("meshLeave")) $("meshLeave").onclick = async function () {
          var id = sessionStorage.getItem("whitestone_mesh_node");
          if (id) await meshPost("/v1/mesh/leave", { node_id: id });
          sessionStorage.removeItem("whitestone_mesh_node");
          refreshMesh();
        };
        window.addEventListener("pagehide", function () {
          var id = sessionStorage.getItem("whitestone_mesh_node");
          if (!id || typeof navigator.sendBeacon !== "function") return;
          try { navigator.sendBeacon("/v1/mesh/leave", new Blob([JSON.stringify({ node_id: id })], { type: "application/json" })); } catch (e) { /* leave expires in 5 minutes */ }
        });
        refreshMesh();
        setInterval(refreshMesh, 30000);
        document.addEventListener("visibilitychange", function () { if (!document.hidden) refreshMesh(); });
      })();
    </script>
    <h2>Per repo / branch / fork</h2>
    <ul>${breakdown}</ul>
  </div>

<section class="cite" id="cite">
  <h2>How to cite</h2>
  <p>Aziel Eliab. Whitestone. ${GITHUB_REPO}. ${HOST}. ${APP_WORKER}.</p>
  <p><a href="https://aziel-runtime.vibelock.workers.dev/">Catalog</a> · <a href="${GITHUB_REPO}">GitHub</a> · <a href="${HOST}/download">Download</a> · <a href="${HOST}/cite.json">cite.json</a> · <a href="${APP_WORKER}/">live app</a></p>
</section>
</body>
</html>`;
}

function html(body) {
  return new Response(body, {
    headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
  });
}

function originOf(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return HOST;
  }
}

function openapiSpec(request) {
  const origin = originOf(request);
  return {
    openapi: "3.1.0",
    info: {
      title: "Whitestone runtime",
      version: "1.6.0",
      summary: "Ephemeral pro se advisor download tracker. Hosted API is educational procedural software.",
      description: engine.LIMITATION + " Suite mesh /v1/mesh/* PROXY to aziel-runtime (AZIEL_RUNTIME). Default OFF. QNM-BUILD-1.0 live|locked|isolated. No Node Gate. No auto-heal. Aziel Eliab only.",
    },
    servers: [{ url: origin }],
    paths: {
      "/v1/example": { get: { operationId: "whitestoneExample", summary: "Sample JSON payload. Does not increment downloads.", responses: { "200": { description: "OK" } } } },
      "/v1/health": { get: { operationId: "whitestone_health", summary: "Liveness. Does not increment download KV. Never stores case files.", responses: { "200": { description: "ok" } } } },
      "/v1/skill": { get: { operationId: "whitestone_skill", summary: "Live skill markdown. Does not increment downloads.", responses: { "200": { description: "markdown" } } } },
      ...meshOpenApiPaths(),
    },
  };
}

function aiHelpPage(request) {
  const origin = originOf(request);
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Whitestone — AI runtime</title>
<style>
  :root { color-scheme: light; }
  body { font: 16px/1.45 system-ui, sans-serif; max-width: 44rem; margin: 3rem auto; padding: 0 1.25rem; background: #f4efe6; color: #241f1a; }
  .brandrow { display: flex; align-items: center; justify-content: flex-start; gap: 12px; margin: 0 0 1.15rem; }
  .brandmark { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; flex: 0 0 auto; box-shadow: 0 0 0 1px #d4af3733; }
  a { color: #2f5d8c; }
  code, pre { background: #fffdf8; padding: .15rem .35rem; border-radius: 4px; }
  pre { padding: .85rem 1rem; overflow: auto; }
  .banner { border: 1px solid #c4a27a; background: #f8efe4; color: #8a4b2f; padding: .85rem 1rem; border-radius: 8px; }
</style>
<body>
<div class="brandrow"><img class="brandmark" src="/sigil.png" width="40" height="40" alt="" decoding="async"></div>
<h1>Whitestone runtime</h1>
<p class="banner">${engine.LIMITATION}</p>
<h2>Use with AI assistants</h2>
<p>Works with ChatGPT (GPT Actions / OpenAI), Grok (xAI), Venice, Claude (Anthropic), Cursor (MCP), Glama (MCP), Perplexity, Microsoft Copilot / Bing, Google Gemini / Vertex, Mistral, Meta AI, Apple Intelligence surfaces, Amazon Q tooling, DuckAssist, You.com, Cohere, and other MCP/OpenAPI-capable assistants.</p>
<p>Import the catalog or Worker OpenAPI as a custom tool, as a GPT Action in ChatGPT (no auth), or as HTTP tools. Cursor and Glama: connect the catalog MCP. Always send <code>User-Agent: Mozilla/5.0</code>.</p>
<p>OpenAPI: <a href="${origin}/openapi.json">${origin}/openapi.json</a></p>
<p>Live app: <a href="${APP_WORKER}/">${APP_WORKER}</a></p>
<p>Catalog: <a href="https://aziel-runtime.vibelock.workers.dev/">aziel-runtime.vibelock.workers.dev</a></p>
<pre>curl ${origin}/v1/health
curl ${origin}/v1/skill
curl ${origin}/v1/mesh
</pre>
<p>Suite mesh: GET <a href="${origin}/v1/mesh">${origin}/v1/mesh</a> PROXY to aziel-runtime. Default OFF. QNM-BUILD-1.0 live|locked|isolated. QNS-CD-1.0 photon QNS1 packet transfer (hub cite / Worker mesh cross-map only; no public qnsd proxy). No Node Gate. No auto-heal. Catalog MCP mesh_* + FragGate slug=mesh. Author: Aziel Eliab only.</p>
<p>GET/POST under <code>/v1</code> never increment the download counter. There is no case-file store and no FragGate engine on this Worker.</p>
<p><a href="/">Downloads</a></p>
</body></html>`;
}

export async function handleRuntime(request, url, env) {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (isMeshPath(path) || path === "/v1/mesh") {
    const out = await runMeshProxy(env, request, path + (url.search || ""));
    if (request.method === "HEAD") {
      return new Response(null, { status: out.status, headers: corsHeaders() });
    }
    return json(out.data, out.status);
  }
  if (path === "/v1/health" && request.method === "GET") {
    return json({
      ...engine.health(),
      mesh: meshPointer(),
    });
  }
  if ((path === "/v1/example" || path === "/v1/example/") && (request.method === "GET" || request.method === "HEAD")) {
    return json({
      ok: true,
      product: "whitestone",
      author: "Aziel Eliab",
      example: EXAMPLE_PAYLOAD,
      note: "Sample payload only. Does not increment downloads.",
    });
  }

  if (path === "/v1/skill" && request.method === "GET") {
    return new Response(SKILL_MARKDOWN, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-KV-Increment": "false",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if ((path === "/mcp" || path === "/mcp/") && (request.method === "GET" || request.method === "HEAD")) {
    const body = {
      ok: true,
      product: "whitestone",
      author: "Aziel Eliab",
      identity: "Aziel Eliab",
      catalog_mcp: "https://aziel-runtime.vibelock.workers.dev/mcp",
      catalog_openapi: "https://aziel-runtime.vibelock.workers.dev/openapi.json",
      worker_openapi: originOf(request) + "/openapi.json",
      fraggate_engine: false,
      catalog_placement: "whitestone",
      app_worker: APP_WORKER + "/",
      mesh: meshPointer(),
      mesh_body: { slug: "mesh", op: "status", payload: {} },
      kv_increment: false,
      note: "Dual surface: human Worker UI and this MCP pointer. Whitestone is a catalog placement. Do not invent door ops. Canonical agent path is the catalog MCP on aziel-runtime. Catalog MCP mesh_* + FragGate slug=mesh. This Worker /v1/mesh/* PROXY to aziel-runtime via AZIEL_RUNTIME. Suite mesh default OFF. QNM rollup live|locked|isolated. QNS-CD-1.0 photon QNS1 packet transfer (hub cite / Worker mesh cross-map only; no public qnsd proxy). No Node Gate. No auto-heal.",
    };
    if (request.method === "HEAD") return new Response(null, { status: 200, headers: corsHeaders() });
    return json(body);
  }
  if (path === "/openapi.json" && request.method === "GET") {
    return json(openapiSpec(request));
  }
  if ((path === "/ai" || url.pathname === "/ai/") && request.method === "GET") {
    return html(aiHelpPage(request));
  }
  if (path.startsWith("/v1/") || path === "/v1") {
    return json({ error: "not found", hint: "GET /v1/health /v1/skill GET /v1/mesh", mesh: meshPointer(), limitation: engine.LIMITATION }, 404);
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const runtime = await handleRuntime(request, url, env);
    if (runtime) return runtime;

    if ((url.pathname === "/install.sh" || url.pathname === "/install.sh/") && request.method === "GET") {
      return new Response(installScript(), {
        status: 200,
        headers: {
          "Content-Type": "text/x-shellscript; charset=utf-8",
          "Cache-Control": "private, no-store",
          ...corsHeaders(),
        },
      });
    }

    if (url.pathname === "/" && request.method === "GET") {
      await incrementViews(env, request);
      return new Response(await indexHtml(env), {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
      });
    }

    if ((url.pathname === "/count" || url.pathname === "/count/") && request.method === "GET") {
      const stats = await collectStats(env, request);
      return json(shapeCountBody({
        project: PROJECT,
        views: stats.views,
        downloads: stats.downloads,
        total: stats.total,
        views_human: stats.views_human,
        downloads_human: stats.downloads_human,
        botManagementAvailable: readBotManagement(request).available,
      }));
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      return json(await collectStats(env, request));
    }

    if (url.pathname === "/event" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "JSON body required" }, 400);
      }
      const dims = parseDims(body || {});
      const count = await increment(env, dims, request);
      return json({
        ok: true,
        key: kvKey(dims),
        count,
        owner: dims.owner,
        repo: dims.repo,
        branch: dims.branch,
        fork: dims.fork,
        asset: dims.asset || null,
      });
    }

    if (url.pathname === "/go" && (request.method === "GET" || request.method === "HEAD")) {
      const dims = parseDims(url.searchParams);
      const asset = dims.asset || DEFAULT_ASSET;
      dims.asset = asset;
      if (request.method === "GET") await increment(env, dims, request);
      return serveAsset(request, env, asset, { head: request.method === "HEAD" });
    }

    if ((url.pathname === "/download" || url.pathname.startsWith("/download/")) && (request.method === "GET" || request.method === "HEAD")) {
      const dims = parseDims(url.searchParams);
      if (!dims.asset && url.pathname.startsWith("/download/")) {
        dims.asset = decodeURIComponent(url.pathname.slice("/download/".length));
      }
      const asset = dims.asset || DEFAULT_ASSET;
      dims.asset = asset;
      if (request.method === "GET") await increment(env, dims, request);
      return serveAsset(request, env, asset, { head: request.method === "HEAD" });
    }

    if ((url.pathname === "/robots.txt" || url.pathname === "/robots.txt/") && request.method === "GET") {
      const body = "User-agent: *\nAllow: /\nSitemap: " + HOST + "/sitemap.xml\n";
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() },
      });
    }
    if ((url.pathname === "/sitemap.xml" || url.pathname === "/sitemap.xml/") && request.method === "GET") {
      const locs = [HOST + "/", HOST + "/download", HOST + "/install.sh", HOST + "/v1/skill", HOST + "/v1/mesh", HOST + "/openapi.json", HOST + "/mcp", GITHUB_REPO, APP_WORKER + "/"];
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + locs.map((u) => "  <url><loc>" + u + "</loc></url>").join("\n")
        + "\n</urlset>\n";
      return new Response(xml, {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8", ...corsHeaders() },
      });
    }
    if ((url.pathname === "/cite.json" || url.pathname === "/cite.json/") && request.method === "GET") {
      return json({
        author: "Aziel Eliab",
        identity: "Aziel Eliab only",
        title: "Whitestone",
        github: GITHUB_REPO,
        download: HOST + "/download",
        live_app: APP_WORKER + "/",
        license: "Apache-2.0",
        catalog: "https://aziel-runtime.vibelock.workers.dev/",
        mesh: HOST + "/v1/mesh",
        mesh_catalog: "https://aziel-runtime.vibelock.workers.dev/v1/mesh",
        fraggate_engine: false,
      });
    }
    if ((url.pathname === "/llms.txt" || url.pathname === "/llms.txt/") && request.method === "GET") {
      const body = [
        "Whitestone — Aziel Eliab",
        "One ephemeral pro se advisor for Criminal, Civil, and Divorce.",
        "Live app: " + APP_WORKER + "/",
        "Counted zip: " + HOST + "/download",
        "Stats: " + HOST + "/stats",
        "Count: " + HOST + "/count",
        "OpenAPI: " + HOST + "/openapi.json",
        "Mesh PROXY: " + HOST + "/v1/mesh (default OFF)",
        "Catalog placement. Standalone software.",
        "",
      ].join("\n");
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders() },
      });
    }
    return json({ error: "not found" }, 404);
  },
};
