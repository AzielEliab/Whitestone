import { describe, expect, it } from "vitest";
import { retrieveGuidance } from "../knowledge";
import { emptySession } from "../types";
import { advise, openingMessage } from "./advisor";
import { nextQuestion } from "./dialogue";
import { mapEvidence } from "./evidence-map";
import { buildFilingOutline } from "./filing";
import { learnFromText } from "./learn";

describe("retrieval", () => {
  it("returns jurisdiction and topic hits", () => {
    const hits = retrieveGuidance({
      query: "child support worksheet income",
      jurisdiction: "TX",
      matter: "child-support",
    });
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.some((h) => h.source === "jurisdiction")).toBe(true);
    expect(hits.some((h) => /support/i.test(h.title) || /support/i.test(h.body))).toBe(true);
  });

  it("lists all 51 jurisdictions", async () => {
    const { JURISDICTIONS } = await import("../knowledge/jurisdictions/data");
    expect(JURISDICTIONS).toHaveLength(51);
    expect(JURISDICTIONS.map((j) => j.code)).toContain("DC");
  });
});

describe("dialogue and advisor", () => {
  it("asks the first topic question", () => {
    const s = emptySession();
    s.matter = "divorce";
    const q = nextQuestion(s);
    expect(q?.id).toBe("married");
  });

  it("refuses invented citations", () => {
    const s = emptySession();
    s.jurisdiction = "CA";
    s.matter = "custody";
    const { reply } = advise(s, "Give me the controlling case citation and what the court held.");
    expect(reply.toLowerCase()).toContain("does not invent case citations");
  });

  it("opens with a disclaimer", () => {
    const s = emptySession();
    s.jurisdiction = "OR";
    s.matter = "divorce";
    expect(openingMessage(s)).toMatch(/not a lawyer/i);
  });
});

describe("filing outline", () => {
  it("builds an on-screen caption", () => {
    const s = emptySession();
    s.jurisdiction = "NY";
    s.matter = "divorce";
    s.parties[0].name = "Alex Rivera";
    s.parties[1].name = "Jordan Rivera";
    const outline = buildFilingOutline(s);
    expect(outline.caption).toContain("Alex Rivera");
    expect(outline.caption.toUpperCase()).toContain("SUPREME COURT");
    expect(outline.caption).toContain("STATE OF NEW YORK");
    expect(outline.disclaimer).toMatch(/not legal advice/i);
  });
});

describe("evidence and learning", () => {
  it("maps paystub text to income", () => {
    const maps = mapEvidence(
      [
        {
          id: "1",
          name: "paystub.txt",
          mime: "text/plain",
          size: 20,
          addedAt: new Date().toISOString(),
          text: "Employee paystub wages overtime",
          note: "",
        },
      ],
      "child-support",
    );
    expect(maps.some((m) => m.issueId === "income")).toBe(true);
  });

  it("flags safety language in-session only", () => {
    const learned = learnFromText(
      { keywords: [], priorities: [], safetyFlag: false, contested: null, notes: [] },
      "I am afraid after a threat and need a protection order",
    );
    expect(learned.safetyFlag).toBe(true);
  });
});
