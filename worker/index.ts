import { handleResearch } from "./research";

export interface Env {
  ASSETS: Fetcher;
  COUNTERS: DurableObjectNamespace;
  RELEASE_ASSET_URL?: string;
}

const DEFAULT_RELEASE =
  "https://github.com/AzielEliab/Whitestone/releases/latest/download/whitestone-standalone.zip";

const SOFTWARE = {
  name: "Whitestone",
  slug: "whitestone",
  version: "1.6.0",
  author: "Aziel Eliab",
  identity: "Aziel Eliab",
  author_id: "https://www.azieleliab.com/#aziel",
  one_line:
    "One ephemeral pro se advisor with Criminal, Civil, and Divorce practice areas, plus optional historical as-of and anti-corruption honesty evaluation. Live Worker URL on phone or desktop — zip optional. Session-only memory; wipe on close. Uploads only, no case exports, no third-party LLM APIs. Ported CLCE/SPRE/PhysLing/triad/ZionPattern labeled scores. Hosted app may fetch allowlisted public court/legal-aid pages for this session only.",
  kind: "software",
  door: "standalone",
  github: "https://github.com/AzielEliab/Whitestone",
  download_url: DEFAULT_RELEASE,
  license: "Apache-2.0",
  coverage: "procedural-overview + checklists for 50 states and D.C.",
  lens: ["Service", "Clarity", "Peace"],
};

export class CounterDO {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get("k") === "download" ? "download" : "view";
    const increment = url.searchParams.get("inc") !== "0";
    let n = (await this.ctx.storage.get<number>(key)) ?? 0;
    if (increment) {
      n += 1;
      await this.ctx.storage.put(key, n);
    }
    return Response.json({ key, n });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/count/view" || path === "/count/download") {
      const key = path.endsWith("download") ? "download" : "view";
      const count = await bump(env, key, url.searchParams.get("inc") !== "0");
      if (url.searchParams.get("format") === "json") {
        return json({ key, count, name: "Whitestone" });
      }
      return badge(key === "view" ? "views" : "downloads", String(count));
    }

    if (path === "/download") {
      await bump(env, "download", true);
      const dest = env.RELEASE_ASSET_URL || DEFAULT_RELEASE;
      return Response.redirect(dest, 302);
    }

    if (path === "/v1/health") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return json({ ok: false, error: "method-not-allowed" }, 405);
      }
      // Honest liveness before SPA ASSETS catch-all. Product truth only (NO-LIE).
      const body = {
        ok: true,
        author: SOFTWARE.author,
        identity: SOFTWARE.identity,
        product: SOFTWARE.slug,
        version: SOFTWARE.version,
        confidence_cap: 0.75,
        lawyer: false,
        legal_advice: false,
        stores_cases: false,
        stores_uploads: false,
        fraggate_engine: false,
        limitation:
          "Whitestone is one ephemeral pro se advisor for Criminal, Civil, and Divorce. Educational procedural software — not a lawyer, not legal advice. Session-only memory; End & erase wipes the session. Uploads only in-browser; this Worker never stores case files. Case Mode confidence hard-capped at 0.75. TrajectoryLock-lite: labeled geometric-line fit from session text/layers; GET peer /v1/health only — does not POST media, name a shooter, or claim LIVE physics. Author: Aziel Eliab only.",
      };
      if (request.method === "HEAD") {
        return new Response(null, {
          status: 200,
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            "access-control-allow-origin": "*",
          },
        });
      }
      return json(body);
    }

    if (path === "/v1/software") {
      return json({
        ok: true,
        author: SOFTWARE.author,
        identity: SOFTWARE.identity,
        version: SOFTWARE.version,
        framing: "Standalone human UI. No MCP LLM backdoor. No third-party LLM glue.",
        count: 1,
        software: [
          {
            ...SOFTWARE,
            worker_home: url.origin + "/",
            download_url: url.origin + "/download",
            catalog: url.origin + "/catalog.json",
            download_required: false,
            sha256_tip: "see GitHub Release asset digest when published",
          },
        ],
      });
    }

    if (path === "/api/research" || path === "/api/research/allowlist") {
      return handleResearch(request);
    }

    if (path === "/sw.js") {
      const res = await env.ASSETS.fetch(request);
      const headers = new Headers(res.headers);
      headers.set("content-type", "text/javascript; charset=utf-8");
      headers.set("cache-control", "no-cache");
      headers.set("service-worker-allowed", "/");
      return new Response(res.body, { status: res.status, headers });
    }

    if (path === "/manifest.webmanifest") {
      const res = await env.ASSETS.fetch(request);
      const headers = new Headers(res.headers);
      headers.set("content-type", "application/manifest+json; charset=utf-8");
      return new Response(res.body, { status: res.status, headers });
    }

    if (path === "/robots.txt" || path === "/sitemap.xml" || path === "/catalog.json") {
      return env.ASSETS.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

async function bump(env: Env, key: string, increment: boolean): Promise<number> {
  const id = env.COUNTERS.idFromName("whitestone");
  const stub = env.COUNTERS.get(id);
  const res = await stub.fetch(`https://counters/internal?k=${key}&inc=${increment ? "1" : "0"}`);
  const data = (await res.json()) as { n: number };
  return data.n;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}

function badge(label: string, value: string): Response {
  const l = escapeXml(label);
  const v = escapeXml(value);
  const lw = 58;
  const vw = 12 + v.length * 7;
  const w = lw + vw;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${l}: ${v}">
  <title>${l}: ${v}</title>
  <rect width="${lw}" height="20" fill="#241f1a"/>
  <rect x="${lw}" width="${vw}" height="20" fill="#4f6f5a"/>
  <rect width="${w}" height="20" fill="none" stroke="#d8cfc0"/>
  <text x="8" y="14" fill="#efe7da" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">${l}</text>
  <text x="${lw + 6}" y="14" fill="#f4efe6" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">${v}</text>
</svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "no-cache",
      "access-control-allow-origin": "*",
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}
