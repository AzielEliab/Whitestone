import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTHOR_ALIASES,
  AUTHOR_ID,
  DISCOVERY_LASTMOD,
  ECOSYSTEM_SITES,
  PRODUCT_DESCRIPTION,
  VERSION,
} from "../src/ecosystem/sites";
import worker from "./index";
import { INDEXNOW_KEY, discoveryPublicFiles, doorsHtml, llmsTxt, matchDiscovery } from "./discovery";

const ORIGIN = "https://whitestone.vibelock.workers.dev";
const SPA = "<!doctype html><title>SPA shell</title>";
const root = process.cwd();

const HIDDEN_ALIASES = ["Aziel Elroi Eliab", "The Revealer of the Sealed", "Elias Artista"];
const FORBIDDEN = ["thefurnaceisntfree.com", "download-tracker", "ark-private", "15:20", "identity-lock"];

function env() {
  return {
    ASSETS: {
      fetch: async () =>
        new Response(SPA, {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
    COUNTERS: {
      idFromName() {
        throw new Error("counters unused");
      },
      get() {
        throw new Error("counters unused");
      },
    },
  };
}

async function get(path: string, method = "GET") {
  return worker.fetch(new Request(`${ORIGIN}${path}`, { method }), env() as never);
}

function visible(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
}

describe("discovery routes", () => {
  it("serves plain text instead of the SPA shell", async () => {
    for (const path of ["/llms.txt", "/ai.txt", "/.well-known/ai.txt", "/robots.txt"]) {
      const res = await get(path);
      const body = await res.text();
      expect(res.status, path).toBe(200);
      expect(res.headers.get("content-type"), path).toContain("text/plain");
      expect(res.headers.get("content-signal")).toBe("search=yes, ai-input=yes, ai-train=yes");
      expect(body).not.toContain("SPA shell");
      expect(body).not.toContain("<!doctype");
    }
  });

  it("serves the same ai.txt at both well-known and root", async () => {
    const rootAi = await (await get("/ai.txt")).text();
    const wellKnown = await (await get("/.well-known/ai.txt")).text();
    expect(wellKnown).toBe(rootAi);
    expect(rootAi).toContain(PRODUCT_DESCRIPTION);
    expect(rootAi).toContain("third_party_llm_apis: none");
    for (const alias of AUTHOR_ALIASES) expect(rootAi).toContain(alias);
  });

  it("serves the IndexNow key exactly, with no extra bytes", async () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    for (const path of [`/${INDEXNOW_KEY}.txt`, "/.well-known/indexnow-key.txt"]) {
      const res = await get(path);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");
      expect(await res.text()).toBe(INDEXNOW_KEY);
    }
  });

  it("answers HEAD with the real content type and length", async () => {
    const full = await get("/llms.txt");
    const bytes = new TextEncoder().encode(await full.text()).byteLength;
    const head = await get("/llms.txt", "HEAD");
    expect(head.status).toBe(200);
    expect(head.headers.get("content-type")).toContain("text/plain");
    expect(head.headers.get("content-length")).toBe(String(bytes));
    expect(await head.text()).toBe("");
  });

  it("refuses other methods with plain text", async () => {
    const res = await get("/llms.txt", "POST");
    expect(res.status).toBe(405);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).not.toContain("SPA shell");
  });

  it("publishes Growth-ON robots.txt and a sitemap with lastmod", async () => {
    const robots = await (await get("/robots.txt")).text();
    expect(robots).toContain("User-agent: *\nAllow: /\nContent-Signal: search=yes, ai-input=yes, ai-train=yes");
    for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(robots).toContain(`User-agent: ${bot}\nAllow: /`);
    }
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);

    const sitemapRes = await get("/sitemap.xml");
    const sitemap = await sitemapRes.text();
    expect(sitemapRes.headers.get("content-type")).toContain("application/xml");
    expect(sitemap).toContain(`<loc>${ORIGIN}/doors</loc>`);
    expect(sitemap).toContain(`<lastmod>${DISCOVERY_LASTMOD}</lastmod>`);
    expect(sitemap).toContain(`<loc>${ORIGIN}/</loc>`);
    expect(sitemap).toContain(`<loc>${ORIGIN}/llms.txt</loc>`);
  });

  it("serves a doors page that links the ten live sites", async () => {
    const res = await get("/doors");
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).not.toContain("SPA shell");
    expect(html).toContain('rel="canonical" href="https://whitestone.vibelock.workers.dev/doors"');
    const shown = visible(html);
    for (const site of ECOSYSTEM_SITES) {
      expect(shown).toContain(`href="${site.href}"`);
      expect(shown).toContain(site.summary);
    }
    expect(shown).toContain("https://glama.ai/mcp/servers/AzielEliab/aziel-runtime");
    expect(shown).toContain("https://glama.ai/mcp/servers/AzielEliab/trades-runtime");
    expect(shown).toContain("public_icann: false");
    expect(shown).toContain("Not an ICANN registrar.");
    for (const hidden of HIDDEN_ALIASES) expect(shown).not.toContain(hidden);
    expect(html).toContain(AUTHOR_ID);
    for (const hidden of HIDDEN_ALIASES) expect(html).toContain(hidden);
    for (const banned of FORBIDDEN) {
      expect(html.toLowerCase()).not.toContain(banned);
      expect(llmsTxt().toLowerCase()).not.toContain(banned);
    }
    expect(html).not.toMatch(/\blumen\b/i);
  });

  it("keeps the app shell for ordinary routes and stamps Content-Signal", async () => {
    const home = await get("/");
    expect(await home.text()).toContain("SPA shell");
    expect(home.headers.get("content-signal")).toBe("search=yes, ai-input=yes, ai-train=yes");
    const missing = await get("/not-a-page");
    expect(await missing.text()).toContain("SPA shell");
  });

  it("matches the committed public files", () => {
    for (const file of discoveryPublicFiles()) {
      const disk = readFileSync(join(root, "public", file.path), "utf8");
      expect(disk, file.path).toBe(file.body);
    }
  });

  it("describes the shipping product version", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
    expect(pkg.version).toBe(VERSION);
    expect(llmsTxt()).toContain(`Version: ${VERSION}`);
    expect(llmsTxt()).toContain("No third-party LLM APIs");
    expect(llmsTxt()).toContain("optional");
  });
});

describe("index.html machine head", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");

  it("has title, description, canonical, and Open Graph", () => {
    expect(html).toContain("<title>Whitestone — ephemeral pro se advisor (Criminal, Civil, Divorce)</title>");
    expect(html).toContain(`content="${PRODUCT_DESCRIPTION}"`);
    expect(html).toContain('rel="canonical" href="https://whitestone.vibelock.workers.dev/"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:url" content="https://whitestone.vibelock.workers.dev/"');
    expect(html).toContain('property="og:image"');
  });

  it("puts author aliases in JSON-LD only", () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).toBeTruthy();
    const data = JSON.parse(match?.[1] ?? "{}") as {
      author: { "@id": string; alternateName: string[] };
    };
    expect(data.author["@id"]).toBe(AUTHOR_ID);
    expect(data.author.alternateName).toEqual([...AUTHOR_ALIASES]);
    const shown = visible(html);
    for (const hidden of HIDDEN_ALIASES) expect(shown).not.toContain(hidden);
    expect(shown).not.toContain("15:20");
  });
});

describe("doors trailing slash", () => {
  it("normalizes /doors/ to the doors document", () => {
    const hit = matchDiscovery("/doors/");
    expect(hit?.status).toBe(200);
    expect(hit?.body).toBe(doorsHtml());
  });
});
