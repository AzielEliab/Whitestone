import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ECOSYSTEM_SITES } from "../../ecosystem/sites";
import { EcosystemStrip } from "./EcosystemStrip";

describe("EcosystemStrip", () => {
  const html = renderToStaticMarkup(createElement(EcosystemStrip));

  it("links all ten live public sites and the doors page", () => {
    expect(ECOSYSTEM_SITES).toHaveLength(10);
    expect(html).toContain('href="/doors"');
    expect(html).toContain("Ecosystem");
    const text = html.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
    for (const site of ECOSYSTEM_SITES) {
      expect(html).toContain(`href="${site.href}"`);
      expect(text).toContain(site.name);
    }
  });

  it("keeps MirageGrid labeled and leaves machine-only aliases off the strip", () => {
    expect(html).toContain("public_icann: false");
    expect(html).toContain("Not an ICANN registrar.");
    expect(html).not.toContain("thefurnaceisntfree.com");
    expect(html).not.toContain("download-tracker");
    expect(html).not.toContain("Elias Artista");
    expect(html).not.toContain("The Revealer of the Sealed");
    expect(html).not.toContain("Aziel Elroi Eliab");
    expect(html).not.toContain("15:20");
    expect(html).toContain("https://furnaceisntfree.com/");
  });
});
