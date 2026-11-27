/**
 * Plain-text and HTML discovery bodies for Whitestone.
 * public/ copies must match these bytes. Author: Aziel Eliab.
 */
import {
  AUTHOR_ALIASES,
  AUTHOR_ID,
  AUTHOR_NAME,
  AUTHOR_URL,
  DISCOVERY_LASTMOD,
  ECOSYSTEM_SITES,
  ECOSYSTEM_VERIFIED,
  ORIGIN,
  PRODUCT_DESCRIPTION,
  VERSION,
  X_URL,
  type EcosystemSite,
} from "../src/ecosystem/sites.ts";

export const CONTENT_SIGNAL = "search=yes, ai-input=yes, ai-train=yes";
export const INDEXNOW_KEY = "c297c8efc60d974ce83de0a5bf7d2939";

export type DiscoveryMatch = {
  status: number;
  contentType: string;
  body: string;
};

const TEXT = "text/plain; charset=utf-8";
const HTML = "text/html; charset=utf-8";
const XML = "application/xml; charset=utf-8";

export function normalizeDiscoveryPath(input: string): string {
  const raw = input.split("?")[0]?.split("#")[0] || "/";
  const path = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  return path || "/";
}

export function matchDiscovery(pathname: string, method = "GET"): DiscoveryMatch | null {
  const path = normalizeDiscoveryPath(pathname);
  const contentType = contentTypeFor(path);
  if (!contentType) return null;
  if (method !== "GET" && method !== "HEAD") {
    return { status: 405, contentType: TEXT, body: "method-not-allowed\n" };
  }
  return { status: 200, contentType, body: bodyFor(path) };
}

export function discoveryPublicFiles(): { path: string; body: string }[] {
  return [
    { path: "llms.txt", body: llmsTxt() },
    { path: "ai.txt", body: aiTxt() },
    { path: ".well-known/ai.txt", body: aiTxt() },
    { path: ".well-known/indexnow-key.txt", body: INDEXNOW_KEY },
    { path: `${INDEXNOW_KEY}.txt`, body: INDEXNOW_KEY },
    { path: "robots.txt", body: robotsTxt() },
    { path: "sitemap.xml", body: sitemapXml() },
    { path: "doors.html", body: doorsHtml() },
  ];
}

export function llmsTxt(): string {
  const ecosystem = ECOSYSTEM_SITES.map((site) => ecosystemBullet(site));
  return [
    "# Whitestone",
    "",
    `> ${PRODUCT_DESCRIPTION}`,
    "",
    "Whitestone is educational procedural software for all 50 U.S. states and the District of Columbia. Open the live app on a phone or desktop. End & erase wipes the session. Uploads stay in the browser. The Worker does not store case files. A software zip is optional.",
    "",
    `Author: ${AUTHOR_NAME}`,
    `Author @id: ${AUTHOR_ID}`,
    `Machine aliases: ${AUTHOR_ALIASES.join("; ")}`,
    `X: @AzielEliab ${X_URL}`,
    `Version: ${VERSION}`,
    "License: Apache-2.0",
    "GitHub: https://github.com/AzielEliab/Whitestone",
    "",
    "## Live",
    "",
    `- [Whitestone](${ORIGIN}/): ephemeral pro se advisor`,
    `- [Ecosystem doors](${ORIGIN}/doors): ten live public Aziel Eliab sites and runtimes`,
    `- [Catalog](${ORIGIN}/catalog.json): product card`,
    `- [Software](${ORIGIN}/v1/software): agent catalog`,
    `- [Health](${ORIGIN}/v1/health): liveness`,
    `- [Optional zip](${ORIGIN}/download): counted download of the software zip`,
    "",
    "## Ecosystem",
    "",
    `Verified live ${ECOSYSTEM_VERIFIED}.`,
    "",
    ...ecosystem,
    "",
  ].join("\n");
}

export function aiTxt(): string {
  const ecosystem = ECOSYSTEM_SITES.map((site) => {
    const listing = site.listing ? ` | ${site.listing.label}: ${site.listing.href}` : "";
    return `- ${site.name}: ${site.href} — ${site.summary}${listing}`;
  });
  return [
    "# Whitestone",
    `url: ${ORIGIN}/`,
    "name: Whitestone",
    `author: ${AUTHOR_NAME}`,
    `author_id: ${AUTHOR_ID}`,
    `aliases: ${AUTHOR_ALIASES.join("; ")}`,
    `summary: ${PRODUCT_DESCRIPTION}`,
    "practice_areas: Criminal, Civil, Divorce",
    "third_party_llm_apis: none",
    "session_storage: browser-only",
    "worker_stores_case_files: false",
    "zip: optional",
    `zip_url: ${ORIGIN}/download`,
    "github: https://github.com/AzielEliab/Whitestone",
    "license: Apache-2.0",
    `version: ${VERSION}`,
    `x: ${X_URL}`,
    `doors: ${ORIGIN}/doors`,
    `llms: ${ORIGIN}/llms.txt`,
    `catalog: ${ORIGIN}/catalog.json`,
    `content_signal: ${CONTENT_SIGNAL}`,
    `ecosystem_verified: ${ECOSYSTEM_VERIFIED}`,
    "ecosystem:",
    ...ecosystem,
    "",
  ].join("\n");
}

export function robotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    `Content-Signal: ${CONTENT_SIGNAL}`,
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");
}

export function sitemapXml(): string {
  const pages: { loc: string; changefreq: string; priority: string }[] = [
    { loc: `${ORIGIN}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${ORIGIN}/doors`, changefreq: "monthly", priority: "0.6" },
    { loc: `${ORIGIN}/llms.txt`, changefreq: "monthly", priority: "0.3" },
    { loc: `${ORIGIN}/ai.txt`, changefreq: "monthly", priority: "0.3" },
    { loc: `${ORIGIN}/catalog.json`, changefreq: "monthly", priority: "0.4" },
    { loc: `${ORIGIN}/v1/software`, changefreq: "monthly", priority: "0.4" },
  ];
  const urls = pages
    .map(
      (page) => `  <url>
    <loc>${xml(page.loc)}</loc>
    <lastmod>${DISCOVERY_LASTMOD}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function doorsHtml(): string {
  const items = ECOSYSTEM_SITES.map((site) => {
    const listing = site.listing
      ? ` <a href="${esc(site.listing.href)}" rel="noopener noreferrer">${esc(site.listing.label)}</a>`
      : "";
    return `        <li>
          ${anchor(site.href, site.name)}
          <span class="role">${esc(site.summary)}</span>${listing}
        </li>`;
  }).join("\n");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Whitestone ecosystem",
    url: `${ORIGIN}/doors`,
    description:
      "Live public Aziel Eliab sites and runtimes, including Whitestone, the ephemeral pro se legal app for Criminal, Civil, and Divorce.",
    isPartOf: {
      "@type": "WebApplication",
      name: "Whitestone",
      url: `${ORIGIN}/`,
    },
    author: personNode(),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ECOSYSTEM_SITES.length,
      itemListElement: ECOSYSTEM_SITES.map((site, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: site.name,
        url: site.href,
        description: site.summary,
      })),
    },
  };
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ecosystem — Whitestone</title>
    <meta name="description" content="Live public Aziel Eliab sites and runtimes, including Whitestone, the ephemeral pro se legal app for Criminal, Civil, and Divorce." />
    <meta name="author" content="${esc(AUTHOR_NAME)}" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${ORIGIN}/doors" />
    <link rel="author" href="${esc(AUTHOR_ID)}" />
    <meta property="og:title" content="Ecosystem — Whitestone" />
    <meta property="og:description" content="Live public Aziel Eliab sites and runtimes, including Whitestone, the ephemeral pro se legal app." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${ORIGIN}/doors" />
    <meta property="og:site_name" content="Whitestone" />
    <meta property="og:image" content="${ORIGIN}/icon-512.png" />
    ${jsonScript(jsonLd)}
    <style>
      :root { color-scheme: light dark; }
      body { margin: 0; font: 16px/1.5 "Segoe UI", system-ui, sans-serif; background: #f4efe6; color: #241f1a; }
      main { max-width: 40rem; margin: 0 auto; padding: 28px 18px 56px; }
      h1 { font-family: Georgia, "Iowan Old Style", serif; font-size: 2rem; line-height: 1.15; margin: 0.2rem 0 0.6rem; }
      a { color: #1e4d78; }
      a:focus-visible { outline: 3px solid #7c5e10; outline-offset: 2px; }
      .home { font-weight: 650; text-decoration: none; }
      ol { padding-left: 1.25rem; }
      li { margin: 0 0 0.9rem; }
      .role { display: block; color: #5d564d; }
      .foot { color: #5d564d; font-size: 0.92rem; }
      @media (prefers-color-scheme: dark) {
        body { background: #161411; color: #efe7da; }
        a { color: #e6c35c; }
        .role, .foot { color: #b4aa9b; }
      }
    </style>
  </head>
  <body>
    <main>
      <p><a class="home" href="${ORIGIN}/">Whitestone</a></p>
      <h1>Ecosystem</h1>
      <p>Whitestone is the ephemeral pro se legal app in this list: Criminal, Civil, and Divorce, session-only, with no third-party LLM APIs and an optional zip download. These ten sites and runtimes are the live public Aziel Eliab ecosystem (verified ${ECOSYSTEM_VERIFIED}).</p>
      <ol>
${items}
      </ol>
      <p><a href="${ORIGIN}/">Open the Whitestone app</a></p>
      <p class="foot">Author <a href="${esc(AUTHOR_ID)}">${esc(AUTHOR_NAME)}</a>. <a href="${ORIGIN}/llms.txt">llms.txt</a> · <a href="${ORIGIN}/ai.txt">ai.txt</a></p>
    </main>
  </body>
</html>
`;
}

function personNode() {
  return {
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: AUTHOR_NAME,
    url: AUTHOR_URL,
    sameAs: [AUTHOR_URL, X_URL],
    alternateName: [...AUTHOR_ALIASES],
  };
}

function contentTypeFor(path: string): string | null {
  if (path === "/sitemap.xml") return XML;
  if (path === "/doors" || path === "/doors.html") return HTML;
  if (
    path === "/llms.txt" ||
    path === "/ai.txt" ||
    path === "/.well-known/ai.txt" ||
    path === "/.well-known/indexnow-key.txt" ||
    path === `/${INDEXNOW_KEY}.txt` ||
    path === "/robots.txt"
  ) {
    return TEXT;
  }
  return null;
}

function bodyFor(path: string): string {
  switch (path) {
    case "/llms.txt":
      return llmsTxt();
    case "/ai.txt":
    case "/.well-known/ai.txt":
      return aiTxt();
    case "/.well-known/indexnow-key.txt":
    case `/${INDEXNOW_KEY}.txt`:
      return INDEXNOW_KEY;
    case "/robots.txt":
      return robotsTxt();
    case "/sitemap.xml":
      return sitemapXml();
    case "/doors":
    case "/doors.html":
      return doorsHtml();
    default:
      return "";
  }
}

function ecosystemBullet(site: EcosystemSite): string {
  const summary = /[.!]$/.test(site.summary) ? site.summary : `${site.summary}.`;
  const listing = site.listing ? ` ${site.listing.label}: ${site.listing.href}` : "";
  return `- [${site.name}](${site.href}): ${summary}${listing}`;
}

function anchor(href: string, text: string): string {
  const external = !href.startsWith(ORIGIN);
  const rel = external ? ` rel="noopener noreferrer"` : "";
  return `<a href="${esc(href)}"${rel}>${esc(text)}</a>`;
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

function jsonScript(data: unknown): string {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}
