/**
 * Case Mode — current and/or historical case evaluation.
 * Scores: truth_upheld, narrative_suppression, systemic_suppression,
 * personal_professional_suppression, plus honesty axes.
 * Confidence hard-capped at 0.75. NO-LIE. Author: Aziel Eliab.
 */
import { evaluateHonesty, type HonestyEvaluation, type LabeledScore } from "../honesty/evaluate";
import { join } from "../honesty/tokens";
import type { EvidenceFile, SessionState } from "../types";
import { capConfidence, labeledOrUnknown } from "./cap";
import { extractFiveW, type FiveW } from "./fivew";
import { citeSpectralLock, type SpectralLockCite } from "./spectrallock";
import { scoreTrajectory, type TrajectoryReport } from "./trajectory";
import { scoreVibeLock, type VibeLockReport } from "./vibelock";

export const CASEMODE_SPEC = "whitestone.casemode.v1";
export const CASEMODE_LIMITATION =
  "Case Mode labeled scores from hashchained session uploads, stated outcomes, seeded as-of law, and allowlisted public pages. UNKNOWN without dated sources. Never invents suppression or buried truth. Educational / archival. Confidence cap 0.75.";

export interface CaseModeEvaluation {
  schema: typeof CASEMODE_SPEC;
  confidence_cap: 0.75;
  sufficient: boolean;
  truth_upheld: LabeledScore;
  narrative_suppression: LabeledScore;
  systemic_suppression: LabeledScore;
  personal_professional_suppression: LabeledScore;
  honesty: HonestyEvaluation;
  fivew: FiveW;
  trajectory: TrajectoryReport;
  vibelock: VibeLockReport;
  spectrallock: SpectralLockCite;
  online_verify: { cited: number; urls: string[]; note: string };
  cites: string[];
  limitation: string;
  nolie: string;
  disclaimer: string;
}

const SYSTEMIC_CUES = ["agency", "department", "office", "bureau", "city", "state", "federal", "board", "commission"];
const PERSONAL_CUES = ["career", "license", "fired", "blacklisted", "reputation", "profession", "job", "whistle"];

export function evaluateCaseMode(input: {
  official?: string;
  statedOutcome?: string;
  archival?: string;
  asOfIso?: string | null;
  uploads: EvidenceFile[];
  webNotes?: { title: string; url: string; excerpt: string; retrievedAt?: string }[];
  historicalSources?: { title: string; url: string; date?: string }[];
}): CaseModeEvaluation {
  const honesty = evaluateHonesty(input);
  const blob = join([
    input.official,
    input.statedOutcome,
    input.archival,
    ...input.uploads.map((u) => join([u.text, u.note])),
  ]);
  const fivew = extractFiveW({
    official: input.official,
    stated: input.statedOutcome,
    archival: input.archival,
    uploadsText: join(input.uploads.map((u) => join([u.text, u.note, u.name]))),
    asOfIso: input.asOfIso,
  });
  const trajectory = scoreTrajectory(blob);
  const audioPresent = input.uploads.some((u) => u.kind === "audio" || u.kind === "phone_call" || /^audio\//.test(u.mime));
  const mediaPresent = input.uploads.some(
    (u) =>
      u.kind === "image" ||
      u.kind === "painting" ||
      u.kind === "video" ||
      u.kind === "document" ||
      u.mime.startsWith("image/") ||
      u.mime.includes("pdf"),
  );
  const vibelock = scoreVibeLock({ audioPresent, notes: blob });
  const spectrallock = citeSpectralLock(mediaPresent);
  const webUrls = (input.webNotes ?? []).map((w) => w.url).filter((u) => /^https:\/\//.test(u));
  const histUrls = (input.historicalSources ?? []).map((h) => h.url).filter((u) => /^https:\/\//.test(u));

  const buried = honesty.truth_buried.status === "LABELED" ? honesty.truth_buried.value ?? 0 : null;
  const overcame = honesty.truth_overcame_lie.status === "LABELED" ? honesty.truth_overcame_lie.value ?? 0 : null;
  const overall = honesty.honesty_overall.status === "LABELED" ? honesty.honesty_overall.value ?? 0 : null;

  const truth_upheld = honesty.sufficient
    ? labeledOrUnknown(
        overall != null ? capConfidence(overall * (overcame != null ? 0.5 + 0.5 * overcame : 0.7)) : 1 - (buried ?? 0.5),
        "LABELED (not truth): composite of honesty_overall and later-dated independent layers. Cap 0.75.",
        "UNKNOWN — not enough dated independent sources to say truth was upheld.",
      )
    : labeledOrUnknown(null, "", "UNKNOWN — need a stated outcome plus dated uploads or allowlisted cites.");

  const narrative_suppression =
    honesty.sufficient && buried != null
      ? labeledOrUnknown(
          buried,
          "LABELED: official/stated line diverges from dated independent uploads. Official narrative is not evidence.",
          "UNKNOWN",
        )
      : labeledOrUnknown(null, "", "UNKNOWN — no dated independent contradiction of the official line.");

  const systemicHits = SYSTEMIC_CUES.filter((c) => blob.toLowerCase().includes(c)).length;
  const systemic_suppression =
    honesty.sufficient && buried != null && systemicHits >= 1
      ? labeledOrUnknown(
          capConfidence(buried * Math.min(1, 0.4 + 0.12 * systemicHits)),
          "LABELED structural/agency-layer cue plus independent contradiction. Not a finding that an institution is guilty.",
          "UNKNOWN",
        )
      : labeledOrUnknown(null, "", "UNKNOWN — no evidenced institutional layer plus independent contradiction.");

  const personalHits = PERSONAL_CUES.filter((c) => blob.toLowerCase().includes(c)).length;
  const personal_professional_suppression =
    honesty.sufficient && (buried != null || personalHits >= 2)
      ? labeledOrUnknown(
          capConfidence((buried ?? 0.35) * Math.min(1, 0.35 + 0.15 * personalHits)),
          "LABELED personal/professional-cost cues in session text. Not a finding of retaliation.",
          "UNKNOWN",
        )
      : labeledOrUnknown(null, "", "UNKNOWN — no evidenced personal/professional suppression layer.");

  return {
    schema: CASEMODE_SPEC,
    confidence_cap: 0.75,
    sufficient: honesty.sufficient,
    truth_upheld,
    narrative_suppression,
    systemic_suppression,
    personal_professional_suppression,
    honesty,
    fivew,
    trajectory,
    vibelock,
    spectrallock,
    online_verify: {
      cited: webUrls.length + histUrls.length,
      urls: [...webUrls, ...histUrls].slice(0, 8),
      note:
        webUrls.length + histUrls.length
          ? "Allowlisted public pages / seeded law URLs cited with retrieved or effective dates. Not a complete web."
          : "UNKNOWN online verify — no allowlisted page or seeded law URL in this session yet.",
    },
    cites: [
      ...honesty.cites,
      TRAJECTORY_CITE,
      VIBE_CITE,
      SPECTRAL_CITE,
    ],
    limitation: CASEMODE_LIMITATION,
    nolie: "NO-LIE: Whitestone will not invent suppression, buried truth, a shooter, or a recovered mark without hashchained uploads and/or cited sources. UNKNOWN is the honest gap.",
    disclaimer: "Educational / archival Case Mode. Labeled scores only. Confidence cap 0.75. Verify with primary sources and counsel.",
  };
}

const TRAJECTORY_CITE = "https://github.com/AzielEliab/TrajectoryLock";
const VIBE_CITE = "https://github.com/AzielEliab/VibeLock";
const SPECTRAL_CITE = "https://github.com/AzielEliab/SpectralLock";

export function caseModeFromSession(state: Pick<SessionState, "facts" | "uploads" | "asOfYear" | "asOfMonth" | "webNotes"> & {
  historicalSources?: { title: string; url: string; date?: string }[];
}): CaseModeEvaluation {
  const asOfIso =
    state.asOfYear && state.asOfMonth ? `${state.asOfYear}-${String(state.asOfMonth).padStart(2, "0")}` : null;
  return evaluateCaseMode({
    official: state.facts.official_narrative || state.facts.stated_outcome || "",
    statedOutcome: state.facts.stated_outcome || state.facts.goals || "",
    archival: state.facts.archival || "",
    asOfIso,
    uploads: state.uploads,
    webNotes: state.webNotes,
    historicalSources: state.historicalSources,
  });
}
