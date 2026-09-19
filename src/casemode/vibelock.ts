/**
 * VibeLock lite — speech/audio physical-consistency risk.
 * Cite: https://github.com/AzielEliab/VibeLock (digest 12b960bd…)
 * SLOT unless session has audio or contemporaneous audio notes. Author: Aziel Eliab.
 */
import { clip, hasPhrase, tokenize } from "../honesty/tokens";
import { capConfidence } from "./cap";

export const VIBELOCK_SPEC = "https://github.com/AzielEliab/VibeLock";
export const VIBELOCK_LIMITATION =
  "VibeLock-lite: labeled physical-consistency risk from audio uploads or audio notes. Not a voice-ID lab. SLOT when no audio layer. Confidence cap 0.75.";

export interface VibeLockReport {
  schema: "whitestone.vibelock.v1";
  spec: string;
  verified: boolean;
  score: number | null;
  status: "LABELED" | "UNKNOWN" | "SLOT";
  note: string;
  limitation: string;
  full_engine_vendored: false;
}

export function scoreVibeLock(opts: { audioPresent: boolean; notes: string }): VibeLockReport {
  const cues = hasPhrase(opts.notes, ["audio", "stereo", "recording", "dictabelt", "clip", "waveform", "echo"]);
  if (!opts.audioPresent && !cues) {
    return {
      schema: "whitestone.vibelock.v1",
      spec: VIBELOCK_SPEC,
      verified: false,
      score: null,
      status: "SLOT",
      note: "VibeLock lives as standalone Softwares. No audio layer in this session — SLOT, not an invented consistency score.",
      limitation: VIBELOCK_LIMITATION,
      full_engine_vendored: false,
    };
  }
  const tokens = tokenize(opts.notes);
  if (tokens.size < 6) {
    return {
      schema: "whitestone.vibelock.v1",
      spec: VIBELOCK_SPEC,
      verified: false,
      score: null,
      status: "UNKNOWN",
      note: "Audio is present but notes are too thin to label a consistency risk.",
      limitation: VIBELOCK_LIMITATION,
      full_engine_vendored: false,
    };
  }
  const risk = capConfidence(clip(0.35 + (opts.audioPresent ? 0.2 : 0.08) + Math.min(0.2, tokens.size / 80)));
  return {
    schema: "whitestone.vibelock.v1",
    spec: VIBELOCK_SPEC,
    verified: true,
    score: risk,
    status: "LABELED",
    note: "Labeled consistency-risk from session audio/notes. Not a speaker identification.",
    limitation: VIBELOCK_LIMITATION,
    full_engine_vendored: false,
  };
}
