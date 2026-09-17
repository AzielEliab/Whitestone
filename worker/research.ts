import { classifyUrl, describeAllowlist, isAllowedUrl } from "../src/research/allowlist";
import { extractMainText, titleFromUrl } from "../src/research/extract";
import { selectSeeds } from "../src/research/seeds";
import { parseResearchInput, shouldFetch } from "../src/research/should-fetch";
import {
  MAX_EXCERPT_CHARS,
  RESEARCH_CAPABILITY,
  type ResearchResult,
  type WebSource,
} from "../src/research/types";

const PAGE_CAP = 350_000;
const BODY_CAP = 8_192;
const FETCH_MS = 8_000;
const CACHE_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 8;
const UA =
  "WhitestoneResearch/1.2 (+https://github.com/AzielEliab/Whitestone; allowlisted public court/legal-aid pages)";

const rateHits = new Map<string, number[]>();
const memoryCache = new Map<string, { at: number; source: WebSource }>();

function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
}

function allowRate(ip: string, now: number): boolean {
  const prior = (rateHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prior.length >= RATE_MAX) {
    rateHits.set(ip, prior);
    return false;
  }
  prior.push(now);
  rateHits.set(ip, prior);
  return true;
}

function capability(): ResearchResult & {
  version: string;
  ephemeral: true;
  third_party_llm: false;
  allowlist: ReturnType<typeof describeAllowlist>;
  coverage: string;
} {
  return {
    ok: true,
    capability: RESEARCH_CAPABILITY,
    sources: [],
    notes:
      "Deterministic retrieve → cite → structure. No third-party LLM. Fetched text is cached by URL for a short TTL only.",
    unavailable: false,
    failed: [],
    fetched: 0,
    cached: 0,
    version: "1.2.0",
    ephemeral: true,
    third_party_llm: false,
    allowlist: describeAllowlist(),
    coverage: "Not a complete statute book. Prefer the clerk packet.",
  };
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    return text.slice(0, max);
  }
  const dec = new TextDecoder();
  let out = "";
  let n = 0;
  while (n < max) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.byteLength;
    out += dec.decode(value, { stream: true });
  }
  try {
    await reader.cancel();
  } catch {
    /* ignore */
  }
  return out.slice(0, max);
}

function cacheGet(url: string, now: number): WebSource | null {
  const hit = memoryCache.get(url);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.source;
  if (hit) memoryCache.delete(url);
  return null;
}

function cacheSet(url: string, source: WebSource, now: number): void {
  memoryCache.set(url, { at: now, source });
}

async function fetchSeed(url: string, titleHint: string, now: number): Promise<
  { source: WebSource; cached: boolean } | { error: string }
> {
  if (!isAllowedUrl(url)) return { error: "blocked" };
  const cached = cacheGet(url, now);
  if (cached) return { source: cached, cached: true };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/xhtml+xml,text/plain,application/pdf;q=0.2",
      },
    });
    const finalUrl = res.url || url;
    if (!isAllowedUrl(finalUrl)) return { error: "redirect-blocked" };
    if (!res.ok) return { error: `http-${res.status}` };

    const match = classifyUrl(finalUrl);
    if (!match) return { error: "blocked" };
    const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
    const retrievedAt = new Date(now).toISOString();

    if (ctype.includes("pdf") || finalUrl.toLowerCase().endsWith(".pdf")) {
      const source: WebSource = {
        title: titleHint || titleFromUrl(finalUrl),
        url: finalUrl,
        excerpt: "This official link is a PDF. Open it in your own browser. Whitestone does not store the file.",
        retrievedAt,
        kind: match.kind,
        label: match.label,
      };
      cacheSet(url, source, now);
      return { source, cached: false };
    }

    if (ctype && !/html|text|xml|json/.test(ctype)) return { error: "unsupported-type" };

    const html = await readCapped(res, PAGE_CAP);
    const extracted = extractMainText(html, MAX_EXCERPT_CHARS);
    const source: WebSource = {
      title: extracted.title || titleHint || titleFromUrl(finalUrl),
      url: finalUrl,
      excerpt: extracted.text || "The page was retrieved, but no readable excerpt could be extracted.",
      retrievedAt,
      kind: match.kind,
      label: match.label,
    };
    cacheSet(url, source, now);
    return { source, cached: false };
  } catch {
    return { error: "fetch-failed" };
  } finally {
    clearTimeout(timer);
  }
}

function json(data: unknown, status = 200, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });
}

async function readBody(request: Request): Promise<unknown> {
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > BODY_CAP) throw new Error("body-too-large");
  const text = await request.text();
  if (text.length > BODY_CAP) throw new Error("body-too-large");
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}

export async function handleResearch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type, accept",
        "cache-control": "no-store",
      },
    });
  }

  if (request.method === "GET" && url.pathname.replace(/\/+$/, "").endsWith("/allowlist")) {
    return json({ ok: true, ...describeAllowlist() });
  }

  if (request.method === "GET") {
    const hasQuery = url.searchParams.get("query") || url.searchParams.get("jurisdiction") || url.searchParams.get("matter");
    if (!hasQuery) return json(capability());
  }

  if (request.method !== "POST" && request.method !== "GET") {
    return json({ ok: false, error: "method-not-allowed" }, 405);
  }

  const now = Date.now();
  if (!allowRate(clientIp(request), now)) {
    console.log(JSON.stringify({ event: "whitestone.research", status: "rate", qlen: 0 }));
    return json({ ok: false, error: "rate-limited", capability: RESEARCH_CAPABILITY }, 429);
  }

  let raw: unknown = {};
  if (request.method === "POST") {
    try {
      raw = await readBody(request);
    } catch {
      return json({ ok: false, error: "invalid-json" }, 400);
    }
  } else {
    raw = {
      jurisdiction: url.searchParams.get("jurisdiction"),
      matter: url.searchParams.get("matter"),
      query: url.searchParams.get("query") ?? "",
      reason: url.searchParams.get("reason") ?? "ask",
    };
  }

  const parsed = parseResearchInput(raw);
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400);

  const input = parsed.value;
  if (!shouldFetch(input) && input.reason === "ask" && !input.jurisdiction && !input.matter) {
    const empty: ResearchResult = {
      ok: true,
      capability: RESEARCH_CAPABILITY,
      sources: [],
      notes: "Choose a jurisdiction or ask a court/forms question so I can select allowlisted public pages.",
      unavailable: false,
      failed: [],
      fetched: 0,
      cached: 0,
    };
    return json(empty);
  }

  const seeds = selectSeeds(input);
  const failed: { url: string; reason: string }[] = [];
  const sources: WebSource[] = [];
  let fetched = 0;
  let cached = 0;

  const results = await Promise.all(seeds.map((seed) => fetchSeed(seed.url, seed.title, now)));
  results.forEach((row, i) => {
    const seed = seeds[i];
    if ("error" in row) {
      failed.push({ url: seed.url, reason: row.error });
      return;
    }
    sources.push(row.source);
    if (row.cached) cached += 1;
    else fetched += 1;
  });

  const result: ResearchResult = {
    ok: true,
    capability: RESEARCH_CAPABILITY,
    sources,
    notes: sources.length
      ? "Excerpts are copied from the retrieved page. Verify with the clerk. Coverage is not a complete annotated code."
      : "No allowlisted page could be retrieved. Using the local knowledge layer.",
    unavailable: false,
    failed,
    fetched,
    cached,
  };

  console.log(
    JSON.stringify({
      event: "whitestone.research",
      status: sources.length ? "ok" : "empty",
      qlen: input.query.length,
      j: input.jurisdiction ?? "",
      m: input.matter ?? "",
      n: sources.length,
      fetched,
      cached,
    }),
  );

  return json(result);
}
