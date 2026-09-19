import { emptySession, type MatterType, type PracticeArea, type SessionState } from "../types";

export const PRACTICE_AREAS: PracticeArea[] = ["criminal", "civil", "divorce"];

export const PRACTICE_LABELS: Record<PracticeArea, string> = {
  criminal: "Criminal",
  civil: "Civil",
  divorce: "Divorce",
};

export const PRACTICE_BLURBS: Record<PracticeArea, string> = {
  criminal: "Bail, arraignment, discovery, pleas, sentencing basics, expungement, and rights education. Not help committing a crime. Get a lawyer or public defender for serious charges.",
  civil: "Small claims, contracts, landlord-tenant, civil protection orders, name change, and debt-collection defense — high-level court self-help. Not business-formation mill advice.",
  divorce: "Divorce, custody, support, parentage, guardianship, family protection orders, and related family filings — the existing family-law track.",
};

export const PRACTICE_SUBTITLES: Record<PracticeArea, string> = {
  criminal: "Criminal — educational, not a lawyer",
  civil: "Civil — educational, not a lawyer",
  divorce: "Divorce / family — educational, not a lawyer",
};

export const MATTERS_BY_AREA: Record<PracticeArea, MatterType[]> = {
  divorce: [
    "divorce",
    "legal-separation",
    "custody",
    "parenting-time",
    "child-support",
    "spousal-support",
    "paternity",
    "guardianship",
    "protection-order",
    "adoption",
    "name-change",
  ],
  civil: [
    "small-claims",
    "contract-dispute",
    "landlord-tenant",
    "civil-protection-order",
    "name-change",
    "debt-collection",
  ],
  criminal: [
    "bail-arraignment",
    "discovery",
    "plea",
    "sentencing",
    "expungement",
    "rights-education",
  ],
};

export const PARTY_LABELS: Record<
  PracticeArea,
  { filing: string; other: string; filingRole: string; otherRole: string }
> = {
  divorce: {
    filing: "Filing party (petitioner)",
    other: "Other party (respondent)",
    filingRole: "Petitioner",
    otherRole: "Respondent",
  },
  civil: {
    filing: "Filing party (plaintiff)",
    other: "Other party (defendant)",
    filingRole: "Plaintiff",
    otherRole: "Defendant",
  },
  criminal: {
    filing: "Your name (defendant)",
    other: "The State / People / complaining witness",
    filingRole: "Defendant",
    otherRole: "Prosecution",
  },
};

export function isPracticeArea(value: unknown): value is PracticeArea {
  return value === "criminal" || value === "civil" || value === "divorce";
}

export function mattersForArea(area: PracticeArea | null | undefined): MatterType[] {
  if (!area) return PRACTICE_AREAS.flatMap((a) => MATTERS_BY_AREA[a]);
  return MATTERS_BY_AREA[area];
}

export function areasForMatter(matter: MatterType): PracticeArea[] {
  return PRACTICE_AREAS.filter((area) => MATTERS_BY_AREA[area].includes(matter));
}

export function matterBelongsToArea(matter: MatterType | null | undefined, area: PracticeArea | null | undefined): boolean {
  if (!matter) return true;
  if (!area) return true;
  return MATTERS_BY_AREA[area].includes(matter);
}

export function hasAreaSpecificState(state: SessionState): boolean {
  return Boolean(
    state.matter ||
      state.messages.length ||
      state.uploads.length ||
      state.webNotes.length ||
      state.children.length ||
      Object.keys(state.answers).length ||
      Object.keys(state.facts).some((k) => Boolean(state.facts[k]?.trim())) ||
      state.parties.some((p) => p.name.trim()) ||
      state.asOfYear != null ||
      state.asOfMonth != null,
  );
}

export function clearAreaSpecificState(state: SessionState): SessionState {
  const base = emptySession();
  return {
    ...state,
    matter: null,
    parties: base.parties,
    children: [],
    facts: {},
    answers: {},
    uploads: [],
    mappings: [],
    messages: [],
    learned: base.learned,
    currentQuestionId: null,
    webNotes: [],
    webStatus: state.webEnabled ? "idle" : "off",
    webMessage: "",
    asOfYear: null,
    asOfMonth: null,
  };
}

export function defaultResearchQuery(area: PracticeArea | null | undefined): string {
  if (area === "criminal") return "official self-help criminal court rights public defender";
  if (area === "civil") return "official self-help small claims civil court forms";
  return "official self-help clerk packet forms";
}

export function jurisdictionCopy(area: PracticeArea | null | undefined): { heading: string; body: string } {
  if (area === "criminal") {
    return {
      heading: "Where is the criminal case pending?",
      body: "Pick the state or D.C. of the court that has (or will have) the case. This is not a venue opinion. Criminal cases are often in a different division than family or civil. Confirm the clerk. For serious charges, contact a lawyer or the public defender.",
    };
  }
  if (area === "civil") {
    return {
      heading: "Where will the civil case be heard?",
      body: "Pick the state or D.C. of the court you expect to use. Small-claims, housing, and general civil may be different dockets or dollar limits. This is not a jurisdiction opinion. Confirm the clerk.",
    };
  }
  return {
    heading: "Where will the case be heard?",
    body: "Pick the state or D.C. of the court you expect to use. This is not a jurisdiction opinion. Child-custody venue often follows the child's home state (UCCJEA), which may differ from where you live now.",
  };
}
