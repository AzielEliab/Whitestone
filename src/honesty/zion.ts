/**
 * ZionPattern solver port (zsolver-class). Nine ontology nodes + hard 75% cap.
 * Cite: https://github.com/AzielEliab/zion-pattern-solver
 * Does not solve cases. 75 = complete confidence suppression was intentional;
 * lower = more natural occurrence. Provisional and assistive only.
 * Author: Aziel Eliab. Apache-2.0.
 */
import { clip, tokenize } from "./tokens";

export const ZION_SPEC = "https://github.com/AzielEliab/zion-pattern-solver";
export const CONFIDENCE_CAP = 0.75;
export const UNCERTAINTY_FLOOR = 0.25;
export const ZION_LIMITATION =
  "Nine ontology nodes with a hard 75% cap / 25% floor. THIS IS NOT a case solver or court verdict. Provisional and assistive only. Does not solve Zioncheck or any case. Confidence is not truth.";

export type ZionPriority = "critical" | "high" | "medium";
export type ZionAnswer = "yes" | "no" | "unknown";

export interface ZionPattern {
  id: string;
  name: string;
  priority: ZionPriority;
  heuristic: string;
  cues: readonly string[];
}

export const ZION_PATTERNS: readonly ZionPattern[] = [
  {
    id: "P1",
    name: "Kinematic & Timeline Impossibility",
    priority: "critical",
    heuristic: "Flag when two or more public clocks or routes cannot be true at once.",
    cues: ["timeline", "clock", "hours", "minutes", "window", "impossible", "gap", "sequence", "kinematic"],
  },
  {
    id: "P2",
    name: "Document Provenance & Integrity",
    priority: "critical",
    heuristic: "Flag incomplete custody, later insertion, or physical alteration indicators.",
    cues: ["custody", "provenance", "stationery", "overwrite", "emboss", "finding aid", "altered", "note"],
  },
  {
    id: "P3",
    name: "Witness & Archival Void",
    priority: "high",
    heuristic: "Flag unnamed figures, missing blotters, and summaries that replace primary lists.",
    cues: ["unnamed", "missing blotter", "no witness", "archive", "delayed", "second-hand", "summary only"],
  },
  {
    id: "P4",
    name: "Geographic / Location Manipulation",
    priority: "medium",
    heuristic: "Flag floor/window/route mismatches and itineraries that skip required travel time.",
    cues: ["floor", "route", "itinerary", "building", "location", "travel", "directory"],
  },
  {
    id: "P5",
    name: "Pre-Event Discrediting & Suppression",
    priority: "high",
    heuristic: "Flag incapacity narratives that lock in before scene measurements exist.",
    cues: ["unfit", "psychiatric", "crazy", "expunged", "not printed", "discredit", "incapacity"],
  },
  {
    id: "P6",
    name: "Political / Motive Contextual",
    priority: "medium",
    heuristic: "Flag official summaries that strip documented political conflict. Context is not proof.",
    cues: ["political", "motive", "machine", "conflict", "omitted", "one-line cause"],
  },
  {
    id: "P7",
    name: "Secondary Encoded Testimony",
    priority: "critical",
    heuristic: "Require a citable public artifact. Treat interpretation as provisional.",
    cues: ["encoded", "artwork", "exhibition", "memoir", "catalog", "testimony"],
  },
  {
    id: "P8",
    name: "Rapid Narrative Lock",
    priority: "high",
    heuristic: "Flag same-day cause lock plus copy-forward across editions.",
    cues: ["same-day", "wire", "locked", "suicide", "first edition", "copy-forward", "hours"],
  },
  {
    id: "P9",
    name: "Forensic / Physical Evidence Gap",
    priority: "high",
    heuristic: "Flag missing measurements, missing examiner name, or custody that jumps to narrative.",
    cues: ["no measurement", "coroner", "forensic", "chain of custody", "examiner", "geometry", "missing file"],
  },
];

const PRIORITY_WEIGHT: Record<ZionPriority, number> = {
  critical: 1,
  high: 0.7,
  medium: 0.4,
};

const INTENTIONAL = new Set(["P5", "P6", "P8"]);

export function capConfidence(raw: number): number {
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.min(raw, CONFIDENCE_CAP);
}

export function displayScore(capped: number): number {
  const value = capConfidence(capped);
  if (value <= 0) return 0;
  return Math.min(75, Math.max(1, Math.round(value * 100)));
}

export interface ZionNodeAnswer {
  pattern_id: string;
  value: ZionAnswer;
  cue_hits: number;
}

export interface ZionScores {
  official_contradiction: number;
  alternative_coherence: number;
  raw_confidence: number;
  capped_confidence: number;
  display: number;
  answers: ZionNodeAnswer[];
  limitation: string;
  spec: string;
  advisory: true;
  solves_case: false;
}

function answerNode(pattern: ZionPattern, blob: string): ZionNodeAnswer {
  const low = blob.toLowerCase();
  let hits = 0;
  for (const cue of pattern.cues) {
    if (low.includes(cue)) hits += 1;
  }
  const tokens = tokenize(blob);
  if (tokens.size < 8) return { pattern_id: pattern.id, value: "unknown", cue_hits: hits };
  if (hits >= 2) return { pattern_id: pattern.id, value: "yes", cue_hits: hits };
  if (hits === 1) return { pattern_id: pattern.id, value: "unknown", cue_hits: hits };
  return { pattern_id: pattern.id, value: "no", cue_hits: 0 };
}

export function scoreZionPattern(text: string): ZionScores {
  const answers = ZION_PATTERNS.map((p) => answerNode(p, text));
  let ocNum = 0;
  let ocDen = 0;
  let acNum = 0;
  let acDen = 0;
  for (const ans of answers) {
    const pat = ZION_PATTERNS.find((p) => p.id === ans.pattern_id)!;
    const w = PRIORITY_WEIGHT[pat.priority];
    const crit = pat.priority === "critical" ? 1.35 : 1;
    if (ans.value === "yes") {
      ocNum += w;
      ocDen += w;
      acNum += w * crit;
      acDen += w * crit;
    } else {
      ocDen += w;
      acDen += w * crit;
    }
  }
  const oc = ocDen ? ocNum / ocDen : 0;
  const ac = acDen ? acNum / acDen : 0;
  const yesIntent = answers.filter((a) => INTENTIONAL.has(a.pattern_id) && a.value === "yes").length;
  const anyYes = answers.some((a) => a.value === "yes");
  let intent = 0;
  if (yesIntent) intent = Math.min(1, 0.35 + 0.325 * yesIntent);
  else if (anyYes) intent = 0.35;
  const raw = clip((0.55 * oc + 0.45 * ac) * intent);
  const capped = capConfidence(raw);
  return {
    official_contradiction: oc,
    alternative_coherence: ac,
    raw_confidence: raw,
    capped_confidence: capped,
    display: displayScore(capped),
    answers,
    limitation: ZION_LIMITATION,
    spec: ZION_SPEC,
    advisory: true,
    solves_case: false,
  };
}
