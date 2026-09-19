import type { PracticeArea } from "../types";

export type LawKind = "civil" | "criminal";
export type LawEventType = "enact" | "amend" | "repeal" | "add" | "remove";
export type JurisdictionCoverageStatus = "PARTIAL" | "UNKNOWN" | "FEDERAL-ONLY";

export interface AsOfMonth {
  year: number;
  month: number;
}

export interface LawRecord {
  id: string;
  jurisdiction: string;
  kind: LawKind;
  citation: string;
  title: string;
  effective_from: string;
  effective_to: string | null;
  event_type: LawEventType;
  sourceTitle: string;
  sourceUrl: string;
  notes: string;
}

export function lawKindForArea(area: PracticeArea | null | undefined): LawKind | "all" {
  if (area === "criminal") return "criminal";
  if (area === "civil" || area === "divorce") return "civil";
  return "all";
}

export function assertLawRecord(record: LawRecord): void {
  if (!record.id.trim()) throw new Error("Law record missing id");
  if (!record.jurisdiction.trim()) throw new Error(`Law ${record.id} missing jurisdiction`);
  if (record.kind !== "civil" && record.kind !== "criminal") {
    throw new Error(`Law ${record.id} kind must be civil or criminal`);
  }
  if (!record.citation.trim()) throw new Error(`Law ${record.id} missing citation`);
  if (!record.title.trim()) throw new Error(`Law ${record.id} missing title`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.effective_from)) {
    throw new Error(`Law ${record.id} effective_from must be YYYY-MM-DD`);
  }
  if (record.effective_to !== null && !/^\d{4}-\d{2}-\d{2}$/.test(record.effective_to)) {
    throw new Error(`Law ${record.id} effective_to must be YYYY-MM-DD or null`);
  }
  if (!["enact", "amend", "repeal", "add", "remove"].includes(record.event_type)) {
    throw new Error(`Law ${record.id} event_type is not allowed`);
  }
  if (!record.sourceTitle.trim()) throw new Error(`Law ${record.id} missing sourceTitle`);
  if (!record.sourceUrl.trim()) throw new Error(`Law ${record.id} missing sourceUrl`);
  if (!/^https:\/\//i.test(record.sourceUrl)) {
    throw new Error(`Law ${record.id} sourceUrl must be https`);
  }
}

export const CORPUS_HONESTY =
  "Whitestone does not ship a complete digitized corpus of every U.S. law since 1776. The as-of engine uses a seeded federal constitutional and major-statute timeline with source URLs. State, territorial, and most local historical statutes are UNKNOWN unless a dated record exists. This is not a lawyer and not legal advice. Holdings and statutes that are not in a dated record are refused, not invented.";

export const HISTORICAL_DISCLAIMER =
  "Historical as-of evaluation is educational archival comparison only. It is not a reconstruction of a court's holding, not an annotated code, and not legal advice. Prefer the official reporter, the clerk, a law library, or counsel.";
