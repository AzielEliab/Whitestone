import { describe, expect, it } from "vitest";
import { isAllowedUrl } from "./allowlist";
import { selectSeeds } from "./seeds";

describe("seed map", () => {
  it("starts from the jurisdiction self-help portal", () => {
    const seeds = selectSeeds({
      jurisdiction: "CA",
      matter: "divorce",
      practiceArea: "divorce",
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
      practiceArea: "divorce",
      query: "child support guidelines worksheet",
      reason: "ask",
    });
    expect(seeds.some((s) => /usa\.gov|acf\.hhs\.gov|txcourts|texaslawhelp/i.test(s.url))).toBe(true);
  });

  it("never returns a blocked host", () => {
    const seeds = selectSeeds({
      jurisdiction: "NY",
      matter: "custody",
      practiceArea: "divorce",
      query: "best divorce lawyer blog reddit avvo",
      reason: "ask",
    });
    expect(seeds.every((s) => !/avvo|reddit|blog/.test(s.url))).toBe(true);
  });

  it("labels Justia only when the query asks about statutes", () => {
    const plain = selectSeeds({
      jurisdiction: "OR",
      matter: "divorce",
      practiceArea: "divorce",
      query: "where do I file",
      reason: "ask",
    });
    expect(plain.some((s) => s.kind === "justia")).toBe(false);
    const statute = selectSeeds({
      jurisdiction: "OR",
      matter: "divorce",
      practiceArea: "divorce",
      query: "Oregon statute code for residency",
      reason: "ask",
    });
    expect(statute.some((s) => s.kind === "justia" && /unofficial/i.test(s.label))).toBe(true);
  });

  it("selects criminal and civil seeds for those practice areas", () => {
    const criminal = selectSeeds({
      jurisdiction: "NY",
      matter: "bail-arraignment",
      practiceArea: "criminal",
      query: "what happens at arraignment public defender",
      reason: "ask",
    });
    expect(criminal.some((s) => /criminal|bail|arraignment|counsel|uscourts/i.test(s.url + s.title))).toBe(true);
    expect(criminal.every((s) => !/divorce|child-custody|child-support/i.test(s.url))).toBe(true);

    const civil = selectSeeds({
      jurisdiction: "CA",
      matter: "small-claims",
      practiceArea: "civil",
      query: "small claims forms",
      reason: "ask",
    });
    expect(civil.some((s) => /small-claims|small_claims/i.test(s.url))).toBe(true);
    expect(civil.every((s) => isAllowedUrl(s.url))).toBe(true);
  });
});
