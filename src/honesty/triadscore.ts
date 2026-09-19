/**
 * AKM-TRIAD-style triadscore (ported pattern, not fabric memory).
 * Cite: AKM-TRIAD-1.0 — deterministic 3-of-4 triad + Bayesian posterior.
 * Posterior is a labeled score. Confidence is not truth. UNKNOWN is distinct from MISS. No durable AKM store.
 * Whitestone stays standalone — this is labeled scoring only.
 * Author: Aziel Eliab. Apache-2.0.
 */
import { clip } from "./tokens";

export const TRIADSCORE_SPEC = "AKM-TRIAD-1.0";
export const TRIADSCORE_LIMITATION =
  "AKM-TRIAD-style 3-of-4 + Beta posterior. Belief, not truth. UNKNOWN does not update the posterior. Whitestone does not embed AKM durable memory or FragGate mesh.";

export type TriadLegId = "dated_source" | "independent_evidence" | "layer_consistency" | "temporal";
export type LegState = "HIT" | "MISS" | "UNKNOWN";

export interface TriadLeg {
  id: TriadLegId;
  state: LegState;
  note: string;
}

export interface TriadScore {
  schema: "whitestone.triadscore.v1";
  spec: typeof TRIADSCORE_SPEC;
  legs: TriadLeg[];
  decided: number;
  hits: number;
  misses: number;
  unknowns: number;
  triad_ok: boolean;
  posterior_mean: number | null;
  posterior_alpha: number;
  posterior_beta: number;
  effective_n: number;
  polarity: "posterior_is_belief_not_truth";
  limitation: string;
}

export function scoreTriad(legs: TriadLeg[]): TriadScore {
  const hits = legs.filter((l) => l.state === "HIT").length;
  const misses = legs.filter((l) => l.state === "MISS").length;
  const unknowns = legs.filter((l) => l.state === "UNKNOWN").length;
  const decided = hits + misses;
  const triad_ok = decided >= 3;
  // Beta(1,1) prior. HIT increments α, MISS increments β, UNKNOWN skipped.
  const alpha = 1 + hits;
  const beta = 1 + misses;
  const posterior_mean = triad_ok ? clip(alpha / (alpha + beta)) : null;
  return {
    schema: "whitestone.triadscore.v1",
    spec: TRIADSCORE_SPEC,
    legs,
    decided,
    hits,
    misses,
    unknowns,
    triad_ok,
    posterior_mean,
    posterior_alpha: alpha,
    posterior_beta: beta,
    effective_n: decided,
    polarity: "posterior_is_belief_not_truth",
    limitation: TRIADSCORE_LIMITATION,
  };
}

export function buildHonestyLegs(opts: {
  datedSources: number;
  independentItems: number;
  clceDecided: boolean;
  contemporaneous: boolean;
}): TriadLeg[] {
  return [
    {
      id: "dated_source",
      state: opts.datedSources >= 1 ? "HIT" : "UNKNOWN",
      note:
        opts.datedSources >= 1
          ? `${opts.datedSources} dated source(s) or upload date(s) in this session.`
          : "No dated source or upload date. UNKNOWN — will not invent a date.",
    },
    {
      id: "independent_evidence",
      state: opts.independentItems >= 1 ? "HIT" : opts.datedSources >= 1 ? "MISS" : "UNKNOWN",
      note:
        opts.independentItems >= 1
          ? "Independent text (not a restatement of the official narrative) is present."
          : "Official narrative is never evidence. Independent layer is thin or missing.",
    },
    {
      id: "layer_consistency",
      state: opts.clceDecided ? "HIT" : "UNKNOWN",
      note: opts.clceDecided
        ? "CLCE produced a labeled R/D/P score from session layers."
        : "Not enough distinct layers to run CLCE.",
    },
    {
      id: "temporal",
      state: opts.contemporaneous ? "HIT" : opts.datedSources >= 1 ? "MISS" : "UNKNOWN",
      note: opts.contemporaneous
        ? "Contemporaneous / at-the-time material is present."
        : "No contemporaneous layer. After-the-fact reconstruction stays weaker.",
    },
  ];
}
