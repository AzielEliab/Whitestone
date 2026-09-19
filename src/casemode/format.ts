import type { LabeledScore } from "../honesty/evaluate";
import { formatHonestyBlock } from "../honesty/format";
import type { CaseModeEvaluation } from "./evaluate";

function line(name: string, s: LabeledScore): string {
  if (s.status === "UNKNOWN" || s.value == null) return `${name}: UNKNOWN. ${s.note}`;
  return `${name}: ${(s.value * 100).toFixed(1)} (LABELED, cap 75, not truth). ${s.note}`;
}

export function formatCaseModeBlock(evaln: CaseModeEvaluation): string {
  const w = evaln.fivew;
  const actor = w.independent_or_behalf;
  const parts = [
    "Case Mode evaluation (current and/or historical). Educational / archival. Labeled scores only.",
    evaln.disclaimer,
    evaln.nolie,
    evaln.limitation,
    `confidence_cap: ${evaln.confidence_cap}`,
    line("truth_upheld", evaln.truth_upheld),
    line("narrative_suppression", evaln.narrative_suppression),
    line("systemic_suppression", evaln.systemic_suppression),
    line("personal_professional_suppression", evaln.personal_professional_suppression),
    `why: ${w.why}`,
    `who: ${
      actor.role === "UNKNOWN"
        ? "UNKNOWN"
        : `${actor.name ?? "unnamed"} · ${actor.role}${actor.behalfOf ? ` on behalf of ${actor.behalfOf}` : ""}`
    }. ${actor.note}`,
    `what: ${w.what}`,
    `how: ${w.how}`,
    `when: ${w.when ?? "UNKNOWN"}`,
    `TrajectoryLock (${evaln.trajectory.spec}): ${evaln.trajectory.status} line_fit ${
      evaln.trajectory.line_fit == null ? "UNKNOWN" : evaln.trajectory.line_fit.toFixed(3)
    }. Does not name a shooter. ${evaln.trajectory.limitation}`,
    `VibeLock (${evaln.vibelock.spec}): ${evaln.vibelock.status}. ${evaln.vibelock.note}`,
    `SpectralLock (${evaln.spectrallock.spec}): ${evaln.spectrallock.status} · ${evaln.spectrallock.paths.join(", ")}. lab_claim=${evaln.spectrallock.lab_claim} posted_user_bytes=${evaln.spectrallock.posted_user_bytes}. ${evaln.spectrallock.note}`,
    `Online verify: ${evaln.online_verify.note}${
      evaln.online_verify.cites.length
        ? ` Cites: ${evaln.online_verify.cites
            .map((c) => `${c.title} (${c.url}${c.retrievedAt ? `, retrieved ${c.retrievedAt}` : c.date ? `, date ${c.date}` : ""})`)
            .join(" · ")}`
        : ""
    }`,
    formatHonestyBlock(evaln.honesty),
  ];
  return parts.join("\n\n");
}
