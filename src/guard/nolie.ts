/** NO-LIE-NO-REWRITE-1.0 — product law (cite only; not the fabric runtime). */

export const NO_LIE_LAW = {
  id: "NO-LIE-NO-REWRITE-1.0",
  cite: "https://github.com/AzielEliab/aziel-runtime (docs/designs/NO-LIE-NO-REWRITE-1.0.md) — cited, not vendored",
  rules: [
    "Claims that still hash to their sources (cite a URL or bundled stat id).",
    "No rewrite of user facts.",
    "Never lie to be helpful or to fill gaps.",
    "Prefer refuse / unknown over fabrication.",
  ],
} as const;

export const COHERENCE_MOTTO = "Confidence is not truth. Never invent evidence.";

export const COHERENCE_CITE =
  "AZCoherence-inspired anti-hallucination (AZC-0.1 / AZC-WP-0.1) — ported logic, not the full runtime. https://github.com/AzielEliab/AZCoherence";

export const DECISIONGATE_CITE =
  "DecisionGATE-lite (five gates) — helpful sibling, not the fabric door. https://github.com/AzielEliab/decisiongate";

export const RESPONSIBILITY_LINE =
  "Responsibility: you and the clerk or counsel own the decision. Whitestone is educational software, not a lawyer, and not a prediction.";
