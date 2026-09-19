import { describe, expect, it } from "vitest";
import { emptySession } from "../types";
import { buildCaseExport } from "./export";
import { caseModeFromSession, evaluateCaseMode } from "./evaluate";
import { formatCaseModeBlock } from "./format";
import { scoreTrajectory } from "./trajectory";
import { scoreVibeLock } from "./vibelock";

function upload(id: string, kind: "news_clipping" | "evidence" | "audio", text: string, sourceDate: string) {
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

describe("Case Mode", () => {
  it("stays UNKNOWN without dated independent sources and never exceeds 0.75", () => {
    const ev = evaluateCaseMode({
      official: "Closed.",
      statedOutcome: "Closed.",
      uploads: [],
    });
    expect(ev.truth_upheld.status).toBe("UNKNOWN");
    expect(ev.narrative_suppression.status).toBe("UNKNOWN");
    expect(ev.systemic_suppression.status).toBe("UNKNOWN");
    expect(ev.personal_professional_suppression.status).toBe("UNKNOWN");
    expect(ev.confidence_cap).toBe(0.75);
    expect(ev.fivew.independent_or_behalf.role).toBe("UNKNOWN");
    expect(formatCaseModeBlock(ev)).toMatch(/UNKNOWN/);
    expect(formatCaseModeBlock(ev)).toMatch(/will not invent/);
  });

  it("labels suppression axes when dated independent uploads contradict the official line", () => {
    const ev = evaluateCaseMode({
      official: "The city office says the switched water is safe and the inquiry is closed.",
      statedOutcome: "Official result: water safe, complaint denied.",
      archival: "Residents reported rashes in 2015 while the city issued an all-clear.",
      asOfIso: "2015-06",
      uploads: [
        upload(
          "clip",
          "news_clipping",
          "September 2015 independent university water tests found lead far above the official safety claim. The city department closed the file.",
          "2015-09-12",
        ),
        upload(
          "lab",
          "evidence",
          "Independent lab chemistry measured lead and corrosion. Official narrative of safe water does not match the samples. Career staff who spoke were later fired.",
          "2015-09-14",
        ),
      ],
    });
    expect(ev.sufficient).toBe(true);
    expect(ev.narrative_suppression.status).toBe("LABELED");
    expect(ev.narrative_suppression.value ?? 1).toBeLessThanOrEqual(0.75);
    expect(ev.truth_upheld.value ?? 1).toBeLessThanOrEqual(0.75);
    expect(ev.honesty.truth_buried.status).toBe("LABELED");
    const card = buildCaseExport(ev);
    expect(card.receipt.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(card.lattice.durable_worker_memory).toBe(false);
  });

  it("names independent vs on-behalf-of only when evidenced", () => {
    const ev = evaluateCaseMode({
      official: "Jane Rivera, officer of City Water, said the file is closed.",
      statedOutcome: "Jane Rivera speaking on behalf of City Water closed the inquiry.",
      archival: "Independent civilian witness Mara Chen reported rashes in 2015.",
      asOfIso: "2015-06",
      uploads: [
        upload(
          "clip",
          "news_clipping",
          "Mara Chen, independent civilian witness, contradicted the official all-clear.",
          "2015-09-12",
        ),
      ],
    });
    expect(ev.fivew.independent_or_behalf.role).toBe("on_behalf_of");
    expect(ev.fivew.independent_or_behalf.behalfOf).toMatch(/City Water/i);
    expect(ev.fivew.when).toBe("2015-06");
    expect(ev.fivew.why).toMatch(/hashchained/i);
  });

  it("reads session through caseModeFromSession", () => {
    const s = emptySession();
    s.caseMode = true;
    s.facts.stated_outcome = "Official: closed.";
    const ev = caseModeFromSession(s);
    expect(ev.schema).toBe("whitestone.casemode.v1");
  });
});

describe("TrajectoryLock lite", () => {
  it("does not invent a shooter and stays SLOT/UNKNOWN without a triangle", () => {
    const empty = scoreTrajectory("a short note");
    expect(empty.solves_shooter).toBe(false);
    expect(empty.asserts_guilt).toBe(false);
    expect(empty.line_fit).toBeNull();
    const labeled = scoreTrajectory(
      "The victim wound entry was anterior; impact direction through the window; firing position above the building on video frame notes.",
    );
    expect(labeled.status).toBe("LABELED");
    expect(labeled.line_fit ?? 1).toBeLessThanOrEqual(0.75);
    expect(labeled.shooter_location.named_shooter).toBe(false);
  });
});

describe("VibeLock lite", () => {
  it("SLOTs without audio", () => {
    const r = scoreVibeLock({ audioPresent: false, notes: "paper only" });
    expect(r.status).toBe("SLOT");
    expect(r.score).toBeNull();
  });
});
