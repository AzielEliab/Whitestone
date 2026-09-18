import type { MatterType, PracticeArea } from "../types";

export type SourceKind =
  | "state-judiciary"
  | "legal-aid"
  | "state-bar"
  | "lii"
  | "justia"
  | "federal-public";

export type ResearchReason = "ask" | "filing" | "manual";

export interface AllowMatch {
  kind: SourceKind;
  label: string;
}

export interface ResearchSeed {
  title: string;
  url: string;
  kind: SourceKind;
  label: string;
}

export interface WebSource {
  title: string;
  url: string;
  excerpt: string;
  retrievedAt: string;
  kind: SourceKind;
  label: string;
}

export interface ResearchInput {
  jurisdiction: string | null;
  matter: MatterType | null;
  practiceArea: PracticeArea | null;
  query: string;
  reason: ResearchReason;
}

export interface ResearchResult {
  ok: boolean;
  capability: "allowlisted-public-pages";
  sources: WebSource[];
  notes: string;
  unavailable: boolean;
  failed: { url: string; reason: string }[];
  fetched: number;
  cached: number;
}

export const RESEARCH_CAPABILITY = "allowlisted-public-pages" as const;
export const MAX_QUERY_CHARS = 400;
export const MAX_SOURCES = 4;
export const MAX_EXCERPT_CHARS = 700;
export const MAX_SESSION_SOURCES = 12;
