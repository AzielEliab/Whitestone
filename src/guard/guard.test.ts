import { describe, expect, it } from "vitest";
import { coherenceCheck, detectUnsupported, neutralizeText } from "./coherence";
import { isBoldClaim, runDecisionGate } from "./decisiongate";
import { sha256Hex } from "./hash";
import { COHERENCE_MOTTO, NO_LIE_LAW } from "./nolie";
import { sessionReceipt } from "./receipt";

describe("sha256 session receipt", () => {
  it("matches the known empty-string and abc digests", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("hashes reply + urls + stat ids and stays ephemeral-shaped", () => {
    const a = sessionReceipt("hello", ["https://example.gov/a"], ["stat-1"]);
    const b = sessionReceipt("hello", ["https://example.gov/a"], ["stat-1"]);
    const c = sessionReceipt("hello!", ["https://example.gov/a"], ["stat-1"]);
    expect(a.sha256).toBe(b.sha256);
    expect(a.sha256).not.toBe(c.sha256);
    expect(a.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(a.note).toMatch(/End & erase/);
  });
});

describe("DecisionGATE-lite", () => {
  it("fails Evidence on a bold claim with no source or session fact", () => {
    const report = runDecisionGate({
      claim: "You must file Form FL-100 by March 1.",
      groundedText: "",
      sessionFacts: "",
    });
    expect(isBoldClaim("You must file Form FL-100 by March 1.")).toBe(true);
    expect(report.results.find((g) => g.name === "evidence")?.pass).toBe(false);
    expect(report.action).toBe("refuse");
  });

  it("passes Evidence when the claim cites a URL and session fact", () => {
    const report = runDecisionGate({
      claim: "Oregon overview, verify: usual court is Circuit Court. https://www.courts.oregon.gov/ Self-help.",
      groundedText: "Oregon Circuit Court self-help https://www.courts.oregon.gov/",
      sessionFacts: "This session is Divorce in Oregon. Petitioner: Alex.",
    });
    expect(report.results.find((g) => g.name === "evidence")?.pass).toBe(true);
    expect(report.results.find((g) => g.name === "responsibility")?.pass).toBe(true);
    expect(report.action).toBe("ok");
  });
});

describe("AZCoherence-inspired coherence_check", () => {
  it("keeps the motto and NO-LIE cite", () => {
    expect(COHERENCE_MOTTO).toMatch(/Confidence is not truth/);
    expect(NO_LIE_LAW.rules.some((r) => /refuse/i.test(r))).toBe(true);
  });

  it("NEUTRALIZE/REFUSE an ungrounded absolute filing claim", () => {
    const flags = detectUnsupported("You must file Form FL-100 by March 1.", "", []);
    expect(flags.some((f) => /mandate|form/i.test(f))).toBe(true);
    const report = coherenceCheck({
      primary: "You must file Form FL-100 by March 1.\n\nAlso gather the clerk packet.",
      sessionFacts: "This session is Divorce in Oregon.",
    });
    expect(["NEUTRALIZE", "REFUSE"]).toContain(report.verdict);
    expect(report.emitted).not.toMatch(/FL-100 by March 1/);
    expect(report.emitted).toMatch(/Neutralized|REFUSE|will not state/i);
  });

  it("PASS a grounded checklist that cites a URL", () => {
    const report = coherenceCheck({
      primary:
        "Oregon overview, verify: usual court Circuit Court. Confirm the clerk. https://www.courts.oregon.gov/\n\nTypical documents (verify locally): petition; summons. Not legal advice.",
      sessionFacts: "This session is Divorce / Divorce in Oregon. Petitioner: Alex.",
      knowledgeBits: ["Oregon Circuit Court venue note"],
      research: {
        ok: true,
        capability: "allowlisted-public-pages",
        sources: [
          {
            title: "Oregon courts self-help",
            url: "https://www.courts.oregon.gov/",
            excerpt: "Ask the clerk for the current forms.",
            retrievedAt: "2026-09-18T00:00:00.000Z",
            kind: "state-judiciary",
            label: "Court / self-help portal",
          },
        ],
        notes: "",
        unavailable: false,
        failed: [],
        fetched: 1,
        cached: 0,
      },
    });
    expect(report.verdict).toBe("PASS");
    expect(report.evidence.some((e) => e.ref === "https://www.courts.oregon.gov/")).toBe(true);
    expect(report.emitted).toMatch(/Oregon/);
  });

  it("REFUSE an invented statistic and a fake case cite", () => {
    const stats = coherenceCheck({
      primary: "Exactly 99% of fathers lose custody in Oregon last Tuesday.",
      sessionFacts: "Divorce session in Oregon.",
    });
    expect(stats.flags.some((f) => /statistic/i.test(f))).toBe(true);
    expect(["NEUTRALIZE", "REFUSE"]).toContain(stats.verdict);

    const cite = coherenceCheck({
      primary: "Smith v. Jones, 123 U.S. 456 held that you win.",
      sessionFacts: "Custody session.",
    });
    expect(cite.verdict).toBe("REFUSE");
    expect(cite.emitted).toMatch(/will not state/i);
  });

  it("REFUSE an uncitable historical law claim without a dated record", () => {
    const report = coherenceCheck({
      primary: "In 1850 the law said every petitioner must file Form FL-100.",
      sessionFacts: "Historical as-of session in Oregon.",
    });
    expect(report.verdict).toBe("REFUSE");
    expect(report.emitted).toMatch(/will not state/i);
  });

  it("strips unsupported sentences in neutralizeText", () => {
    const out = neutralizeText("You must file Form FL-100 by March 1.\n\nAsk the clerk for the packet.");
    expect(out).toMatch(/Ask the clerk/);
    expect(out).not.toMatch(/FL-100/);
  });
});
