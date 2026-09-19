/**
 * AZ-CLCE port (Jaccard R/D/P). Detects inconsistency, not intent.
 * Cite: https://github.com/AzielEliab/az-clce — Worker engine.js 0.3.0
 * Type D is a label only. Threshold 0.7 is the paper's acceptable line, not truth.
 * Author: Aziel Eliab. Apache-2.0.
 */
import { checkField, clip, jaccard, tokenize } from "./tokens";

export const CLCE_THRESHOLD = 0.7;
export const CLCE_VERY_LOW = 0.3;
export const CLCE_HIGH_N_RATIO = 0.5;
export const CLCE_VERSION = "0.3.0";
export const CLCE_SPEC = "https://github.com/AzielEliab/az-clce";

export const TYPE_LABELS = {
  A: "Surface Error",
  B: "Functional Error",
  C: "Structural Gap",
  D: "Intentional Obfuscation (label only)",
} as const;

export const TYPE_NOTES = {
  A: "R↔D is low while D↔P and R↔P are higher: docs/UI disagree; function is closer to one layer.",
  B: "R↔D is high while D↔P or R↔P is low: pretty alignment, function diverges.",
  C: "High |N| relative to the union, or all pairwise mediocre and the triple score is below 0.7.",
  D: "LABEL ONLY. High N and D↔P very low and R↔D high: representation matches description while reality and missing-elements diverge. CLCE detects inconsistency, not intent. This is not a finding of malice.",
} as const;

export const CLCE_LIMITATION =
  "CLCE detects inconsistency, not intent. Type D is a label, not a finding of malice. Human validation required. Advisory scores only. Threshold 0.7 is the paper's acceptable line, not a pass/fail of truth. Confidence is not truth.";

export type ClceBand = "perfect" | "acceptable" | "structural_inconsistency";
export type ClceType = "A" | "B" | "C" | "D";

export interface ClceReport {
  schema: "az-clce.report.v0.3";
  version: string;
  spec: string;
  r: string;
  d: string;
  p: string;
  n: string;
  triple: number;
  pairwise: { rd: number; dp: number; rp: number };
  pairwise_avg: number;
  plus: number;
  n_ratio: number;
  band: ClceBand;
  types: ClceType[];
  primary: ClceType | null;
  type_labels: Partial<Record<ClceType, string>>;
  type_notes: Partial<Record<ClceType, string>>;
  limitation: string;
  threshold: number;
  advisory: true;
}

function band(triple: number): ClceBand {
  if (triple >= 1.0 - 1e-12) return "perfect";
  if (triple >= CLCE_THRESHOLD) return "acceptable";
  return "structural_inconsistency";
}

function plusScore(interTriple: number, unionSize: number, nSize: number): number {
  const denom = unionSize + nSize;
  if (denom === 0) return 1;
  return interTriple / denom;
}

function matchingTypes(rd: number, dp: number, rp: number, triple: number, ratio: number): ClceType[] {
  const highN = ratio >= CLCE_HIGH_N_RATIO;
  const matched: ClceType[] = [];
  if (highN && dp < CLCE_VERY_LOW && rd >= CLCE_THRESHOLD) matched.push("D");
  const allMediocre = rd < CLCE_THRESHOLD && dp < CLCE_THRESHOLD && rp < CLCE_THRESHOLD;
  if (highN || (allMediocre && triple < CLCE_THRESHOLD)) matched.push("C");
  if (rd >= CLCE_THRESHOLD && (dp < CLCE_THRESHOLD || rp < CLCE_THRESHOLD)) matched.push("B");
  if (rd < CLCE_THRESHOLD && dp > rd && rp > rd) matched.push("A");
  return matched;
}

export function scoreClce(r = "", d = "", p = "", n = ""): ClceReport {
  const rText = checkField("r", r);
  const dText = checkField("d", d);
  const pText = checkField("p", p);
  const nText = checkField("n", n);
  const tr = tokenize(rText);
  const td = tokenize(dText);
  const tp = tokenize(pText);
  const tn = tokenize(nText);
  const union = new Set([...tr, ...td, ...tp]);
  const inter = new Set([...tr].filter((x) => td.has(x) && tp.has(x)));
  const triple = clip(jaccard(tr, td, tp));
  const rd = clip(jaccard(tr, td));
  const dp = clip(jaccard(td, tp));
  const rp = clip(jaccard(tr, tp));
  const avg = (rd + dp + rp) / 3;
  const plus = plusScore(inter.size, union.size, tn.size);
  const ratio = tn.size / Math.max(union.size, 1);
  const types = matchingTypes(rd, dp, rp, triple, ratio);
  const type_labels: Partial<Record<ClceType, string>> = {};
  const type_notes: Partial<Record<ClceType, string>> = {};
  for (const code of types) {
    type_labels[code] = TYPE_LABELS[code];
    type_notes[code] = TYPE_NOTES[code];
  }
  return {
    schema: "az-clce.report.v0.3",
    version: CLCE_VERSION,
    spec: CLCE_SPEC,
    r: rText,
    d: dText,
    p: pText,
    n: nText,
    triple,
    pairwise: { rd, dp, rp },
    pairwise_avg: avg,
    plus,
    n_ratio: ratio,
    band: band(triple),
    types,
    primary: types[0] ?? null,
    type_labels,
    type_notes,
    limitation: CLCE_LIMITATION,
    threshold: CLCE_THRESHOLD,
    advisory: true,
  };
}
