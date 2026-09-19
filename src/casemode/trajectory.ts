/**
 * TrajectoryLock — victim × impact/wound direction × shooter location.
 * Cite Softwares worker_home + FragGate digest 7f536c9d…
 * Heuristic line-fit from session text + video / stereo audio / document layers.
 * Full physics suite is SLOT. GET /v1/health only — never POST media.
 * stub_ops shooter/intent/guilt stay refused. Author: Aziel Eliab.
 */
import type { EvidenceFile } from "../types";
import { clip, hasPhrase, tokenize } from "../honesty/tokens";
import { capConfidence } from "./cap";

export const TRAJECTORY_SPEC = "https://github.com/AzielEliab/trajectorylock";
export const TRAJECTORY_WORKER = "https://trajectorylock-download-tracker.vibelock.workers.dev";
export const TRAJECTORY_PATHS = ["/v1/health"] as const;
export const TRAJECTORY_STUB_OPS = ["certified", "shooter", "intent", "guilt", "store_media", "face"] as const;
export const TRAJECTORY_UA = "Mozilla/5.0";
export const TRAJECTORY_LIMITATION =
  "TrajectoryLock-lite: labeled geometric-line fit from session text plus video / stereo-audio / document layers. Does not identify a shooter, intent, or guilt (those ops stay stub). SLOT when video/stereo physics are not embeddable. GET /v1/health only — Whitestone does not POST session media. Synthetic /v1/example is never a real case. Confidence cap 0.75.";

const VICTIM_CUES = [
  "victim",
  "decedent",
  "wounded",
  "shot",
  "body",
  "casualty",
  "assassination",
  "attempted",
];
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
  "bullet",
  "gunshot",
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
const VIDEO_CUES = ["video", "film", "zapruder", "frame", "fps"];
const AUDIO_CUES = ["stereo", "audio", "dictabelt", "echo", "acoustic"];

const PROBE_MS = 4_000;

export interface TrajectoryLive {
  worker: string;
  retrievedAt: string;
  live: boolean;
  httpStatus: number | null;
  version: string | null;
  certified_instrument: false;
  media_stored: false;
  posted_user_media: false;
  stub_ops: readonly string[];
  note: string;
}

export interface TrajectoryReport {
  schema: "whitestone.trajectory.v1";
  spec: string;
  worker: string;
  victim: { present: boolean; excerpt: string | null };
  impact_direction: { present: boolean; excerpt: string | null };
  shooter_location: { present: boolean; excerpt: string | null; named_shooter: false };
  media: { video: boolean; stereo_audio: boolean; document: boolean };
  triangle: { layers: number; complete: boolean };
  line_fit: number | null;
  status: "LABELED" | "UNKNOWN" | "SLOT";
  solves_shooter: false;
  asserts_guilt: false;
  live_probe: TrajectoryLive | null;
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

export async function probeTrajectoryLockLive(): Promise<TrajectoryLive> {
  const retrievedAt = new Date().toISOString();
  const url = `${TRAJECTORY_WORKER}/v1/health`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": TRAJECTORY_UA },
      signal: ctrl.signal,
    });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const ok = res.ok && json?.ok === true && json.product === "trajectorylock";
    return {
      worker: TRAJECTORY_WORKER,
      retrievedAt,
      live: ok,
      httpStatus: res.status,
      version: typeof json?.version === "string" ? json.version : null,
      certified_instrument: false,
      media_stored: false,
      posted_user_media: false,
      stub_ops: TRAJECTORY_STUB_OPS,
      note: ok
        ? "LIVE GET /v1/health. Research prototype / auditable geometric test. Hosted API never stores media. Not a certified instrument. Synthetic example is not a real case."
        : `UNAVAILABLE HTTP ${res.status}. Case Mode continues without inventing a trajectory.`,
    };
  } catch {
    return {
      worker: TRAJECTORY_WORKER,
      retrievedAt,
      live: false,
      httpStatus: null,
      version: null,
      certified_instrument: false,
      media_stored: false,
      posted_user_media: false,
      stub_ops: TRAJECTORY_STUB_OPS,
      note: "UNAVAILABLE — TrajectoryLock GET failed. SLOT. Will not invent a line of fire.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function scoreTrajectory(
  text: string,
  opts?: { uploads?: EvidenceFile[]; live?: TrajectoryLive | null },
): TrajectoryReport {
  const blob = text || "";
  const uploads = opts?.uploads ?? [];
  const live = opts?.live ?? null;
  const victimEx = cueHit(blob, VICTIM_CUES);
  const impactEx = cueHit(blob, IMPACT_CUES);
  const locEx = cueHit(blob, LOCATION_CUES);
  const video =
    hasPhrase(blob, VIDEO_CUES) ||
    uploads.some((u) => u.kind === "video" || /^video\//.test(u.mime));
  const audio =
    hasPhrase(blob, AUDIO_CUES) ||
    uploads.some((u) => u.kind === "audio" || u.kind === "phone_call" || /^audio\//.test(u.mime));
  const document =
    uploads.some(
      (u) =>
        u.kind === "document" ||
        u.kind === "police_report" ||
        u.kind === "report" ||
        u.kind === "finding" ||
        u.mime.includes("pdf"),
    ) || tokenize(blob).size > 0;
  const tokens = tokenize(blob);
  const present = {
    victim: Boolean(victimEx),
    impact: Boolean(impactEx),
    location: Boolean(locEx),
  };
  const layers = [present.victim, present.impact, present.location].filter(Boolean).length;
  const triangle = { layers, complete: layers === 3 };
  const media = { video, stereo_audio: audio, document };

  const base = {
    schema: "whitestone.trajectory.v1" as const,
    spec: TRAJECTORY_SPEC,
    worker: TRAJECTORY_WORKER,
    victim: { present: present.victim, excerpt: victimEx },
    impact_direction: { present: present.impact, excerpt: impactEx },
    shooter_location: { present: present.location, excerpt: locEx, named_shooter: false as const },
    media,
    triangle,
    solves_shooter: false as const,
    asserts_guilt: false as const,
    live_probe: live,
    limitation: TRAJECTORY_LIMITATION,
  };

  if (layers < 2 || tokens.size < 8) {
    return { ...base, line_fit: null, status: layers === 0 ? "UNKNOWN" : "SLOT" };
  }
  const fit = capConfidence(
    clip(0.22 * layers + (video || audio ? 0.12 : 0) + (document ? 0.04 : 0) + (tokens.size > 24 ? 0.08 : 0)),
  );
  return { ...base, line_fit: fit, status: "LABELED" };
}
