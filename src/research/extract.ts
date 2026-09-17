import { MAX_EXCERPT_CHARS } from "./types";

export function stripScriptsAndChrome(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<object\b[\s\S]*?<\/object>/gi, " ")
    .replace(/<embed\b[^>]*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, " ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return code > 0 && code < 1114112 ? String.fromCodePoint(code) : "";
    });
}

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function extractTitle(html: string): string {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) {
    const cleaned = collapseWhitespace(decodeEntities(title.replace(/<[^>]+>/g, " ")));
    if (cleaned) return cleaned.slice(0, 180);
  }
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) {
    const cleaned = collapseWhitespace(decodeEntities(h1.replace(/<[^>]+>/g, " ")));
    if (cleaned) return cleaned.slice(0, 180);
  }
  return "";
}

export function extractMainText(
  html: string,
  maxChars = MAX_EXCERPT_CHARS,
): { title: string; text: string } {
  const stripped = stripScriptsAndChrome(html);
  const title = extractTitle(stripped);
  const text = collapseWhitespace(decodeEntities(stripped.replace(/<[^>]+>/g, " ")));
  return { title, text: text.slice(0, maxChars) };
}

export function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname;
    return last.replace(/[-_]+/g, " ").replace(/\.(html?|php|aspx?)$/i, "") || u.hostname;
  } catch {
    return "Public page";
  }
}
