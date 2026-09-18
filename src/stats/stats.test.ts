import { describe, expect, it } from "vitest";
import { STAT_RECORDS } from "./records";
import { retrieveStats } from "./retrieve";
import { formatStatsBlock } from "./format";
import { assertStatRecord } from "./types";

describe("bundled statistics", () => {
  it("rejects empty source URLs and requires https", () => {
    expect(STAT_RECORDS.length).toBeGreaterThan(8);
    for (const record of STAT_RECORDS) {
      expect(() => assertStatRecord(record)).not.toThrow();
      expect(record.sourceUrl).toMatch(/^https:\/\//);
      expect(record.sourceUrl.length).toBeGreaterThan(12);
      expect(record.sourceTitle.trim().length).toBeGreaterThan(8);
    }
    expect(() =>
      assertStatRecord({
        ...STAT_RECORDS[0],
        id: "bad-empty-url",
        sourceUrl: "",
      }),
    ).toThrow(/missing sourceUrl/);
  });

  it("does not invent a custody win-rate and labels household data", () => {
    const hits = retrieveStats({ query: "mothers vs fathers custody", area: "divorce" });
    expect(hits.some((h) => h.id === "census-custodial-parents-2018")).toBe(true);
    const text = formatStatsBlock(hits, "divorce");
    expect(text).toMatch(/not a count of who 'won'|not a custody win-rate|living-arrangement/i);
    expect(text).toContain("https://www.census.gov");
    expect(text).not.toMatch(/\b85% of fathers lose\b/i);
  });

  it("returns cited criminal plea context without treating it as a prediction", () => {
    const hits = retrieveStats({ query: "what do the numbers say about plea rates", area: "criminal" });
    expect(hits.some((h) => h.topic === "plea")).toBe(true);
    const text = formatStatsBlock(hits, "criminal");
    expect(text).toMatch(/bjs\.ojp\.gov/);
    expect(text).toMatch(/not a prediction/i);
    expect(text).toMatch(/2009/);
  });

  it("keeps civil debt-collection figures on a named Pew / NCSC / CFPB source", () => {
    const hits = retrieveStats({ query: "debt collection lawsuit numbers", area: "civil" });
    expect(hits.some((h) => /pewtrusts|ncsc|consumerfinance/i.test(h.sourceUrl))).toBe(true);
  });
});
