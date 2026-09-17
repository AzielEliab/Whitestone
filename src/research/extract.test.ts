import { describe, expect, it } from "vitest";
import { extractMainText, stripScriptsAndChrome, titleFromUrl } from "./extract";

describe("extract", () => {
  it("strips scripts and keeps a title plus readable excerpt", () => {
    const html = `<!doctype html><html><head><title>Divorce packets</title>
      <script>window.evil = true</script><style>body{display:none}</style></head>
      <body><h1>Divorce packets</h1><p>Ask the clerk for the current forms.</p>
      <script>alert(1)</script></body></html>`;
    expect(stripScriptsAndChrome(html)).not.toMatch(/evil|alert/);
    const { title, text } = extractMainText(html);
    expect(title).toBe("Divorce packets");
    expect(text).toMatch(/Ask the clerk/);
    expect(text).not.toMatch(/alert/);
    const chrome = extractMainText(
      `<title>Guide</title>Skip to main content Please help us improve our site! × No thank you Ask the clerk.`,
    );
    expect(chrome.text).toMatch(/Ask the clerk/);
    expect(chrome.text).not.toMatch(/Skip to main content/i);
    expect(chrome.text).not.toMatch(/No thank you/i);
  });

  it("caps excerpt length", () => {
    const html = `<title>Long</title>${"word ".repeat(400)}`;
    const { text } = extractMainText(html, 80);
    expect(text.length).toBeLessThanOrEqual(80);
  });

  it("derives a fallback title from a URL", () => {
    expect(titleFromUrl("https://selfhelp.courts.ca.gov/child-support")).toMatch(/child support/i);
  });
});
