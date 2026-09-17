import { describe, expect, it } from "vitest";
import { isAllowedUrl } from "./allowlist";
import { selectSeeds } from "./seeds";

describe("seed map", () => {
  it("starts from the jurisdiction self-help portal", () => {
    const seeds = selectSeeds({
      jurisdiction: "CA",
      matter: "divorce",
      query: "current divorce packet",
      reason: "ask",
    });
    expect(seeds.length).toBeGreaterThan(0);
    expect(seeds.length).toBeLessThanOrEqual(4);
    expect(seeds.some((s) => s.url.includes("selfhelp.courts.ca.gov"))).toBe(true);
    expect(seeds.every((s) => isAllowedUrl(s.url))).toBe(true);
  });

  it("adds federal child-support public pages for that matter", () => {
    const seeds = selectSeeds({
      jurisdiction: "TX",
      matter: "child-support",
      query: "child support guidelines worksheet",
      reason: "ask",
    });
    expect(seeds.some((s) => /usa\.gov|acf\.hhs\.gov|txcourts|texaslawhelp/i.test(s.url))).toBe(true);
  });

  it("never returns a blocked host", () => {
    const seeds = selectSeeds({
      jurisdiction: "NY",
      matter: "custody",
      query: "best divorce lawyer blog reddit avvo",
      reason: "ask",
    });
    expect(seeds.every((s) => !/avvo|reddit|blog/.test(s.url))).toBe(true);
  });

  it("labels Justia only when the query asks about statutes", () => {
    const plain = selectSeeds({
      jurisdiction: "OR",
      matter: "divorce",
      query: "where do I file",
      reason: "ask",
    });
    expect(plain.some((s) => s.kind === "justia")).toBe(false);
    const statute = selectSeeds({
      jurisdiction: "OR",
      matter: "divorce",
      query: "Oregon statute code for residency",
      reason: "ask",
    });
    expect(statute.some((s) => s.kind === "justia" && /unofficial/i.test(s.label))).toBe(true);
  });
});
