import type { PracticeArea } from "../types";
import { STAT_RECORDS } from "./records";
import type { StatRecord, StatTopic } from "./types";

const TOPIC_HINTS: { topic: StatTopic; re: RegExp }[] = [
  { topic: "plea", re: /\bplea|guilty plea|trial rate|conviction rate\b/i },
  { topic: "pretrial", re: /\bpretrial|released|detained|bail statistic|jail\b/i },
  { topic: "clearance", re: /\bclearance|arrest rate|ucr|nibrs\b/i },
  { topic: "indigent-defense", re: /\bpublic defender|caseload|indigent|appointed counsel\b/i },
  { topic: "expungement", re: /\bexpunge|seal(ing)?|set-?aside|record relief\b/i },
  { topic: "pro-se", re: /\bpro se|self-?represent|without (a )?lawyer|unrepresented\b/i },
  { topic: "custody-household", re: /\bcustodial|mothers? vs fathers?|father.?s|mother.?s\b/i },
  { topic: "support-receipt", re: /\bsupport (award|receipt|order)|paid support\b/i },
  { topic: "divorce-rate", re: /\bdivorce rate|how common is divorce|marriage rate\b/i },
  { topic: "debt-collection", re: /\bdebt collection|collector|default judgment\b/i },
  { topic: "housing", re: /\bevict|landlord|housing (court|case|filing)\b/i },
  { topic: "small-claims", re: /\bsmall claims|civil caseload|contract docket\b/i },
  { topic: "civil-access", re: /\bjustice gap|legal aid|civil legal (need|help)\b/i },
  { topic: "methodology", re: /\bwin rate|gender|numbers say|statistic|methodology\b/i },
];

export function retrieveStats(opts: {
  query?: string;
  area?: PracticeArea | null;
  limit?: number;
}): StatRecord[] {
  const q = (opts.query ?? "").toLowerCase();
  const area = opts.area;
  const limit = opts.limit ?? 4;
  const topicBoost = new Set<StatTopic>();
  for (const hint of TOPIC_HINTS) {
    if (hint.re.test(q)) topicBoost.add(hint.topic);
  }

  const scored = STAT_RECORDS.map((record) => {
    let score = 1;
    if (area && (record.area === area || record.area === "all")) score += 4;
    else if (area && record.area !== area && record.area !== "all") score -= 3;
    if (topicBoost.has(record.topic)) score += 6;
    if (q && record.claim.toLowerCase().includes(q.slice(0, 24))) score += 1;
    if (/\bnumbers?|statistic|rate|data\b/i.test(q)) score += 1;
    return { record, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: StatRecord[] = [];
  for (const row of scored) {
    if (seen.has(row.record.id)) continue;
    seen.add(row.record.id);
    out.push(row.record);
    if (out.length >= limit) break;
  }
  return out;
}

export function statsForArea(area: PracticeArea | null | undefined, limit = 6): StatRecord[] {
  return retrieveStats({ area, query: "what do the numbers say", limit });
}
