import { getJurisdiction } from "../knowledge";
import type { PracticeArea } from "../types";
import { dateOnOrBeforeAsOf, isInForceAsOf } from "./asof";
import { LAW_RECORDS } from "./records";
import {
  lawKindForArea,
  type AsOfMonth,
  type JurisdictionCoverageStatus,
  type LawKind,
  type LawRecord,
} from "./types";

export const FEDERAL_JURISDICTION = "US";

export interface JurisdictionHook {
  code: string | null;
  name: string;
  status: JurisdictionCoverageStatus;
  note: string;
  datedRecordCount: number;
}

export function isFederalJurisdiction(code: string | null | undefined): boolean {
  if (!code) return false;
  const c = code.trim().toUpperCase();
  return c === "US" || c === "USA" || c === "FED" || c === "FEDERAL" || c === "US-FED" || c === "US-CONST";
}

export function recordsForJurisdiction(code: string | null | undefined): LawRecord[] {
  if (!code) return [];
  const c = code.trim().toUpperCase();
  if (isFederalJurisdiction(c)) return LAW_RECORDS.filter((r) => r.jurisdiction === FEDERAL_JURISDICTION);
  return LAW_RECORDS.filter((r) => r.jurisdiction.toUpperCase() === c);
}

export function jurisdictionHook(code: string | null | undefined): JurisdictionHook {
  if (!code) {
    return {
      code: null,
      name: "No session jurisdiction",
      status: "FEDERAL-ONLY",
      note: "No state was chosen. Only the seeded federal timeline can be compared. State historical statutes are UNKNOWN.",
      datedRecordCount: LAW_RECORDS.filter((r) => r.jurisdiction === FEDERAL_JURISDICTION).length,
    };
  }
  if (isFederalJurisdiction(code)) {
    const n = recordsForJurisdiction(code).length;
    return {
      code: code.toUpperCase(),
      name: "United States (federal)",
      status: "PARTIAL",
      note: "Federal coverage is a seeded constitutional and major-statute timeline — not every Act of Congress since 1789.",
      datedRecordCount: n,
    };
  }
  const profile = getJurisdiction(code);
  const local = recordsForJurisdiction(code);
  if (local.length === 0) {
    return {
      code: code.toUpperCase(),
      name: profile?.name ?? code.toUpperCase(),
      status: "UNKNOWN",
      note: `${profile?.name ?? code.toUpperCase()} historical statutes, session laws, and local rules are UNKNOWN in this bundle. Federal seeded milestones may still overlay. Whitestone will not invent a state code section for a past year.`,
      datedRecordCount: 0,
    };
  }
  return {
    code: code.toUpperCase(),
    name: profile?.name ?? code.toUpperCase(),
    status: "PARTIAL",
    note: `${profile?.name ?? code.toUpperCase()} has ${local.length} dated record(s) only — not a complete state code.`,
    datedRecordCount: local.length,
  };
}

function kindMatches(record: LawRecord, kind: LawKind | "all"): boolean {
  if (kind === "all") return true;
  return record.kind === kind;
}

export function standingAsOf(opts: {
  asOf: AsOfMonth;
  kind?: LawKind | "all";
  area?: PracticeArea | null;
  jurisdiction?: string | null;
  includeFederal?: boolean;
}): LawRecord[] {
  const kind = opts.kind ?? lawKindForArea(opts.area);
  const includeFederal = opts.includeFederal !== false;
  const seen = new Set<string>();
  const rows: LawRecord[] = [];
  const pool: LawRecord[] = [];
  if (includeFederal) pool.push(...LAW_RECORDS.filter((r) => r.jurisdiction === FEDERAL_JURISDICTION));
  if (opts.jurisdiction && !isFederalJurisdiction(opts.jurisdiction)) {
    pool.push(...recordsForJurisdiction(opts.jurisdiction));
  }
  for (const record of pool) {
    if (!kindMatches(record, kind)) continue;
    if (record.event_type === "repeal" || record.event_type === "remove") continue;
    if (!isInForceAsOf(record.effective_from, record.effective_to, opts.asOf)) continue;
    const key = `${record.jurisdiction}|${record.kind}|${record.citation}|${record.event_type}|${record.effective_from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(record);
  }
  return rows.sort((a, b) => a.effective_from.localeCompare(b.effective_from) || a.citation.localeCompare(b.citation));
}

export function timelineAsOf(opts: {
  asOf: AsOfMonth;
  kind?: LawKind | "all";
  area?: PracticeArea | null;
  citation?: string;
  query?: string;
}): LawRecord[] {
  const kind = opts.kind ?? lawKindForArea(opts.area);
  const q = (opts.query ?? "").toLowerCase();
  const cite = (opts.citation ?? "").toLowerCase();
  return LAW_RECORDS.filter((record) => {
    if (!kindMatches(record, kind)) return false;
    if (!dateOnOrBeforeAsOf(record.effective_from, opts.asOf)) return false;
    if (cite && !record.citation.toLowerCase().includes(cite) && !record.title.toLowerCase().includes(cite)) {
      return false;
    }
    if (q && !recordMatchesQuery(record, q)) return false;
    return true;
  }).sort((a, b) => a.effective_from.localeCompare(b.effective_from));
}

export function scoreRecordQuery(record: LawRecord, query: string): number {
  const q = query.toLowerCase();
  const bag = `${record.citation} ${record.title} ${record.notes} ${record.event_type} ${record.kind}`.toLowerCase();
  const tokens = q
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (!tokens.length) return 0;
  let score = 0;
  for (const row of ALIASES) {
    if (!row.needles.some((n) => q.includes(n))) continue;
    if (row.ids.includes(record.id) || row.ids.some((id) => record.id.startsWith(id))) score += 12;
  }
  const distinctive = tokens.filter((t) => !STOP.has(t));
  for (const t of distinctive) {
    if (bag.includes(t)) score += t.length > 6 ? 3 : 2;
  }
  return score;
}

export function recordMatchesQuery(record: LawRecord, query: string): boolean {
  return scoreRecordQuery(record, query) >= 4;
}

const STOP = new Set(["was", "the", "and", "for", "that", "this", "with", "from", "force", "what", "were"]);

const ALIASES: { needles: string[]; ids: string[] }[] = [
  { needles: ["prohibition", "18th", "eighteenth", "volstead"], ids: ["us-const-amdt-18", "volstead-1919", "volstead-repeal-1933", "us-const-amdt-21"] },
  { needles: ["bill of rights", "first ten"], ids: ["us-const-amdt-01-10"] },
  { needles: ["fourth", "4th", "search", "seizure"], ids: ["us-const-amdt-04"] },
  { needles: ["fifth", "5th", "self-incrimination", "miranda"], ids: ["us-const-amdt-05"] },
  { needles: ["sixth", "6th", "counsel", "speedy"], ids: ["us-const-amdt-06"] },
  { needles: ["thirteenth", "13th", "slavery"], ids: ["us-const-amdt-13"] },
  { needles: ["fourteenth", "14th", "equal protection"], ids: ["us-const-amdt-14"] },
  { needles: ["nineteenth", "19th", "suffrage"], ids: ["us-const-amdt-19"] },
  { needles: ["civil rights act of 1964", "cra 1964", "1964 civil"], ids: ["cra-1964"] },
  { needles: ["fair housing", "1968"], ids: ["fair-housing-1968"] },
  { needles: ["fdcpa", "debt collection", "collector"], ids: ["fdcpa-1978"] },
  { needles: ["pkpa", "parental kidnapping", "custody determination"], ids: ["pkpa-1980"] },
  { needles: ["chinese exclusion", "magnuson"], ids: ["chinese-exclusion-1882", "magnuson-1943-repeal"] },
  { needles: ["voting rights act", "vra"], ids: ["vra-1965"] },
  { needles: ["constitution", "founding"], ids: ["us-const-1789"] },
];
