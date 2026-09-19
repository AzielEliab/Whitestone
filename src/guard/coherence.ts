import type { ResearchResult } from "../research/types";
import { runDecisionGate, type DecisionGateReport } from "./decisiongate";
import { COHERENCE_CITE, COHERENCE_MOTTO, RESPONSIBILITY_LINE } from "./nolie";

export type CoherenceVerdict = "PASS" | "FLAG" | "NEUTRALIZE" | "REFUSE";

export interface GroundingEvidence {
  kind: "session" | "research" | "knowledge" | "stat" | "math";
  label: string;
  ref?: string;
}

export interface CoherenceReport {
  verdict: CoherenceVerdict;
  motto: typeof COHERENCE_MOTTO;
  cite: typeof COHERENCE_CITE;
  confidenceCap: number;
  primary: string;
  alternate: string;
  emitted: string;
  flags: string[];
  evidence: GroundingEvidence[];
  decisionGate: DecisionGateReport;
}

const CASE_CITE = /\b[A-Z][A-Za-z]+ v\. [A-Z][A-Za-z]+|\b\d+ U\.S\. \d+|\b\d+ S\. ?Ct\.|\bF\.\d+d \d+/;
const FORM_MANDATE =
  /\byou must file form [a-z0-9-]+(?:\s+by\b)?|\bfile form [a-z0-9-]{2,} by\b|\bthe deadline is (january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2})/i;
const BARE_STAT = /\b(?:exactly |precisely )?\d{2,3}(?:\.\d+)?%/i;
const OUTCOME = /\byou will (be convicted|be acquitted|go to jail|win|lose|be found guilty)\b/i;
const ABSOLUTE = /\b(you must|you are required to|the court will definitely|guaranteed)\b/i;
const HISTORICAL_LAW =
  /\b(in|as of)\s+(1[7-9]\d{2}|20\d{2})\b.{0,120}\b(the law said|the statute required|held that)\b|\bthe law said\b.{0,80}\b(1[7-9]\d{2}|20\d{2})\b/i;

export function buildAlternate(opts: {
  grounded: string;
  evidence: GroundingEvidence[];
}): string {
  const ev = opts.evidence.slice(0, 6).map((e) => `• ${e.label}${e.ref ? ` (${e.ref})` : ""}`);
  return [
    COHERENCE_MOTTO,
    "Safer phrasing from grounded materials only — session facts, allowlisted excerpts, bundled knowledge, and labeled stats/math. Gaps stay gaps.",
    opts.grounded.trim() || "No extra grounded paragraph was available. Ask the clerk for the current packet rather than filling the gap.",
    ev.length ? `Evidence used:\n${ev.join("\n")}` : "Evidence used: none beyond the educational disclaimer.",
    RESPONSIBILITY_LINE,
  ].join("\n\n");
}

export function collectEvidence(opts: {
  sessionFacts: string;
  research?: ResearchResult | null;
  knowledgeBits?: string[];
  statIds?: string[];
  statUrls?: string[];
  mathLabeled?: boolean;
}): GroundingEvidence[] {
  const evidence: GroundingEvidence[] = [];
  if (opts.sessionFacts.trim()) {
    evidence.push({ kind: "session", label: opts.sessionFacts.slice(0, 220) });
  }
  for (const source of opts.research?.sources ?? []) {
    evidence.push({
      kind: "research",
      label: source.title,
      ref: source.url,
    });
  }
  for (const bit of opts.knowledgeBits ?? []) {
    if (bit.trim()) evidence.push({ kind: "knowledge", label: bit.slice(0, 180) });
  }
  for (let i = 0; i < (opts.statIds ?? []).length; i++) {
    evidence.push({
      kind: "stat",
      label: opts.statIds![i],
      ref: opts.statUrls?.[i],
    });
  }
  if (opts.mathLabeled) {
    evidence.push({ kind: "math", label: "Labeled HEURISTIC / public-schedule math in this reply" });
  }
  return evidence;
}

export function detectUnsupported(primary: string, grounded: string, statIds: string[]): string[] {
  const flags: string[] = [];
  const lowerGround = grounded.toLowerCase();
  if (CASE_CITE.test(primary) && !/https:\/\//i.test(primary) && !lowerGround.includes("does not invent case citations")) {
    flags.push("case-like citation without a source URL");
  }
  if (FORM_MANDATE.test(primary) && !/https:\/\//i.test(primary) && !/verify with the clerk|overview, verify/i.test(primary)) {
    flags.push("absolute filing mandate (form/date) without grounded evidence");
  }
  if (BARE_STAT.test(primary) && statIds.length === 0 && !/HEURISTIC|public schedule|retrieved |source:/i.test(primary)) {
    flags.push("statistic without a bundled stat id or source");
  }
  if (hasBareOutcomePrediction(primary)) {
    flags.push("criminal or case-outcome prediction");
  }
  if (ABSOLUTE.test(primary) && !/verify|clerk|overview|educational|not legal advice/i.test(primary)) {
    flags.push("absolute legal mandate without clerk-verify language");
  }
  if (
    HISTORICAL_LAW.test(primary) &&
    !/https:\/\//i.test(primary) &&
    !/dated record|seeded|will not (invent|state)|REFUSE/i.test(primary) &&
    !lowerGround.includes("archives.gov") &&
    !lowerGround.includes("constitution.congress.gov")
  ) {
    flags.push("uncitable historical law claim without a dated record");
  }
  return flags;
}

function hasBareOutcomePrediction(text: string): boolean {
  return text.split(/(?<=[.!?])\s+/).some((sentence) => OUTCOME.test(sentence) && !/not a prediction/i.test(sentence));
}

export function neutralizeText(primary: string): string {
  const kept = primary
    .split(/\n{2,}/)
    .filter((block) => {
      if (CASE_CITE.test(block) && !/https:\/\//i.test(block) && !/does not invent/i.test(block)) return false;
      if (FORM_MANDATE.test(block)) return false;
      if (OUTCOME.test(block)) return false;
      if (BARE_STAT.test(block) && !/HEURISTIC|source:|stat id|retrieved /i.test(block)) return false;
      return true;
    })
    .join("\n\n")
    .trim();
  const note =
    "Neutralized: unsupported claim tokens (invented forms, uncited stats, outcome predictions, or absolute mandates without evidence) were stripped. Confidence is not truth.";
  return kept ? `${note}\n\n${kept}` : `${note}\n\nI will not state an ungrounded claim. Ask the clerk for the current packet or add session facts.`;
}

export function coherenceCheck(opts: {
  primary: string;
  sessionFacts: string;
  userText?: string;
  research?: ResearchResult | null;
  knowledgeBits?: string[];
  statIds?: string[];
  statUrls?: string[];
  mathLabeled?: boolean;
  contradictsSession?: boolean;
}): CoherenceReport {
  const evidence = collectEvidence(opts);
  const grounded = [
    opts.sessionFacts,
    ...(opts.knowledgeBits ?? []),
    ...(opts.research?.sources ?? []).map((s) => `${s.title} ${s.excerpt} ${s.url}`),
    ...(opts.statIds ?? []),
  ].join("\n");
  const flags = detectUnsupported(opts.primary, grounded, opts.statIds ?? []);
  const alternate = buildAlternate({ grounded: opts.sessionFacts, evidence });
  const decisionGate = runDecisionGate({
    claim: opts.primary,
    groundedText: grounded,
    sessionFacts: opts.sessionFacts,
    userText: opts.userText,
    contradictsSession: opts.contradictsSession,
  });

  let verdict: CoherenceVerdict = "PASS";
  let emitted = opts.primary;
  let confidenceCap = 0.72;

  const alreadyEducationalRefuse = /will not help commit a crime|will not invent case citations|I will not state that ungrounded/i.test(
    opts.primary,
  );

  if (
    (decisionGate.action === "refuse" && !alreadyEducationalRefuse) ||
    flags.includes("criminal or case-outcome prediction") ||
    flags.includes("case-like citation without a source URL") ||
    flags.includes("uncitable historical law claim without a dated record")
  ) {
    verdict = "REFUSE";
    confidenceCap = 0;
    emitted = [
      "REFUSE — I will not state that ungrounded claim.",
      flags.length ? `Flags: ${flags.join("; ")}.` : "",
      "Ask the clerk for the current packet, or add facts this session can see. I do not invent citations, form numbers, or statistics.",
      COHERENCE_MOTTO,
      RESPONSIBILITY_LINE,
    ]
      .filter(Boolean)
      .join("\n\n");
  } else if (alreadyEducationalRefuse && decisionGate.action === "refuse") {
    verdict = "REFUSE";
    confidenceCap = 0;
    emitted = opts.primary;
  } else if (flags.length || decisionGate.action === "rewrite") {
    const hardish = flags.some((f) => /mandate|statistic|form/i.test(f));
    verdict = hardish ? "NEUTRALIZE" : "FLAG";
    confidenceCap = hardish ? 0.28 : 0.45;
    emitted = hardish ? neutralizeText(opts.primary) : `${opts.primary}\n\nFLAG — thin or absolute language. ${COHERENCE_MOTTO} ${RESPONSIBILITY_LINE}`;
  } else if (evidence.length < 2) {
    verdict = "FLAG";
    confidenceCap = 0.5;
    emitted = `${opts.primary}\n\nFLAG — evidence list is thin. ${COHERENCE_MOTTO}`;
  } else {
    verdict = "PASS";
    confidenceCap = 0.68;
    emitted = opts.primary;
  }

  return {
    verdict,
    motto: COHERENCE_MOTTO,
    cite: COHERENCE_CITE,
    confidenceCap,
    primary: opts.primary,
    alternate,
    emitted,
    flags,
    evidence,
    decisionGate,
  };
}
