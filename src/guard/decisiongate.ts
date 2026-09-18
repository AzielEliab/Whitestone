import { criminalRefuse } from "../practice/refuse";
import { RESPONSIBILITY_LINE, DECISIONGATE_CITE } from "./nolie";

export type GateName = "definition" | "evidence" | "impact" | "integrity" | "responsibility";

export interface GateResult {
  name: GateName;
  pass: boolean;
  hard: boolean;
  note: string;
}

export interface DecisionGateReport {
  results: GateResult[];
  action: "ok" | "rewrite" | "refuse";
  cite: typeof DECISIONGATE_CITE;
  responsibility: typeof RESPONSIBILITY_LINE;
}

export interface DecisionGateContext {
  claim: string;
  groundedText: string;
  sessionFacts: string;
  userText?: string;
  contradictsSession?: boolean;
}

const BOLD_CLAIM =
  /\b(you must|you will|file form|form [a-z0-9-]{2,}|shall file|deadline is|the court will|you are required)\b/i;

export function isBoldClaim(text: string): boolean {
  return BOLD_CLAIM.test(text);
}

export function runDecisionGate(ctx: DecisionGateContext): DecisionGateReport {
  const claim = ctx.claim.trim();
  const grounded = `${ctx.groundedText}\n${ctx.sessionFacts}`.toLowerCase();
  const results: GateResult[] = [];

  const defined = claim.length > 12;
  results.push({
    name: "definition",
    pass: defined,
    hard: false,
    note: defined ? "Claim is stated as a sentence." : "Claim is too thin to review.",
  });

  const hasCite = /https:\/\//i.test(claim) || /\b(stat id|source:|retrieved |bundled|overview, verify|HEURISTIC)\b/i.test(claim);
  const echoed = tokensIn(claim).some((t) => t.length > 5 && grounded.includes(t));
  const evidencePass = hasCite || echoed || !isBoldClaim(claim);
  results.push({
    name: "evidence",
    pass: evidencePass,
    hard: isBoldClaim(claim) && !hasCite && !echoed,
    note: evidencePass
      ? "Claim is backed by a source, session fact, or is not a bold mandate."
      : "Bold claim lacks a source URL, bundled stat id, or session fact.",
  });

  const impactPass =
    !/\bguaranteed\b/i.test(claim) &&
    !claim
      .split(/(?<=[.!?])\s+/)
      .some(
        (sentence) =>
          /\byou will (win|lose|be convicted|be acquitted|go to jail)\b/i.test(sentence) &&
          !/not a prediction/i.test(sentence),
      );
  results.push({
    name: "impact",
    pass: impactPass,
    hard: !impactPass,
    note: impactPass ? "No outcome prediction." : "Outcome prediction is outside educational scope.",
  });

  const refuse = ctx.userText ? criminalRefuse(ctx.userText) : null;
  const integrityPass = !ctx.contradictsSession && !refuse;
  results.push({
    name: "integrity",
    pass: integrityPass,
    hard: Boolean(refuse),
    note: refuse
      ? refuse
      : ctx.contradictsSession
        ? "Claim contradicts an answer already in this session. User facts are not rewritten."
        : "No integrity clash with session facts or refuse rules.",
  });

  results.push({
    name: "responsibility",
    pass: true,
    hard: false,
    note: RESPONSIBILITY_LINE,
  });

  const hardFail = results.some((r) => !r.pass && r.hard);
  const softFail = results.some((r) => !r.pass && !r.hard);
  return {
    results,
    action: hardFail ? "refuse" : softFail ? "rewrite" : "ok",
    cite: DECISIONGATE_CITE,
    responsibility: RESPONSIBILITY_LINE,
  };
}

function tokensIn(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 4);
}
