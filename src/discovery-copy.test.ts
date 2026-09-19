import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { describeAllowlist } from "./research/allowlist";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const DISCOVERY = [
  "index.html",
  "public/catalog.json",
  "public/manifest.webmanifest",
  "worker/index.ts",
  "worker/research.ts",
  "README.md",
];

const FORBIDDEN = [
  /THIS IS NOT/i,
  /What this is not/i,
  /What it is not/i,
  /does not really/i,
  /what not to say/i,
  /≠/,
  /not a lawyer/i,
  /not legal advice/i,
  /blocked from/i,
  /blockedExamples/,
  /SEO mills are blocked/i,
  /CNS-ZENODO/i,
  /zenodo[- ]?ban/i,
  /IP-BAN/i,
  /Zenodo refused/i,
];

describe("discovery surfaces", () => {
  const texts = DISCOVERY.map((rel) => ({
    rel,
    text: readFileSync(join(root, rel), "utf8"),
  }));
  const all = texts.map((t) => t.text).join("\n");

  it("keeps the Whitestone definition", () => {
    expect(all).toMatch(/ephemeral pro se/i);
    expect(all).toMatch(/Criminal/);
    expect(all).toMatch(/Civil/);
    expect(all).toMatch(/Divorce/);
    expect(all).toMatch(/whitestone\.vibelock\.workers\.dev/);
    expect(all).toMatch(/Aziel Eliab/);
  });

  it("drops SEO not-catalogs and blocked-from / Zenodo-ban lines", () => {
    for (const { rel, text } of texts) {
      for (const re of FORBIDDEN) {
        expect(text, `${rel} ${re}`).not.toMatch(re);
      }
    }
  });

  it("publishes a positive allowlist without a blocked-from catalog", () => {
    const desc = describeAllowlist();
    expect(desc.kinds).toContain("state-judiciary");
    expect(desc.exampleHosts.join(" ")).toMatch(/courts/i);
    expect(desc).not.toHaveProperty("blockedExamples");
  });
});
