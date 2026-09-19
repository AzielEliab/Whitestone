import type { WebSource } from "./research/types";

export type { SourceKind, WebSource } from "./research/types";

export type CoverageLevel = "procedural-overview" | "checklist" | "federal-framework";

export type PracticeArea = "criminal" | "civil" | "divorce";

export type MatterType =
  | "divorce"
  | "legal-separation"
  | "custody"
  | "parenting-time"
  | "child-support"
  | "spousal-support"
  | "paternity"
  | "guardianship"
  | "protection-order"
  | "adoption"
  | "name-change"
  | "small-claims"
  | "contract-dispute"
  | "landlord-tenant"
  | "civil-protection-order"
  | "debt-collection"
  | "bail-arraignment"
  | "discovery"
  | "plea"
  | "sentencing"
  | "expungement"
  | "rights-education";

export type AppStep =
  | "welcome"
  | "jurisdiction"
  | "matter"
  | "facts"
  | "evidence"
  | "advise"
  | "filing";

export type ThemeMode = "light" | "dark" | "system";

export interface Party {
  role: "petitioner" | "respondent" | "other";
  name: string;
  relationship: string;
}

export interface Child {
  name: string;
  age: string;
  livesWith: string;
}

export interface EvidenceFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  addedAt: string;
  text: string;
  note: string;
  previewUrl?: string;
}

export interface EvidenceMapping {
  evidenceId: string;
  fileName: string;
  snippet: string;
  issueId: string;
  issueLabel: string;
  allegation: string;
}

export type WebStatus = "idle" | "loading" | "ok" | "unavailable" | "blocked" | "off";

export type GroundingVerdict = "PASS" | "FLAG" | "NEUTRALIZE" | "REFUSE";

export interface GroundingChip {
  verdict: GroundingVerdict;
  confidenceCap: number;
  flags: string[];
  evidence: { kind: string; label: string; ref?: string }[];
  motto: string;
}

export interface SessionReceiptChip {
  sha256: string;
  sourceUrls: string[];
  statIds: string[];
}

export interface ChatMessage {
  id: string;
  role: "advisor" | "user" | "system";
  text: string;
  at: string;
  sources?: WebSource[];
  followUps?: string[];
  grounding?: GroundingChip;
  receipt?: SessionReceiptChip;
}

export interface GuidedQuestion {
  id: string;
  prompt: string;
  why: string;
  options?: string[];
  freeText?: boolean;
}

export interface LearnedSession {
  keywords: string[];
  priorities: string[];
  safetyFlag: boolean;
  contested: boolean | null;
  notes: string[];
}

export interface SessionState {
  version: 1;
  createdAt: string;
  disclaimerAccepted: boolean;
  practiceArea: PracticeArea | null;
  step: AppStep;
  jurisdiction: string | null;
  matter: MatterType | null;
  parties: Party[];
  children: Child[];
  facts: Record<string, string>;
  answers: Record<string, string>;
  uploads: EvidenceFile[];
  mappings: EvidenceMapping[];
  messages: ChatMessage[];
  learned: LearnedSession;
  currentQuestionId: string | null;
  webEnabled: boolean;
  webNotes: WebSource[];
  webStatus: WebStatus;
  webMessage: string;
  historicalMode: boolean;
  asOfYear: number | null;
  asOfMonth: number | null;
}

export const MATTER_LABELS: Record<MatterType, string> = {
  divorce: "Divorce / dissolution",
  "legal-separation": "Legal separation",
  custody: "Custody / decision-making",
  "parenting-time": "Parenting time",
  "child-support": "Child support",
  "spousal-support": "Spousal support / alimony",
  paternity: "Parentage / paternity",
  guardianship: "Guardianship",
  "protection-order": "Protection / restraining order (family)",
  adoption: "Adoption (overview)",
  "name-change": "Name change",
  "small-claims": "Small claims",
  "contract-dispute": "Contract dispute (overview)",
  "landlord-tenant": "Landlord-tenant (overview)",
  "civil-protection-order": "Civil protection / harassment order",
  "debt-collection": "Debt-collection defense (overview)",
  "bail-arraignment": "Bail / arraignment",
  discovery: "Discovery (criminal)",
  plea: "Plea process (overview)",
  sentencing: "Sentencing basics",
  expungement: "Expungement / record relief (overview)",
  "rights-education": "Rights education",
};

export const STEP_LABELS: Record<AppStep, string> = {
  welcome: "Welcome",
  jurisdiction: "Jurisdiction",
  matter: "Matter",
  facts: "People & facts",
  evidence: "Evidence",
  advise: "Guided advisor",
  filing: "Filing structure",
};

export function emptySession(): SessionState {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    disclaimerAccepted: false,
    practiceArea: null,
    step: "welcome",
    jurisdiction: null,
    matter: null,
    parties: [
      { role: "petitioner", name: "", relationship: "Self / filing party" },
      { role: "respondent", name: "", relationship: "Other party" },
    ],
    children: [],
    facts: {},
    answers: {},
    uploads: [],
    mappings: [],
    messages: [],
    learned: {
      keywords: [],
      priorities: [],
      safetyFlag: false,
      contested: null,
      notes: [],
    },
    currentQuestionId: null,
    webEnabled: true,
    webNotes: [],
    webStatus: "idle",
    webMessage: "",
    historicalMode: false,
    asOfYear: null,
    asOfMonth: null,
  };
}
