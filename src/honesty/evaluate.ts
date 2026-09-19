/**
 * Anti-corruption / honesty evaluation.
 * Scores: truth_buried, truth_overcame_lie, honesty_overall.
 * UNKNOWN when sources are insufficient. NO-LIE: never invent buried-truth
 * claims without dated sources/uploads. Confidence is not truth.
 * Author: Aziel Eliab. Apache-2.0.
 */
import type { EvidenceFile } from "../types";
import { scoreClce } from "./clce";
import { extractDatesFromText, parseIsoDate, type ParsedDate } from "./dates";
import { buildLattice, type LatticeReport } from "./lattice";
import { scorePhysLing } from "./physling";
import { scoreSpre, type SpreReport } from "./spre";
import { assembleTriad, clceComponent, spreComponent, type TriadBundle } from "./triad";
import { buildHonestyLegs, scoreTriad, type TriadScore } from "./triadscore";
import { jaccard, join, tokenize } from "./tokens";
import { scoreZionPattern, type ZionScores } from "./zion";

export const HONESTY_SPEC = "whitestone.honesty.v1";
export const HONESTY_LIMITATION =
  "Labeled honesty scores from session uploads + stated outcomes. UNKNOWN when dated independent sources are insufficient. Never invents a buried-truth claim. Not a lawyer, not a court, not a lie detector. Confidence is not truth.";

export type LabeledScore = { value: number | null; status: "LABELED" | "UNKNOWN"; note: string };

export interface HonestyEvidenceItem {
  kind: string;
  label: string;
  date: string | null;
  source: string;
  excerpt: string;
}

export interface HonestyEvaluation {
  schema: typeof HONESTY_SPEC;
  sufficient: boolean;
  truth_buried: LabeledScore;
  truth_overcame_lie: LabeledScore;
  honesty_overall: LabeledScore;
  evidence: HonestyEvidenceItem[];
  engines: {
    clce: ReturnType<typeof scoreClce>;
    spre: SpreReport;
    physling: ReturnType<typeof scorePhysLing>;
    triad: TriadBundle;
    triadscore: TriadScore;
    zion: ZionScores;
    lattice: LatticeReport;
  };
  cites: string[];
  limitation: string;
  nolie: string;
  disclaimer: string;
}

export interface HonestyInput {
  official?: string;
  statedOutcome?: string;
  archival?: string;
  physics?: string;
  internal?: string;
  asOfLabel?: string | null;
  asOfIso?: string | null;
  uploads: EvidenceFile[];
  webNotes?: { title: string; url: string; excerpt: string; retrievedAt?: string }[];
  historicalSources?: { title: string; url: string; date?: string }[];
}

function excerpt(text: string, n = 180): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function uploadKind(file: EvidenceFile): string {
  return file.kind ?? "evidence";
}

function collectDates(input: HonestyInput): ParsedDate[] {
  const dates: ParsedDate[] = [];
  if (input.asOfIso) {
    const parsed = parseIsoDate(input.asOfIso);
    if (parsed) dates.push({ ...parsed, source: "as-of" });
  }
  for (const u of input.uploads) {
    const tagged = parseIsoDate(u.sourceDate);
    if (tagged) dates.push(tagged);
    dates.push(...extractDatesFromText(`${u.text}\n${u.note}`, "text"));
  }
  dates.push(...extractDatesFromText(join([input.official, input.statedOutcome, input.archival, input.physics, input.internal])));
  for (const w of input.webNotes ?? []) {
    if (w.retrievedAt) {
      const iso = w.retrievedAt.slice(0, 10);
      const parsed = parseIsoDate(iso);
      if (parsed) dates.push({ ...parsed, source: "text" });
    }
  }
  const seen = new Set<string>();
  return dates.filter((d) => {
    if (seen.has(d.iso)) return false;
    seen.add(d.iso);
    return true;
  });
}

function independentUploads(input: HonestyInput, official: string): EvidenceFile[] {
  const officialTok = tokenize(official);
  return input.uploads.filter((u) => {
    const kind = uploadKind(u);
    if (kind === "filing") return false;
    const blob = join([u.text, u.note]);
    if (!blob.trim()) return false;
    if (!officialTok.size) return true;
    return jaccard(tokenize(blob), officialTok) < 0.7;
  });
}

export function evaluateHonesty(input: HonestyInput): HonestyEvaluation {
  const official = (input.official || input.statedOutcome || "").trim();
  const stated = (input.statedOutcome || input.official || "").trim();
  const archival = (input.archival || "").trim();
  const filings = input.uploads.filter((u) => uploadKind(u) === "filing");
  const reports = input.uploads.filter((u) => uploadKind(u) === "historical_report");
  const clippings = input.uploads.filter((u) => uploadKind(u) === "news_clipping");
  const evidenceUploads = input.uploads.filter((u) => uploadKind(u) === "evidence");
  const filingText = join(filings.map((u) => join([u.text, u.note])));
  const reportText = join(reports.map((u) => join([u.text, u.note])));
  const clipText = join(clippings.map((u) => join([u.text, u.note])));
  const evidenceText = join(evidenceUploads.map((u) => join([u.text, u.note])));
  const physics = join([
    input.physics,
    ...input.uploads.filter((u) => /physics|measure|lab|forensic|autopsy/i.test(`${u.note} ${u.text}`)).map((u) => join([u.text, u.note])),
  ]);
  const internal = join([
    input.internal,
    archival,
    clipText,
    evidenceText,
  ]);
  const r = join([filingText, official, stated]) || official;
  const d = join([reportText, stated, official]);
  const p = join([physics, evidenceText, clipText, archival]);
  const n = join(
    input.uploads
      .filter((u) => /missing|destroyed|lost|no record|never filed/i.test(`${u.text} ${u.note}`))
      .map((u) => join([u.text, u.note])),
  );

  const clce = scoreClce(r, d, p, n);
  const spre = scoreSpre({
    official: official || stated,
    internal,
    physics,
    notes: join([archival, clipText]),
    evidence: independentUploads(input, official || stated).map((u) => excerpt(join([u.text, u.note]), 400)),
    contemporaneous: join(clippings.map((u) => join([u.text, u.note]))),
    records: filingText,
    destroyed: input.uploads.filter((u) => /destroyed|lost|missing|shredded/i.test(`${u.text} ${u.note}`)).map((u) => excerpt(join([u.text, u.note]), 200)),
  });
  const dates = collectDates(input);
  const datedIndependent = independentUploads(input, official || stated).filter((u) => {
    return Boolean(parseIsoDate(u.sourceDate) || extractDatesFromText(`${u.text}\n${u.note}`).length);
  });
  const physling = scorePhysLing({
    physicsText: physics,
    dated: dates.length > 0 && Boolean(physics.trim()),
    independent: datedIndependent.length > 0 || Boolean(physics.trim() && dates.length > 0),
  });
  const triad = assembleTriad({
    clce: clceComponent(clce),
    spre: spreComponent(spre),
    physling,
  });
  const independents = independentUploads(input, official || stated);
  const triadscore = scoreTriad(
    buildHonestyLegs({
      datedSources: dates.length,
      independentItems: independents.length + (physics.trim() ? 1 : 0),
      clceDecided: Boolean(r.trim() && d.trim() && p.trim()),
      contemporaneous: Boolean(clipText.trim() || spre.sp.t >= 0.4),
    }),
  );
  const zion = scoreZionPattern(join([official, stated, archival, physics, internal, clipText, reportText]));
  const lattice = buildLattice([
    ...(official ? [{ id: "stated-official", kind: "stated_outcome", label: "Stated outcome / official", text: official, sourceDate: input.asOfIso ?? null, source: "session-facts" }] : []),
    ...(archival ? [{ id: "archival", kind: "archival", label: "Archival facts", text: archival, sourceDate: input.asOfIso ?? null, source: "session-facts" }] : []),
    ...input.uploads.map((u) => ({
      id: u.id,
      kind: uploadKind(u),
      label: u.name,
      text: join([u.text, u.note]),
      sourceDate: u.sourceDate ?? extractDatesFromText(`${u.text}\n${u.note}`)[0]?.iso ?? null,
      source: `upload:${uploadKind(u)}`,
    })),
  ]);

  const evidence: HonestyEvidenceItem[] = [];
  if (stated) {
    evidence.push({ kind: "stated_outcome", label: "Stated outcome / report", date: input.asOfIso ?? null, source: "session-facts", excerpt: excerpt(stated) });
  }
  if (archival) {
    evidence.push({ kind: "archival", label: "Archival facts", date: input.asOfIso ?? null, source: "session-facts", excerpt: excerpt(archival) });
  }
  for (const u of input.uploads) {
    evidence.push({
      kind: uploadKind(u),
      label: u.name,
      date: u.sourceDate ?? extractDatesFromText(`${u.text}\n${u.note}`)[0]?.iso ?? null,
      source: `upload:${u.name}`,
      excerpt: excerpt(join([u.note, u.text])),
    });
  }
  for (const w of input.webNotes ?? []) {
    evidence.push({
      kind: "web",
      label: w.title,
      date: w.retrievedAt?.slice(0, 10) ?? null,
      source: w.url,
      excerpt: excerpt(w.excerpt),
    });
  }
  for (const h of input.historicalSources ?? []) {
    evidence.push({
      kind: "seeded-law",
      label: h.title,
      date: h.date ?? null,
      source: h.url,
      excerpt: h.title,
    });
  }

  const textLayers = [official, stated, archival, physics, internal, filingText, clipText, reportText, evidenceText].filter((t) => t.trim());
  const sufficient =
    dates.length >= 1 &&
    textLayers.length >= 2 &&
    Boolean((official || stated).trim()) &&
    (input.uploads.length >= 1 || Boolean(archival.trim()));

  const officialTok = tokenize(official || stated);
  const independentBlob = join([physics, clipText, evidenceText, ...independents.map((u) => join([u.text, u.note]))]);
  const independentTok = tokenize(independentBlob);
  const contradicted =
    officialTok.size >= 4 &&
    independentTok.size >= 4 &&
    jaccard(officialTok, independentTok) < 0.45;

  let truth_buried: LabeledScore;
  if (!sufficient || datedIndependent.length < 1 || !contradicted) {
    truth_buried = {
      value: null,
      status: "UNKNOWN",
      note: !sufficient
        ? "UNKNOWN — need a stated outcome plus at least one dated upload/source and a second text layer. Whitestone will not invent a buried-truth claim."
        : datedIndependent.length < 1
          ? "UNKNOWN — no dated independent source/upload. Official narrative is not evidence. NO-LIE: no buried-truth claim."
          : "UNKNOWN — independent dated text does not clearly contradict the stated outcome (Jaccard not below 0.45).",
    };
  } else {
    const raw = clip01Safe((1 - jaccard(officialTok, independentTok)) * Math.min(1, 0.4 + 0.2 * datedIndependent.length));
    truth_buried = {
      value: raw,
      status: "LABELED",
      note: `LABELED (not truth): dated independent material diverges from the stated outcome. ${datedIndependent.length} dated independent upload(s). Official narrative is not treated as proof.`,
    };
  }

  const laterIndependent = datedIndependent.filter((u) => {
    const d = parseIsoDate(u.sourceDate) ?? extractDatesFromText(`${u.text}\n${u.note}`)[0];
    const officialDate = dates.find((x) => x.source === "as-of") ?? dates[0];
    return Boolean(d && officialDate && d.iso > officialDate.iso);
  });
  let truth_overcame_lie: LabeledScore;
  if (!sufficient || laterIndependent.length < 1 || !contradicted) {
    truth_overcame_lie = {
      value: null,
      status: "UNKNOWN",
      note: !sufficient
        ? "UNKNOWN — insufficient dated sources to say a later record overcame a false official line."
        : laterIndependent.length < 1
          ? "UNKNOWN — no later-dated independent upload relative to the as-of / earliest dated official layer."
          : "UNKNOWN — later-dated independent text is not in clear contradiction with the official line.",
    };
  } else {
    const laterBlob = join(laterIndependent.map((u) => join([u.text, u.note])));
    const align = 1 - jaccard(tokenize(laterBlob), officialTok);
    truth_overcame_lie = {
      value: clip01Safe(align * 0.85),
      status: "LABELED",
      note: `LABELED (not truth): later-dated independent upload(s) (${laterIndependent.map((u) => u.name).join(", ")}) diverge from the stated outcome. Not a court finding.`,
    };
  }

  let honesty_overall: LabeledScore;
  const pieces: number[] = [];
  if (truth_buried.status === "LABELED" && truth_buried.value != null) pieces.push(1 - truth_buried.value);
  if (truth_overcame_lie.status === "LABELED" && truth_overcame_lie.value != null) pieces.push(truth_overcame_lie.value);
  if (triadscore.posterior_mean != null) pieces.push(triadscore.posterior_mean);
  if (triad.final.score != null) pieces.push(triad.final.score);
  pieces.push(clce.triple);
  pieces.push(1 - spre.pc);
  if (!sufficient) {
    honesty_overall = {
      value: null,
      status: "UNKNOWN",
      note: "UNKNOWN — honesty_overall is not emitted without dated sources plus a stated outcome and a second layer.",
    };
  } else {
    const mean = pieces.reduce((a, b) => a + b, 0) / pieces.length;
    honesty_overall = {
      value: clip01Safe(Math.min(mean, 0.75)),
      status: "LABELED",
      note: "LABELED composite (capped at 0.75). Confidence is not truth. Mix of CLCE consistency, 1−SPRE.PC, triadscore posterior when 3-of-4, and available buried/overcame labels.",
    };
  }

  return {
    schema: HONESTY_SPEC,
    sufficient,
    truth_buried,
    truth_overcame_lie,
    honesty_overall,
    evidence,
    engines: { clce, spre, physling, triad, triadscore, zion, lattice },
    cites: [
      "https://github.com/AzielEliab/az-clce",
      "https://github.com/AzielEliab/az-clce/blob/main/docs/spre.md",
      "https://github.com/AzielEliab/az-clce/blob/main/docs/triad.md",
      "https://github.com/AzielEliab/aziel-corpus",
      "https://github.com/AzielEliab/zion-pattern-solver",
      "https://github.com/AzielEliab/AZCoherence",
      "AKM-TRIAD-1.0 (cite; posterior is a labeled score; Confidence is not truth)",
      "CL-WP-0.4 ChainLock hashchain (cite only; ephemeral lattice)",
      "NO-LIE-NO-REWRITE-1.0",
    ],
    limitation: HONESTY_LIMITATION,
    nolie: "NO-LIE: Whitestone will not invent a buried-truth or overcame-lie claim without dated sources or uploads in this session. UNKNOWN is the honest gap.",
    disclaimer: "Not a lawyer. Not legal advice. Scores are labeled advisory values. Confidence is not truth.",
  };
}

function clip01Safe(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function honestyFromSession(state: {
  facts: Record<string, string>;
  uploads: EvidenceFile[];
  asOfYear: number | null;
  asOfMonth: number | null;
  webNotes?: { title: string; url: string; excerpt: string; retrievedAt?: string }[];
  historicalSources?: { title: string; url: string; date?: string }[];
}): HonestyEvaluation {
  const asOfIso =
    state.asOfYear && state.asOfMonth ? `${state.asOfYear}-${String(state.asOfMonth).padStart(2, "0")}` : null;
  return evaluateHonesty({
    official: state.facts.official_narrative || state.facts.stated_outcome || "",
    statedOutcome: state.facts.stated_outcome || state.facts.goals || "",
    archival: state.facts.archival || "",
    physics: state.facts.physics || "",
    internal: state.facts.internal || "",
    asOfLabel: asOfIso,
    asOfIso,
    uploads: state.uploads,
    webNotes: state.webNotes,
    historicalSources: state.historicalSources,
  });
}
