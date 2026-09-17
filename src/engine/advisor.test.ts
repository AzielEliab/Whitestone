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
    expect(openingMessage(s)).toMatch(/allowlisted public/i);
  });

  it("cites retrieved web sources and does not invent them", () => {
    const s = emptySession();
    s.jurisdiction = "CA";
    s.matter = "divorce";
    const { reply } = advise(s, "What is the current divorce packet?", {
      ok: true,
      capability: "allowlisted-public-pages",
      sources: [
        {
          title: "California Courts Self-Help — Divorce",
          url: "https://selfhelp.courts.ca.gov/divorce",
          excerpt: "Ask the clerk for the current forms.",
          retrievedAt: "2026-09-17T00:00:00.000Z",
          kind: "state-judiciary",
          label: "Court / self-help portal",
        },
      ],
      notes: "Excerpts are copied from the retrieved page.",
      unavailable: false,
      failed: [],
      fetched: 1,
      cached: 0,
    });
    expect(reply).toMatch(/From the web/i);
    expect(reply).toContain("https://selfhelp.courts.ca.gov/divorce");
    expect(reply).toContain("2026-09-17");
    expect(reply).toMatch(/Ask the clerk for the current forms/);
    expect(reply).not.toMatch(/123 U\.S\. 456/);
  });

  it("says so when a live lookup fails and stays on the local layer", () => {
    const s = emptySession();
    s.jurisdiction = "TX";
    s.matter = "child-support";
    const { reply } = advise(s, "current child support worksheet", {
      ok: false,
      capability: "allowlisted-public-pages",
      sources: [],
      notes: "",
      unavailable: false,
      failed: [{ url: "https://www.txcourts.gov/", reason: "fetch-failed" }],
      fetched: 0,
      cached: 0,
    });
    expect(reply).toMatch(/did not complete/i);
    expect(reply).toMatch(/bundled knowledge layer/i);
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
