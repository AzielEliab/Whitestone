/**
 * Aziel triad compositing: SPRE + CLCE + PhysLing (aziel.triad.v0.3).
 * Cite: https://github.com/AzielEliab/az-clce/blob/main/docs/triad.md
 * final.score is the mean only when all three verified; else null.
 * Author: Aziel Eliab. Apache-2.0.
 */
import type { ClceReport } from "./clce";
import type { PhysLingReport } from "./physling";
import type { SpreReport } from "./spre";
import { clip01, score100 } from "./tokens";

export const SCHEMA_TRIAD = "aziel.triad.v0.3";
export const SCHEMA_COMPONENT = "aziel.triad.component.v0.3";
export const VERIFIERS = ["spre", "clce", "physling"] as const;

export interface TriadComponent {
  schema: typeof SCHEMA_COMPONENT;
  id: "spre" | "clce" | "physling";
  home: string;
  verified: boolean;
  score: number | null;
  score_100: number | null;
  unit: "unit_interval";
  polarity: "higher_is_stronger_verification";
  raw: Record<string, unknown>;
  note: string;
}

export interface TriadBundle {
  schema: typeof SCHEMA_TRIAD;
  author: "Aziel Eliab";
  verifiers: typeof VERIFIERS;
  physling_home: "aziel-corpus";
  combine_when: "all_three_verified";
  formula: string;
  components: { spre: TriadComponent; clce: TriadComponent; physling: TriadComponent };
  final: {
    score: number | null;
    score_100: number | null;
    verified_count: number;
    verified: string[];
    ready: boolean;
    note: string;
  };
  limitation: string;
  advisory: true;
  asserts_guilt: false;
}

function base(
  id: TriadComponent["id"],
  home: string,
  verified: boolean,
  score: number | null,
  note: string,
  raw: Record<string, unknown>,
): TriadComponent {
  const unit = verified ? clip01(score) : null;
  return {
    schema: SCHEMA_COMPONENT,
    id,
    home,
    verified: Boolean(verified && unit != null),
    score: unit,
    score_100: score100(unit),
    unit: "unit_interval",
    polarity: "higher_is_stronger_verification",
    raw,
    note,
  };
}

export function clceComponent(report: ClceReport): TriadComponent {
  return base(
    "clce",
    "az-clce",
    true,
    report.triple,
    "CLCE triple on [0, 1]. Higher = more cross-layer consistency. Type D is a label, not malice.",
    { triple: report.triple, plus: report.plus, pairwise_avg: report.pairwise_avg, band: report.band },
  );
}

export function spreComponent(report: SpreReport): TriadComponent {
  return base(
    "spre",
    "az-clce",
    true,
    1 - report.pc,
    "Merge score is 1−PC on [0, 1]. Raw PC is suppression-pattern confidence. Not guilt.",
    {
      pc: report.pc,
      ssi: report.ssi,
      e: report.sp.e,
      flags: report.flags,
      pc_is_suppression_confidence: true,
      merge_score: "1 - pc",
    },
  );
}

export function assembleTriad(parts: {
  clce: TriadComponent;
  spre: TriadComponent;
  physling: PhysLingReport | TriadComponent;
}): TriadBundle {
  const physling: TriadComponent =
    parts.physling.id === "physling"
      ? {
          schema: SCHEMA_COMPONENT,
          id: "physling",
          home: parts.physling.home,
          verified: parts.physling.verified,
          score: parts.physling.score,
          score_100: parts.physling.score_100,
          unit: "unit_interval",
          polarity: "higher_is_stronger_verification",
          raw: parts.physling.raw,
          note: parts.physling.note,
        }
      : parts.physling;
  const components = { spre: parts.spre, clce: parts.clce, physling };
  const verified = VERIFIERS.filter((k) => components[k].verified && components[k].score != null);
  const ready = verified.length === 3;
  let finalScore: number | null = null;
  if (ready) {
    finalScore = clip01((Number(parts.spre.score) + Number(parts.clce.score) + Number(physling.score)) / 3);
  }
  return {
    schema: SCHEMA_TRIAD,
    author: "Aziel Eliab",
    verifiers: VERIFIERS,
    physling_home: "aziel-corpus",
    combine_when: "all_three_verified",
    formula: "final.score = (spre.score + clce.score + physling.score) / 3 when all three verified; else null",
    components,
    final: {
      score: finalScore,
      score_100: score100(finalScore),
      verified_count: verified.length,
      verified: [...verified],
      ready,
      note: "aziel-corpus / PhysLing fills the physling slot. Combined final is computed only when all three have verified. Confidence is not truth.",
    },
    limitation:
      "Triad components are advisory. CLCE detects inconsistency, not intent. Type D is a label, not malice. SPRE never asserts guilt. PhysLing lives in aziel-corpus. Official narrative is not evidence. Author: Aziel Eliab.",
    advisory: true,
    asserts_guilt: false,
  };
}
