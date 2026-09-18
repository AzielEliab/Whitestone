import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  addCalendarDays,
  bondCashResult,
  compoundInterest,
  damagesResult,
  documentedSupportPercent,
  HEURISTIC_BANNER,
  looksLikeMath,
  parseFlexibleDate,
  parseMathAsk,
  percentOf,
  proRata,
  simpleInterest,
  supportEstimate,
  ymd,
} from "./index";

describe("date / deadline math", () => {
  it("adds calendar days and skips weekends for business days", () => {
    const start = ymd(2026, 3, 1); // Sunday
    expect(addCalendarDays(start, 30)).toEqual(ymd(2026, 3, 31));
    expect(addBusinessDays(ymd(2026, 3, 2), 5)).toEqual(ymd(2026, 3, 9));
  });

  it("parses named dates and labels holiday limits", () => {
    expect(parseFlexibleDate("March 1, 2026")).toEqual(ymd(2026, 3, 1));
    const result = parseMathAsk("30 days from March 1 2026");
    expect(result?.kind).toBe("deadline");
    expect(result?.summary).toMatch(/March 31, 2026/);
    expect(result?.insertText).toMatch(/holidays are not fully modeled/i);
    expect(result?.insertText).toMatch(/HEURISTIC/);
  });
});

describe("interest and percent", () => {
  it("computes simple and compound interest", () => {
    expect(simpleInterest(10000, 5, 2)).toBe(1000);
    expect(compoundInterest(10000, 10, 1, 1)).toBeCloseTo(1000);
    expect(compoundInterest(1000, 10, 2, 1)).toBeCloseTo(210);
  });

  it("does percent, pro-rata, and bond cash illustrations", () => {
    expect(percentOf(5000, 10)).toBe(500);
    expect(proRata(12000, [60, 40])).toEqual([7200, 4800]);
    const bond = bondCashResult(5000, 10);
    expect(bond.summary).toMatch(/\$500\.00/);
    expect(bond.insertText).toMatch(/HEURISTIC/);
    expect(bond.insertText).toMatch(/not a national rule/i);
  });
});

describe("support estimator", () => {
  it("uses the published Texas percentage schedule with a source URL", () => {
    const tx = documentedSupportPercent("TX", 1);
    expect(tx?.percent).toBe(20);
    expect(tx?.sourceUrl).toMatch(/^https:\/\//);
    const result = supportEstimate({ jurisdiction: "TX", children: 2, obligorMonthly: 4000 });
    expect(result.labeled).toBe("public-formula");
    expect(result.summary).toMatch(/\$1,000\.00/);
    expect(result.sourceUrl).toContain("statutes.capitol.texas.gov");
    expect(result.insertText).toMatch(/NOT the official interactive worksheet/i);
  });

  it("refuses to pretend a generic sketch is a state worksheet", () => {
    const result = supportEstimate({ jurisdiction: "CA", children: 1, obligorMonthly: 4000, otherMonthly: 2000 });
    expect(result.labeled).toBe("heuristic");
    expect(result.insertText).toMatch(/NOT California's official/i);
    expect(result.insertText).toMatch(/income-shares/);
  });
});

describe("damages totaling", () => {
  it("sums user line items", () => {
    const result = damagesResult({
      lines: [
        { label: "Repairs", amount: 800 },
        { label: "Deposit", amount: 200 },
      ],
      feePercent: 10,
    });
    expect(result.summary).toMatch(/\$1,000\.00/);
    expect(result.summary).toMatch(/\$1,100\.00/);
  });
});

describe("natural-language parse", () => {
  it("parses bail percent and interest asks", () => {
    expect(looksLikeMath("what's 10% of $5000 bail")).toBe(true);
    const bail = parseMathAsk("what's 10% of $5000 bail");
    expect(bail?.kind).toBe("bond");
    expect(bail?.summary).toMatch(/\$500\.00/);
    const interest = parseMathAsk("simple interest on $10000 at 5% for 2 years");
    expect(interest?.kind).toBe("interest");
    expect(interest?.summary).toMatch(/\$1,000\.00/);
  });

  it("always attaches the honesty banner", () => {
    const result = parseMathAsk("25% of $200");
    expect(result?.insertText).toContain(HEURISTIC_BANNER.split("—")[0].trim());
  });
});
