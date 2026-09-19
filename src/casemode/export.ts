/**
 * Case Mode whistleblower / archivist export: receipt + hash chain + score card.
 * Operator override: export IS allowed in Case Mode only. Author: Aziel Eliab.
 */
import { sha256Hex } from "../guard/hash";
import type { CaseModeEvaluation } from "./evaluate";

export interface CaseModeExport {
  schema: "whitestone.casemode.export.v1";
  exportedAt: string;
  educational: true;
  confidence_cap: 0.75;
  receipt: { sha256: string };
  lattice: CaseModeEvaluation["honesty"]["engines"]["lattice"];
  scores: {
    truth_upheld: CaseModeEvaluation["truth_upheld"];
    narrative_suppression: CaseModeEvaluation["narrative_suppression"];
    systemic_suppression: CaseModeEvaluation["systemic_suppression"];
    personal_professional_suppression: CaseModeEvaluation["personal_professional_suppression"];
    truth_buried: CaseModeEvaluation["honesty"]["truth_buried"];
    truth_overcame_lie: CaseModeEvaluation["honesty"]["truth_overcame_lie"];
    honesty_overall: CaseModeEvaluation["honesty"]["honesty_overall"];
  };
  fivew: CaseModeEvaluation["fivew"];
  online_verify: CaseModeEvaluation["online_verify"];
  trajectory: CaseModeEvaluation["trajectory"];
  vibelock: CaseModeEvaluation["vibelock"];
  spectrallock: CaseModeEvaluation["spectrallock"];
  evidence: CaseModeEvaluation["honesty"]["evidence"];
  cites: string[];
  nolie: string;
  disclaimer: string;
}

export function buildCaseExport(evaln: CaseModeEvaluation): CaseModeExport {
  const body: Omit<CaseModeExport, "receipt"> = {
    schema: "whitestone.casemode.export.v1",
    exportedAt: new Date().toISOString(),
    educational: true,
    confidence_cap: 0.75,
    lattice: evaln.honesty.engines.lattice,
    scores: {
      truth_upheld: evaln.truth_upheld,
      narrative_suppression: evaln.narrative_suppression,
      systemic_suppression: evaln.systemic_suppression,
      personal_professional_suppression: evaln.personal_professional_suppression,
      truth_buried: evaln.honesty.truth_buried,
      truth_overcame_lie: evaln.honesty.truth_overcame_lie,
      honesty_overall: evaln.honesty.honesty_overall,
    },
    fivew: evaln.fivew,
    online_verify: evaln.online_verify,
    trajectory: evaln.trajectory,
    vibelock: evaln.vibelock,
    spectrallock: evaln.spectrallock,
    evidence: evaln.honesty.evidence,
    cites: evaln.cites,
    nolie: evaln.nolie,
    disclaimer: evaln.disclaimer,
  };
  const receipt = { sha256: sha256Hex(JSON.stringify(body)) };
  return { ...body, receipt };
}

export function exportFilename(iso = new Date().toISOString()): string {
  return `whitestone-casemode-${iso.slice(0, 10)}.json`;
}
