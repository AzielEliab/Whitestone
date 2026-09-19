/**
 * PhysLing slot — home is aziel-corpus (aziel.triad.v0.3).
 * Whitestone does not vendor the full corpus PhysLing engine.
 * This lite fills the [0, 1] slot only when session materials include
 * dated independent physical / measurement language. Otherwise unverified.
 * Cite: https://github.com/AzielEliab/az-clce/blob/main/docs/triad.md
 *       https://github.com/AzielEliab/aziel-corpus
 * Confidence is not truth. Author: Aziel Eliab. Apache-2.0.
 */
import { clip, tokenize } from "./tokens";

export const PHYSLING_HOME = "aziel-corpus";
export const PHYSLING_SPEC = "https://github.com/AzielEliab/az-clce/blob/main/docs/triad.md";
export const PHYSLING_LIMITATION =
  "PhysLing lives in aziel-corpus. Whitestone fills a labeled lite slot only when dated independent physical language is present in this session. Unverified stays UNKNOWN. Not a lab instrument. Not a verdict.";

const PHYSICAL_LEXICON = new Set([
  "measure",
  "measurement",
  "measured",
  "height",
  "width",
  "length",
  "angle",
  "velocity",
  "distance",
  "geometry",
  "window",
  "sill",
  "lab",
  "laboratory",
  "chemistry",
  "autopsy",
  "forensic",
  "wound",
  "trajectory",
  "kinematics",
  "physics",
  "physical",
  "lead",
  "corrosion",
  "temperature",
  "meter",
  "metre",
  "kilogram",
  "gram",
  "inch",
  "feet",
  "foot",
  "mph",
  "independent",
  "sample",
  "samples",
  "test",
  "tests",
]);

export interface PhysLingReport {
  schema: "aziel.triad.component.v0.3";
  id: "physling";
  home: typeof PHYSLING_HOME;
  spec: string;
  verified: boolean;
  score: number | null;
  score_100: number | null;
  unit: "unit_interval";
  polarity: "higher_is_stronger_verification";
  raw: {
    physical_token_hits: number;
    token_count: number;
    dated: boolean;
    independent: boolean;
    lite: true;
    full_engine_vendored: false;
  };
  note: string;
  limitation: string;
}

export function scorePhysLing(opts: {
  physicsText: string;
  dated: boolean;
  independent: boolean;
}): PhysLingReport {
  const text = (opts.physicsText || "").trim();
  const tokens = tokenize(text);
  let hits = 0;
  for (const tok of tokens) if (PHYSICAL_LEXICON.has(tok)) hits += 1;
  const coverage = tokens.size ? clip(hits / Math.min(tokens.size, 40)) : 0;
  const canVerify = Boolean(text) && opts.dated && opts.independent && hits >= 2;
  if (!canVerify) {
    return {
      schema: "aziel.triad.component.v0.3",
      id: "physling",
      home: PHYSLING_HOME,
      spec: PHYSLING_SPEC,
      verified: false,
      score: null,
      score_100: null,
      unit: "unit_interval",
      polarity: "higher_is_stronger_verification",
      raw: {
        physical_token_hits: hits,
        token_count: tokens.size,
        dated: opts.dated,
        independent: opts.independent,
        lite: true,
        full_engine_vendored: false,
      },
      note: "PhysLing lives in aziel-corpus. Empty/unverified slot — Whitestone will not invent a physical-language score without dated independent physics text.",
      limitation: PHYSLING_LIMITATION,
    };
  }
  const datedBonus = 0.25;
  const independentBonus = 0.25;
  const score = clip(0.5 * coverage + datedBonus + independentBonus);
  return {
    schema: "aziel.triad.component.v0.3",
    id: "physling",
    home: PHYSLING_HOME,
    spec: PHYSLING_SPEC,
    verified: true,
    score,
    score_100: Number((score * 100).toFixed(4)),
    unit: "unit_interval",
    polarity: "higher_is_stronger_verification",
    raw: {
      physical_token_hits: hits,
      token_count: tokens.size,
      dated: opts.dated,
      independent: opts.independent,
      lite: true,
      full_engine_vendored: false,
    },
    note: "Labeled PhysLing-lite from dated independent physical language in this session. Home remains aziel-corpus. Score is verification coverage, not truth.",
    limitation: PHYSLING_LIMITATION,
  };
}
