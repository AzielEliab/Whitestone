import { describe, expect, it } from "vitest";
import { emptySession } from "../types";
import { scoreClce } from "./clce";
import { evaluateHonesty, honestyFromSession } from "./evaluate";
import { formatHonestyBlock } from "./format";
import { buildLattice } from "./lattice";
import { scorePhysLing } from "./physling";
import { scoreSpre, TRAINING_CASES } from "./spre";
import { assembleTriad, clceComponent, spreComponent } from "./triad";
import { buildHonestyLegs, scoreTriad } from "./triadscore";
import { capConfidence, scoreZionPattern } from "./zion";

function upload(
  id: string,
  kind: "filing" | "evidence" | "historical_report" | "news_clipping",
  text: string,
  sourceDate: string | null = null,
) {
  return {
    id,
    name: `${id}.txt`,
    mime: "text/plain",
    size: text.length,
    addedAt: "2026-09-19T00:00:00.000Z",
    text,
    note: "",
    kind,
    sourceDate,
  };
}

describe("AZ-CLCE port", () => {
  it("scores a matching triple as acceptable/perfect and labels Type D only", () => {
    const match = scoreClce("safe water lead test", "safe water lead test", "safe water lead test");
    expect(match.triple).toBeGreaterThanOrEqual(0.7);
    expect(match.band).toMatch(/perfect|acceptable/);
    const diverge = scoreClce(
      "official says the water is perfectly safe",
      "official says the water is perfectly safe",
      "independent lab chemistry found lead far above the limit",
      "missing early failing tests shredded",
    );
    expect(diverge.triple).toBeLessThan(0.7);
    expect(diverge.types.includes("D") ? diverge.type_notes.D : "").not.toMatch(/malice finding/);
    expect(diverge.limitation).toMatch(/not intent/);
  });
});

describe("SPRE port", () => {
  it("stays quiet on short official-only text and never treats official as evidence", () => {
    const quiet = scoreSpre({ official: "The office closed the file.", notes: "ok" });
    expect(quiet.asserts_guilt).toBe(false);
    expect(quiet.official_narrative_is_evidence).toBe(false);
    expect(quiet.pc).toBeLessThan(0.4);
  });

  it("scores the Flint training shape without identifying a new case", () => {
    const flint = TRAINING_CASES.find((c) => c.id === "flint-water")!;
    const report = scoreSpre(flint as unknown as Record<string, unknown>);
    expect(report.sp.p1).toBeGreaterThan(0.3);
    expect(report.nearest_training.id).toBe("flint-water");
    expect(report.plain).toMatch(/not a verdict/i);
  });
});

describe("PhysLing slot", () => {
  it("stays unverified without dated independent physics", () => {
    const empty = scorePhysLing({ physicsText: "", dated: false, independent: false });
    expect(empty.verified).toBe(false);
    expect(empty.score).toBeNull();
    expect(empty.home).toBe("aziel-corpus");
  });

  it("verifies only with dated independent physical language", () => {
    const ok = scorePhysLing({
      physicsText: "Independent lab chemistry measured lead corrosion in resident samples.",
      dated: true,
      independent: true,
    });
    expect(ok.verified).toBe(true);
    expect(ok.score).toBeGreaterThan(0);
    expect(ok.raw.full_engine_vendored).toBe(false);
  });
});

describe("triad + triadscore", () => {
  it("keeps final null until PhysLing verifies", () => {
    const clce = scoreClce("a b c", "a b c", "a b c");
    const spre = scoreSpre({ official: "a story", notes: "thin" });
    const phy = scorePhysLing({ physicsText: "", dated: false, independent: false });
    const triad = assembleTriad({ clce: clceComponent(clce), spre: spreComponent(spre), physling: phy });
    expect(triad.final.ready).toBe(false);
    expect(triad.final.score).toBeNull();
  });

  it("emits a posterior only when 3 of 4 legs are decided; UNKNOWN does not update", () => {
    const short = scoreTriad(buildHonestyLegs({ datedSources: 0, independentItems: 0, clceDecided: false, contemporaneous: false }));
    expect(short.triad_ok).toBe(false);
    expect(short.posterior_mean).toBeNull();
    expect(short.unknowns).toBe(4);
    const ready = scoreTriad(
      buildHonestyLegs({ datedSources: 2, independentItems: 1, clceDecided: true, contemporaneous: true }),
    );
    expect(ready.triad_ok).toBe(true);
    expect(ready.posterior_mean).not.toBeNull();
    expect(ready.limitation).toMatch(/not truth/);
  });
});

describe("ZionPattern cap", () => {
  it("never displays above 75 and does not solve a case", () => {
    expect(capConfidence(0.99)).toBe(0.75);
    const z = scoreZionPattern(
      "same-day wire locked a suicide line; missing blotter unnamed witness; no measurement coroner file; psychiatric unfit before forensic geometry",
    );
    expect(z.display).toBeLessThanOrEqual(75);
    expect(z.solves_case).toBe(false);
    expect(z.capped_confidence).toBeLessThanOrEqual(0.75);
  });
});

describe("hashchain lattice", () => {
  it("chains session hashes and labels similarity with sources", () => {
    const lat = buildLattice([
      { id: "a", kind: "news_clipping", label: "clip", text: "Independent lab chemistry found lead", sourceDate: "2016-01-15", source: "upload:news_clipping" },
      { id: "b", kind: "evidence", label: "lab", text: "Independent lab chemistry found lead", sourceDate: "2016-01-15", source: "upload:evidence" },
    ]);
    expect(lat.nodes).toHaveLength(2);
    expect(lat.nodes[1].prev).toBe(lat.nodes[0].sha256);
    expect(lat.tip).toBe(lat.nodes[1].sha256);
    expect(lat.durable_worker_memory).toBe(false);
    expect(lat.matches.some((m) => m.label === "identical-hash")).toBe(true);
  });
});

describe("anti-corruption honesty", () => {
  it("returns UNKNOWN without dated independent sources and does not invent buried truth", () => {
    const evaln = evaluateHonesty({
      official: "The office says the matter is closed and the official result stands.",
      statedOutcome: "Official result: closed, no further inquiry.",
      uploads: [],
    });
    expect(evaln.sufficient).toBe(false);
    expect(evaln.truth_buried.status).toBe("UNKNOWN");
    expect(evaln.truth_overcame_lie.status).toBe("UNKNOWN");
    expect(evaln.honesty_overall.status).toBe("UNKNOWN");
    expect(evaln.nolie).toMatch(/will not invent/);
    expect(formatHonestyBlock(evaln)).toMatch(/UNKNOWN/);
    expect(formatHonestyBlock(evaln)).toMatch(/not a lawyer/i);
  });

  it("labels truth_buried only with dated independent uploads that contradict the official line", () => {
    const evaln = evaluateHonesty({
      official: "The office says the switched water is safe to drink and the inquiry is closed.",
      statedOutcome: "Official result: water safe, complaint denied.",
      archival: "Residents reported rashes in 2015 while the city issued an all-clear.",
      asOfIso: "2015-06",
      uploads: [
        upload(
          "clip",
          "news_clipping",
          "September 2015 independent university water tests found lead far above the official safety claim. Resident contemporaneous samples contradicted the city line.",
          "2015-09-12",
        ),
        upload(
          "lab",
          "evidence",
          "Independent lab chemistry measured lead and corrosion. Official narrative of safe water does not match the samples.",
          "2015-09-14",
        ),
        upload("order", "filing", "City order: the switched water is safe to drink and the matter is closed.", "2015-06-01"),
      ],
    });
    expect(evaln.sufficient).toBe(true);
    expect(evaln.truth_buried.status).toBe("LABELED");
    expect(evaln.truth_buried.value).toBeGreaterThan(0);
    expect(evaln.honesty_overall.status).toBe("LABELED");
    expect(evaln.honesty_overall.value ?? 1).toBeLessThanOrEqual(0.75);
    expect(evaln.evidence.length).toBeGreaterThan(2);
    expect(evaln.engines.spre.asserts_guilt).toBe(false);
    expect(formatHonestyBlock(evaln)).toMatch(/truth_buried/);
    expect(formatHonestyBlock(evaln)).toMatch(/LABELED/);
  });

  it("labels truth_overcame_lie when a later dated independent source contradicts the earlier official line", () => {
    const evaln = evaluateHonesty({
      official: "January 2015 bulletin: the water is safe and residents are hysterical.",
      statedOutcome: "Official 2015 result: water safe.",
      asOfIso: "2015-01",
      uploads: [
        upload("bulletin", "filing", "January 2015 bulletin: the water is safe and residents are hysterical.", "2015-01-10"),
        upload(
          "later",
          "historical_report",
          "October 2016 inquiry: independent university tests measured lead; the official safe-water line was false.",
          "2016-10-20",
        ),
        upload(
          "clip",
          "news_clipping",
          "October 2016 press: later independent chemistry found lead far above the official safety claim.",
          "2016-10-21",
        ),
      ],
    });
    expect(evaln.truth_overcame_lie.status).toBe("LABELED");
    expect(evaln.truth_overcame_lie.value).toBeGreaterThan(0);
  });

  it("reads session facts and uploads through honestyFromSession", () => {
    const s = emptySession();
    s.facts.stated_outcome = "Official: closed.";
    s.facts.official_narrative = "Official: closed.";
    s.asOfYear = 1925;
    s.asOfMonth = 6;
    s.uploads = [upload("a", "news_clipping", "June 1925 clipping notes a contemporaneous docket gap.", "1925-06-15")];
    const evaln = honestyFromSession(s);
    expect(evaln.schema).toBe("whitestone.honesty.v1");
    expect(evaln.engines.lattice.nodes.length).toBeGreaterThan(0);
  });
});
