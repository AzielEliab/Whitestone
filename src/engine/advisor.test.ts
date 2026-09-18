import { describe, expect, it } from "vitest";
import { retrieveGuidance } from "../knowledge";
import { emptySession } from "../types";
import { advise, openingMessage } from "./advisor";
import { nextQuestion } from "./dialogue";
import { mapEvidence } from "./evidence-map";
import { sessionSnapshot } from "./facts";
import { buildFilingOutline } from "./filing";
import { routeIntent } from "./intent";
import { learnFromText } from "./learn";
import { detectContradictions, reasonAbout } from "./reason";

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
    s.practiceArea = "divorce";
    s.matter = "divorce";
    expect(openingMessage(s)).toMatch(/not a lawyer/i);
    expect(openingMessage(s)).toMatch(/allowlisted public/i);
    expect(openingMessage(s)).toMatch(/Divorce/i);
  });

  it("refuses criminal-misuse questions and keeps process questions", () => {
    const s = emptySession();
    s.practiceArea = "criminal";
    s.jurisdiction = "CA";
    s.matter = "rights-education";
    const blocked = advise(s, "How do I destroy the evidence before court?");
    expect(blocked.reply).toMatch(/will not help/i);
    const ok = advise(s, "What usually happens at arraignment?");
    expect(ok.reply).not.toMatch(/will not help commit/i);
    expect(ok.reply).toMatch(/lawyer|public defender|arraignment/i);
  });

  it("does not retrieve divorce custody modules in a criminal session", () => {
    const hits = retrieveGuidance({
      query: "child custody worksheet",
      jurisdiction: "TX",
      matter: "bail-arraignment",
      practiceArea: "criminal",
    });
    expect(hits.some((h) => h.topicId === "custody" || h.topicId === "divorce")).toBe(false);
    expect(hits.some((h) => h.topicId === "bail-arraignment" || /criminal|counsel|arraign/i.test(h.title + h.body))).toBe(
      true,
    );
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

  it("routes intents and personalizes replies with party names", () => {
    const s = emptySession();
    s.practiceArea = "divorce";
    s.jurisdiction = "TX";
    s.matter = "child-support";
    s.parties[0].name = "Alex Rivera";
    s.parties[1].name = "Jordan Rivera";
    s.answers["incomes-known"] = "Only mine";
    expect(routeIntent("What should I do next?", s)).toBe("next");
    expect(routeIntent("what do the numbers say about plea rates", s)).toBe("stats");
    expect(sessionSnapshot(s).filingName).toBe("Alex Rivera");
    const { reply, followUps, grounding } = advise(s, "What should I do next?");
    expect(reply).toMatch(/Alex Rivera/);
    expect(reply).toMatch(/Texas|TX/i);
    expect(reply).toMatch(/child support/i);
    expect(followUps.length).toBeGreaterThan(0);
    expect(grounding.verdict).toMatch(/PASS|FLAG/);
  });

  it("parses natural-language math inside advise and labels it", () => {
    const s = emptySession();
    s.practiceArea = "criminal";
    s.jurisdiction = "CA";
    s.matter = "bail-arraignment";
    const { reply, intent } = advise(s, "what's 10% of $5000 bail");
    expect(intent).toBe("math");
    expect(reply).toMatch(/\$500\.00/);
    expect(reply).toMatch(/HEURISTIC/);
  });

  it("returns cited statistics without inventing a figure", () => {
    const s = emptySession();
    s.practiceArea = "criminal";
    s.jurisdiction = "CA";
    s.matter = "plea";
    const { reply } = advise(s, "what do the numbers say about plea rates");
    expect(reply).toMatch(/bjs\.ojp\.gov/);
    expect(reply).toMatch(/not a prediction/i);
    expect(reply).not.toMatch(/99\.7% of Oregon/);
  });

  it("builds IRAC-style reasoning from session facts and spots contradictions", () => {
    const s = emptySession();
    s.practiceArea = "divorce";
    s.jurisdiction = "OR";
    s.matter = "divorce";
    s.parties[0].name = "Alex Rivera";
    s.answers.agree = "Mostly agreed";
    s.answers.kids = "Yes";
    s.learned.contested = true;
    const packet = reasonAbout(s, "reason");
    expect(packet.irac[0]?.application).toMatch(/Alex Rivera/);
    expect(detectContradictions(s).length).toBeGreaterThan(0);
    const { reply } = advise(s, "Walk me through the issues using my facts");
    expect(reply).toMatch(/Issue:/);
    expect(reply).toMatch(/Application to YOUR facts/);
    expect(reply).toMatch(/clarify/i);
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
