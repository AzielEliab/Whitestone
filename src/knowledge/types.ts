import type { CoverageLevel, MatterType, PracticeArea } from "../types";

export interface JurisdictionProfile {
  code: string;
  name: string;
  coverage: CoverageLevel;
  courtName: string;
  venueNote: string;
  residencyDivorce: string;
  waitingOrSeparation: string;
  propertyRegime: "community" | "equitable";
  childSupportModel: "income-shares" | "percentage-of-income" | "melson";
  childSupportEnds: string;
  childSupportGuidelines: string;
  childSupportAgency: string;
  legalSeparation: string;
  protectionOrderName: string;
  nameChangeNote: string;
  selfHelpUrl: string;
  uniqueNotes: string[];
  filingTips: string[];
}

export interface TopicModule {
  id: MatterType;
  title: string;
  coverage: CoverageLevel;
  summary: string;
  issueTree: { id: string; label: string; children?: { id: string; label: string }[] }[];
  questions: { id: string; prompt: string; why: string; options?: string[] }[];
  documentChecklist: string[];
  evidenceIdeas: { issue: string; examples: string[] }[];
  filingPathway: string[];
  honesty: string[];
  keywords: string[];
}

export interface FrameworkNote {
  id: string;
  title: string;
  coverage: CoverageLevel;
  body: string;
  areas?: PracticeArea[];
}

export interface RetrievalHit {
  score: number;
  source: "topic" | "jurisdiction" | "federal" | "session";
  title: string;
  body: string;
  topicId?: MatterType;
  jurisdiction?: string;
}
