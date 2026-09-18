import { looksLikeMath } from "../math";
import type { SessionState } from "../types";

export type AdvisorIntent =
  | "safety"
  | "math"
  | "stats"
  | "deadlines"
  | "forms"
  | "venue"
  | "evidence"
  | "process"
  | "next"
  | "citation"
  | "support"
  | "bail"
  | "reason"
  | "general";

export function routeIntent(text: string, state: SessionState): AdvisorIntent {
  const q = text.toLowerCase();
  if (state.learned.safetyFlag && /\b(danger|afraid|protect|restrain|911|hit|threat|stalk)\b/.test(q)) {
    return "safety";
  }
  if (/citation|case law|held that|precedent/.test(q)) return "citation";
  if (/\b(statistic|stats?|numbers say|how common|what (are|do) the numbers|plea rate|pro se rate|caseload)\b/.test(q)) {
    return "stats";
  }
  if (looksLikeMath(text) || /\b(calculate|how much is|percent of|interest on|days from)\b/.test(q)) {
    return "math";
  }
  if (/\b(deadline|how many days|calendar|business day|statute of limitation)\b/.test(q)) return "deadlines";
  if (/\b(form|packet|worksheet|caption|what do i file|which papers)\b/.test(q)) return "forms";
  if (/\b(where (to|do i) file|venue|which court|clerk|courthouse)\b/.test(q)) return "venue";
  if (/\b(evidence|upload|exhibit|what does (this|my) (file|photo|paper)|map (the )?(file|evidence))\b/.test(q)) {
    return "evidence";
  }
  if (/\b(child support|guideline|how much support)\b/.test(q) && state.practiceArea !== "criminal") return "support";
  if (/\b(bail|bond|10% of)\b/.test(q) && state.practiceArea === "criminal") return "bail";
  if (/\b(what should i do next|working plan|next step|priorit)\b/.test(q)) return "next";
  if (/\b(irac|issue spot|apply (the )?rule|argument map|why does this matter|walk me through)\b/.test(q)) {
    return "reason";
  }
  if (/\b(what happens|process|stage|arraignment|plea|eviction|divorce steps|timeline)\b/.test(q)) return "process";
  return "general";
}
