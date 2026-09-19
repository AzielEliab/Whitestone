/**
 * SpectralLock allowlist + honest SLOT.
 * Product Worker doors: /v1/unredact, /v1/recover, /v1/handwriting
 * Cite FragGate spectrallock (digest f4aea0fb…). Not a lab spectrometer.
 * Author: Aziel Eliab.
 */

export const SPECTRALLOCK_SPEC = "https://github.com/AzielEliab/SpectralLock";
export const SPECTRALLOCK_WORKER = "https://spectrallock-download-tracker.vibelock.workers.dev";
export const SPECTRALLOCK_PATHS = ["/v1/unredact", "/v1/recover", "/v1/handwriting"] as const;
export const SPECTRALLOCK_LIMITATION =
  "SpectralLock allowlist-call only. /v1/unredact is leftover-bytes revision graph. /v1/recover is universal NO-LIE recover. /v1/handwriting is ink-scan heuristics — not ESDA / court cert. Opaque rewrite refuses. Whitestone does not invent marks or recovered pigment.";

export interface SpectralLockCite {
  schema: "whitestone.spectrallock.v1";
  spec: string;
  worker: string;
  paths: readonly string[];
  status: "CITED" | "SLOT";
  note: string;
  limitation: string;
  lab_claim: false;
}

export function citeSpectralLock(hasMedia: boolean): SpectralLockCite {
  return {
    schema: "whitestone.spectrallock.v1",
    spec: SPECTRALLOCK_SPEC,
    worker: SPECTRALLOCK_WORKER,
    paths: SPECTRALLOCK_PATHS,
    status: hasMedia ? "CITED" : "SLOT",
    note: hasMedia
      ? "Media is in-session. SpectralLock product Worker may be called on allowlisted HTTPS for leftover-bytes / recover / handwriting heuristics. Not a lab."
      : "No image/PDF/video in session. SpectralLock stays a cite — will not invent an unredact result.",
    limitation: SPECTRALLOCK_LIMITATION,
    lab_claim: false,
  };
}

export function spectrallockUrls(): string[] {
  return SPECTRALLOCK_PATHS.map((p) => `${SPECTRALLOCK_WORKER}${p}`);
}
