import { describe, expect, it } from "vitest";
import {
  CORPUS_HONESTY,
  LAW_EVENT_TYPES,
  LAW_RECORDS,
  assertLawRecord,
  evaluateHistorical,
  formatHistoricalBlock,
  isInForceAsOf,
  isValidAsOf,
  jurisdictionHook,
  parseAsOf,
  standingAsOf,
  timelineAsOf,
} from "./index";

describe("historical law records", () => {
  it("rejects empty source URLs and requires https plus dated fields", () => {
    expect(LAW_RECORDS.length).toBeGreaterThan(16);
    for (const record of LAW_RECORDS) {
      expect(() => assertLawRecord(record)).not.toThrow();
      expect(record.sourceUrl).toMatch(/^https:\/\//);
      expect(record.sourceUrl.length).toBeGreaterThan(12);
      expect(record.sourceTitle.trim().length).toBeGreaterThan(8);
      expect(record.citation.trim().length).toBeGreaterThan(3);
      expect(["civil", "criminal"]).toContain(record.kind);
      expect(LAW_EVENT_TYPES).toContain(record.event_type);
      expect(record.jurisdiction).toBeTruthy();
    }
    expect(() =>
      assertLawRecord({
        ...LAW_RECORDS[0],
        id: "bad-empty-url",
        sourceUrl: "",
      }),
    ).toThrow(/missing sourceUrl/);
    const types = new Set(LAW_RECORDS.map((r) => r.event_type));
    for (const event of LAW_EVENT_TYPES) {
      expect(types.has(event)).toBe(true);
    }
  });

  it("does not invent National Archives milestone slugs that are not on the NARA list", () => {
    const invented = [
      "/milestone-documents/civil-rights-act-1866",
      "/milestone-documents/espionage-act",
      "/milestone-documents/18th-amendment",
      "/milestone-documents/volstead-act",
      "/milestone-documents/21st-amendment",
      "/milestone-documents/fair-housing-act",
      "/milestone-documents/26th-amendment",
    ];
    for (const record of LAW_RECORDS) {
      expect(record.sourceUrl).toMatch(/^https:\/\//);
      for (const slug of invented) {
        expect(record.sourceUrl).not.toContain(slug);
      }
      if (record.effective_to) {
        expect(record.effective_to >= record.effective_from).toBe(true);
      }
    }
    const amendments = LAW_RECORDS.filter((r) => /U\.S\. Const\. amend/i.test(r.citation));
    for (const record of amendments) {
      if (record.event_type === "repeal") continue;
      expect(record.event_type).toBe("add");
    }
    const closers = LAW_RECORDS.filter((r) => r.event_type === "repeal" || r.event_type === "remove");
    for (const closer of closers) {
      const prior = LAW_RECORDS.find(
        (r) =>
          r.citation === closer.citation &&
          (r.event_type === "enact" || r.event_type === "add") &&
          r.effective_from < closer.effective_from,
      );
      expect(prior).toBeTruthy();
    }
  });

  it("does not claim a complete digitized corpus", () => {
    expect(CORPUS_HONESTY).toMatch(/does not ship a complete digitized corpus/i);
    expect(CORPUS_HONESTY).not.toMatch(/every U\.S\. law since 1776 is included/i);
  });
});

describe("as-of date algebra", () => {
  it("parses year-month and treats year-only as December", () => {
    expect(parseAsOf("1925-06")).toEqual({ year: 1925, month: 6 });
    expect(parseAsOf("March 1865")).toEqual({ year: 1865, month: 3 });
    expect(parseAsOf("1850")).toEqual({ year: 1850, month: 12 });
    expect(parseAsOf("1776-06")).toBeNull();
    expect(isValidAsOf({ year: 1776, month: 7 })).toBe(true);
    expect(isValidAsOf({ year: 1776, month: 6 })).toBe(false);
  });

  it("marks the 18th Amendment standing in 1925-06 and repealed as of 1933-12", () => {
    expect(isInForceAsOf("1920-01-16", "1933-12-05", { year: 1925, month: 6 })).toBe(true);
    expect(isInForceAsOf("1920-01-16", "1933-12-05", { year: 1933, month: 11 })).toBe(true);
    expect(isInForceAsOf("1920-01-16", "1933-12-05", { year: 1933, month: 12 })).toBe(false);
    expect(isInForceAsOf("1920-01-16", "1933-12-05", { year: 1919, month: 12 })).toBe(false);

    const mid = standingAsOf({ asOf: { year: 1925, month: 6 }, kind: "criminal" });
    expect(mid.some((r) => r.citation.includes("amend. XVIII") && r.event_type === "add")).toBe(true);
    const after = standingAsOf({ asOf: { year: 1934, month: 1 }, kind: "criminal" });
    expect(after.some((r) => r.citation.includes("amend. XVIII") && r.event_type === "add")).toBe(false);
    expect(after.some((r) => r.citation.includes("amend. XXI"))).toBe(true);

    const events = timelineAsOf({
      asOf: { year: 1934, month: 1 },
      kind: "criminal",
      query: "eighteenth amendment prohibition repeal",
    });
    expect(events.some((r) => r.event_type === "repeal" && r.citation.includes("amend. XVIII"))).toBe(true);
    expect(events.some((r) => r.event_type === "remove" && /Volstead/i.test(r.citation))).toBe(true);
  });

  it("keeps the 13th Amendment off the books in 1865-11 and on in 1865-12", () => {
    const before = standingAsOf({ asOf: { year: 1865, month: 11 }, kind: "civil" });
    const after = standingAsOf({ asOf: { year: 1865, month: 12 }, kind: "civil" });
    expect(before.some((r) => r.citation.includes("amend. XIII"))).toBe(false);
    expect(after.some((r) => r.citation.includes("amend. XIII"))).toBe(true);
  });

  it("applies Chinese Exclusion enact then 1943 repeal", () => {
    const standing1900 = standingAsOf({ asOf: { year: 1900, month: 1 }, kind: "civil" });
    const standing1944 = standingAsOf({ asOf: { year: 1944, month: 1 }, kind: "civil" });
    expect(standing1900.some((r) => /Chinese Exclusion/i.test(r.title) && r.event_type === "enact")).toBe(true);
    expect(standing1944.some((r) => /Chinese Exclusion/i.test(r.title) && r.event_type === "enact")).toBe(false);
    const timeline = timelineAsOf({ asOf: { year: 1944, month: 1 }, kind: "civil", query: "chinese exclusion magnuson" });
    expect(timeline.some((r) => r.event_type === "repeal")).toBe(true);
  });
});

describe("jurisdiction hooks", () => {
  it("returns UNKNOWN for a state with no dated historical rows", () => {
    const hook = jurisdictionHook("OR");
    expect(hook.status).toBe("UNKNOWN");
    expect(hook.datedRecordCount).toBe(0);
    expect(hook.note).toMatch(/UNKNOWN/);
    expect(hook.name).toMatch(/Oregon/i);
  });

  it("labels federal coverage as PARTIAL, not complete", () => {
    const hook = jurisdictionHook("US");
    expect(hook.status).toBe("PARTIAL");
    expect(hook.note).not.toMatch(/complete digitized corpus of every/i);
  });
});

describe("historical evaluation", () => {
  it("evaluates prohibition as of 1925-06 against dated records", () => {
    const result = evaluateHistorical({
      asOf: { year: 1925, month: 6 },
      query: "Was the 18th Amendment in force as of 1925-06?",
      area: "criminal",
      jurisdiction: "CA",
    });
    expect(result.verdict).not.toBe("NEED-DATE");
    expect(result.hook.status).toBe("UNKNOWN");
    expect(result.matched.some((r) => r.citation.includes("amend. XVIII"))).toBe(true);
    expect(result.standing.some((r) => r.citation.includes("amend. XVIII"))).toBe(true);
    const text = formatHistoricalBlock(result);
    expect(text).toMatch(/does not ship a complete digitized corpus/i);
    expect(text).toContain("https://www.archives.gov/founding-docs/amendments-11-27");
    expect(result.later.some((r) => r.event_type === "repeal" && r.citation.includes("amend. XVIII"))).toBe(true);
    expect(text).toMatch(/not yet in force/i);
    expect(text).toMatch(/UNKNOWN/);
    expect(text).toMatch(/not legal advice/i);
  });

  it("refuses an uncitable 1850 statute claim and invented holdings", () => {
    const law1850 = evaluateHistorical({
      asOf: { year: 1850, month: 6 },
      query: "The law said Oregon required Form FL-100 in 1850 for every divorce.",
      archivalFacts: "Archival ruling: Smith v. Jones held that fathers always lose.",
      area: "divorce",
      jurisdiction: "OR",
    });
    expect(law1850.verdict).toBe("REFUSE");
    expect(law1850.refused.join(" ")).toMatch(/will not invent|will not state/i);
    expect(law1850.refused.join(" ")).toMatch(/form number|holding/i);

    const holding = evaluateHistorical({
      asOf: { year: 1857, month: 3 },
      query: "The court held that the plaintiff wins in 1857.",
      area: "civil",
      jurisdiction: "MO",
    });
    expect(holding.verdict).toBe("REFUSE");
    expect(holding.refused.join(" ")).toMatch(/holding/i);
  });

  it("asks for a year and month when none is supplied", () => {
    const result = evaluateHistorical({
      query: "compare my archival ruling to standing law",
      area: "civil",
    });
    expect(result.verdict).toBe("NEED-DATE");
  });
});
