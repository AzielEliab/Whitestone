/**
 * SpectralLock allowlist + live HTTP GET of product Worker doors.
 * Worker: https://spectrallock-download-tracker.vibelock.workers.dev
 * Doors: /v1/unredact (revision graph), /v1/recover (universal NO-LIE),
 * /v1/handwriting (heuristics, not lab). FragGate digest f4aea0fb…
 * GET-only — never POSTs session files. Not a lab spectrometer.
 * Author: Aziel Eliab.
 */

export const SPECTRALLOCK_SPEC = "https://github.com/AzielEliab/SpectralLock";
export const SPECTRALLOCK_WORKER = "https://spectrallock-download-tracker.vibelock.workers.dev";
export const SPECTRALLOCK_PATHS = ["/v1/unredact", "/v1/recover", "/v1/handwriting"] as const;
export const SPECTRALLOCK_UA = "Mozilla/5.0";
export const SPECTRALLOCK_LIMITATION =
  "SpectralLock allowlist-call only. GET /v1/unredact is leftover-bytes revision-graph capability. GET /v1/recover is universal NO-LIE recover (present bytes). GET /v1/handwriting is ink-scan heuristics — not ESDA / court cert. Whitestone does not POST session files and does not invent marks or recovered pigment. Confidence cap 0.75.";

const PROBE_MS = 4_000;

export type SpectralLockStatus = "LIVE" | "CITED" | "SLOT" | "UNAVAILABLE";

export interface SpectralLockPathProbe {
  path: (typeof SPECTRALLOCK_PATHS)[number];
  url: string;
  ok: boolean;
  httpStatus: number | null;
  retrievedAt: string | null;
  product: string | null;
  version: string | null;
  headline: string;
}

export interface SpectralLockLive {
  worker: string;
  retrievedAt: string;
  live: boolean;
  paths: SpectralLockPathProbe[];
  unredact: { leftover_bytes: boolean | null; revision_graph: boolean | null; refuse_code: string | null };
  recover: { ops: string[]; slot_kinds: string[] };
  handwriting: { ops: string[]; heuristic: true; lab: false };
  posted_user_bytes: false;
  lab_claim: false;
}

export interface SpectralLockCite {
  schema: "whitestone.spectrallock.v1";
  spec: string;
  worker: string;
  paths: readonly string[];
  status: SpectralLockStatus;
  live: boolean;
  note: string;
  limitation: string;
  lab_claim: false;
  invented_marks: false;
  posted_user_bytes: false;
  live_probe: SpectralLockLive | null;
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
}

function stringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(0, 16) : [];
}

function headlineFor(path: string, json: Record<string, unknown> | null): string {
  if (!json) return "UNKNOWN — empty SpectralLock body.";
  if (path === "/v1/unredact") {
    const u = asRecord(json.unredact);
    const graph = u?.revision_graph === true;
    return graph
      ? "LIVE leftover-bytes revision graph (capability). Does not invent letters."
      : "Unredact banner retrieved. Revision graph not confirmed.";
  }
  if (path === "/v1/recover") {
    const r = asRecord(json.recover);
    const slots = stringList(r?.slot_kinds);
    return `LIVE universal recover banner. SLOT kinds: ${slots.join(", ") || "none listed"}. Present bytes only.`;
  }
  if (path === "/v1/handwriting") {
    return "LIVE handwriting ink-scan heuristics banner. Not ESDA / not a lab / not a court finding.";
  }
  return "SpectralLock banner retrieved.";
}

async function getJson(url: string): Promise<{ status: number; json: Record<string, unknown> | null }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": SPECTRALLOCK_UA },
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json: Record<string, unknown> | null = null;
    try {
      json = asRecord(JSON.parse(text));
    } catch {
      json = null;
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeSpectralLockLive(): Promise<SpectralLockLive> {
  const retrievedAt = new Date().toISOString();
  const paths: SpectralLockPathProbe[] = [];
  let unredact: SpectralLockLive["unredact"] = {
    leftover_bytes: null,
    revision_graph: null,
    refuse_code: null,
  };
  let recover: SpectralLockLive["recover"] = { ops: [], slot_kinds: [] };
  let handwriting: SpectralLockLive["handwriting"] = { ops: [], heuristic: true, lab: false };

  for (const path of SPECTRALLOCK_PATHS) {
    const url = `${SPECTRALLOCK_WORKER}${path}`;
    try {
      const { status, json } = await getJson(url);
      const ok = status >= 200 && status < 300 && json != null;
      paths.push({
        path,
        url,
        ok,
        httpStatus: status,
        retrievedAt: ok ? retrievedAt : null,
        product: typeof json?.product === "string" ? json.product : null,
        version: typeof json?.version === "string" ? json.version : null,
        headline: ok ? headlineFor(path, json) : `UNAVAILABLE HTTP ${status}`,
      });
      if (!ok || !json) continue;
      if (path === "/v1/unredact") {
        const u = asRecord(json.unredact);
        unredact = {
          leftover_bytes: u?.leftover_bytes_recovery === true,
          revision_graph: u?.revision_graph === true,
          refuse_code: typeof u?.refuse_code === "string" ? u.refuse_code : null,
        };
      }
      if (path === "/v1/recover") {
        const r = asRecord(json.recover);
        recover = { ops: stringList(r?.ops), slot_kinds: stringList(r?.slot_kinds) };
      }
      if (path === "/v1/handwriting") {
        const h = asRecord(json.handwriting);
        handwriting = { ops: stringList(h?.ops), heuristic: true, lab: false };
      }
    } catch {
      paths.push({
        path,
        url,
        ok: false,
        httpStatus: null,
        retrievedAt: null,
        product: null,
        version: null,
        headline: "UNAVAILABLE — SpectralLock GET failed. Case Mode continues without a lab claim.",
      });
    }
  }

  return {
    worker: SPECTRALLOCK_WORKER,
    retrievedAt,
    live: paths.some((p) => p.ok),
    paths,
    unredact,
    recover,
    handwriting,
    posted_user_bytes: false,
    lab_claim: false,
  };
}

export function citeSpectralLock(hasMedia: boolean, live?: SpectralLockLive | null): SpectralLockCite {
  const liveOk = Boolean(live?.live);
  let status: SpectralLockStatus;
  if (live && !live.live) status = "UNAVAILABLE";
  else if (liveOk) status = "LIVE";
  else if (hasMedia) status = "CITED";
  else status = "SLOT";

  const liveBits = liveOk
    ? ` GET retrieved ${live!.paths.filter((p) => p.ok).map((p) => p.path).join(", ")}. leftover_bytes=${live!.unredact.leftover_bytes} revision_graph=${live!.unredact.revision_graph}. handwriting heuristic, not lab.`
    : "";

  return {
    schema: "whitestone.spectrallock.v1",
    spec: SPECTRALLOCK_SPEC,
    worker: SPECTRALLOCK_WORKER,
    paths: SPECTRALLOCK_PATHS,
    status,
    live: liveOk,
    note: !hasMedia
      ? "No image/PDF/video in session. SpectralLock stays a cite — will not invent an unredact result."
      : liveOk
        ? `Media is in-session. Live SpectralLock Worker ${SPECTRALLOCK_WORKER} answered GET capability banners.${liveBits} Whitestone did not POST your files. Not a lab.`
        : live
          ? "Media is in-session. SpectralLock GET was unavailable. SLOT/UNAVAILABLE — will not invent leftover bytes or handwriting marks."
          : "Media is in-session. SpectralLock product Worker may be GET-called on allowlisted HTTPS for leftover-bytes / recover / handwriting heuristics. Not a lab.",
    limitation: SPECTRALLOCK_LIMITATION,
    lab_claim: false,
    invented_marks: false,
    posted_user_bytes: false,
    live_probe: live ?? null,
  };
}

export function spectrallockUrls(): string[] {
  return SPECTRALLOCK_PATHS.map((p) => `${SPECTRALLOCK_WORKER}${p}`);
}
