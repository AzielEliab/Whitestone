/**
 * TrajectoryLock lite — victim × impact/wound direction × shooter location.
 * Cite: https://github.com/AzielEliab/TrajectoryLock (digest 7f536c9d…)
 * Tests whether observations fit a declared geometric line. Heuristic, not lab.
 * stub_ops shooter/intent/guilt stay refused. Author: Aziel Eliab.
 */
import { clip, hasPhrase, tokenize } from "../honesty/tokens";
import { capConfidence } from "./cap";

export const TRAJECTORY_SPEC = "https://github.com/AzielEliab/TrajectoryLock";
export const TRAJECTORY_LIMITATION =
  "TrajectoryLock-lite: labeled geometric-line fit from session text/notes. Does not identify a shooter, intent, or guilt (those ops stay stub). SLOT when video/stereo physics are not embeddable. No invented trajectories. Confidence cap 0.75.";

const VICTIM_CUES = ["victim", "decedent", "wounded", "shot", "body", "casualty"];
const IMPACT_CUES = [
  "wound",
  "entry",
  "exit",
  "impact",
  "direction",
  "angle",
  "trajectory",
  "through-and-through",
  "anterior",
  "posterior",
];
const LOCATION_CUES = [
  "window",
  "grassy",
  "knoll",
  "building",
  "roof",
  "sixth floor",
  "book depository",
  "shooter location",
  "firing position",
  "behind",
  "above",
];
const VIDEO_CUES = ["video", "film", "zapruder", "frame", "fps", "stereo"];
const AUDIO_CUES = ["stereo", "audio", "dictabelt", "echo", "acoustic"];

export interface TrajectoryReport {
  schema: "whitestone.trajectory.v1";
  spec: string;
  victim: { present: boolean; excerpt: string | null };
  impact_direction: { present: boolean; excerpt: string | null };
  shooter_location: { present: boolean; excerpt: string | null; named_shooter: false };
  media: { video: boolean; stereo_audio: boolean; document: boolean };
  line_fit: number | null;
  status: "LABELED" | "UNKNOWN" | "SLOT";
  solves_shooter: false;
  asserts_guilt: false;
  limitation: string;
}

function cueHit(blob: string, cues: string[]): string | null {
  const low = blob.toLowerCase();
  for (const c of cues) {
    if (low.includes(c)) {
      const i = low.indexOf(c);
      return blob.slice(Math.max(0, i - 24), Math.min(blob.length, i + c.length + 48)).trim();
    }
  }
  return null;
}

export function scoreTrajectory(text: string): TrajectoryReport {
  const blob = text || "";
  const victimEx = cueHit(blob, VICTIM_CUES);
  const impactEx = cueHit(blob, IMPACT_CUES);
  const locEx = cueHit(blob, LOCATION_CUES);
  const video = hasPhrase(blob, VIDEO_CUES);
  const audio = hasPhrase(blob, AUDIO_CUES);
  const tokens = tokenize(blob);
  const present = {
    victim: Boolean(victimEx),
    impact: Boolean(impactEx),
    location: Boolean(locEx),
  };
  const layers = [present.victim, present.impact, present.location].filter(Boolean).length;
  if (layers < 2 || tokens.size < 8) {
    return {
      schema: "whitestone.trajectory.v1",
      spec: TRAJECTORY_SPEC,
      victim: { present: present.victim, excerpt: victimEx },
      impact_direction: { present: present.impact, excerpt: impactEx },
      shooter_location: { present: present.location, excerpt: locEx, named_shooter: false },
      media: { video, stereo_audio: audio, document: tokens.size > 0 },
      line_fit: null,
      status: layers === 0 ? "UNKNOWN" : "SLOT",
      solves_shooter: false,
      asserts_guilt: false,
      limitation: TRAJECTORY_LIMITATION,
    };
  }
  const fit = capConfidence(clip(0.22 * layers + (video || audio ? 0.12 : 0) + (tokens.size > 24 ? 0.08 : 0)));
  return {
    schema: "whitestone.trajectory.v1",
    spec: TRAJECTORY_SPEC,
    victim: { present: present.victim, excerpt: victimEx },
    impact_direction: { present: present.impact, excerpt: impactEx },
    shooter_location: { present: present.location, excerpt: locEx, named_shooter: false },
    media: { video, stereo_audio: audio, document: true },
    line_fit: fit,
    status: "LABELED",
    solves_shooter: false,
    asserts_guilt: false,
    limitation: TRAJECTORY_LIMITATION,
  };
}
