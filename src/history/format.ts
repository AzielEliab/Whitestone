import { formatAsOf } from "./asof";
import type { HistoricalEvaluation } from "./evaluate";
import type { LawRecord } from "./types";

export function formatLawBullet(record: LawRecord): string {
  const to = record.effective_to ? ` through ${record.effective_to}` : " (no end date in this bundle)";
  return [
    `${record.citation} — ${record.title}`,
    `Event: ${record.event_type}. Kind: ${record.kind}. Jurisdiction: ${record.jurisdiction}.`,
    `Effective: ${record.effective_from}${to}.`,
    `Source: ${record.sourceTitle} — ${record.sourceUrl}`,
    `Notes: ${record.notes}`,
  ].join(" ");
}

export function formatHistoricalBlock(evaln: HistoricalEvaluation, archivalFacts?: string): string {
  const parts: string[] = [
    `Historical as-of evaluation — ${evaln.asOfLabel}.`,
    evaln.honesty,
    evaln.disclaimer,
    `Jurisdiction hook: ${evaln.hook.name} — ${evaln.hook.status}. ${evaln.hook.note}`,
  ];

  if (archivalFacts?.trim()) {
    parts.push(`User-supplied archival facts (session-only, not rewritten): ${archivalFacts.trim().slice(0, 900)}`);
  }

  if (evaln.refused.length) {
    parts.push(evaln.refused.join("\n"));
  }
  if (evaln.unknown.length) {
    parts.push(evaln.unknown.join("\n"));
  }

  if (evaln.verdict === "NEED-DATE") {
    parts.push("Set year and month in Historical as-of, then ask again.");
    return parts.join("\n\n");
  }

  const matchedStanding = evaln.matched.filter((r) => evaln.standing.some((s) => s.id === r.id));
  const standingShow = (matchedStanding.length ? matchedStanding : evaln.standing).slice(0, 6);
  if (evaln.matched.length) {
    parts.push(
      `Dated records on or before this as-of month that match your ask / archival facts:\n${evaln.matched
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${formatLawBullet(r)}`)
        .join("\n")}`,
    );
  }
  if (evaln.later.length) {
    parts.push(
      `Later dated records (not yet in force as of ${evaln.asOfLabel}):\n${evaln.later
        .slice(0, 3)
        .map((r, i) => `${i + 1}. ${r.effective_from} ${r.event_type.toUpperCase()} — ${r.citation} (${r.sourceUrl})`)
        .join("\n")}`,
    );
  }
  if (standingShow.length) {
    const label = evaln.asOf ? `Standing in the seeded corpus as of ${formatAsOf(evaln.asOf)}` : "Standing in the seeded corpus";
    parts.push(`${label}:\n${standingShow.map((r, i) => `${i + 1}. ${formatLawBullet(r)}`).join("\n")}`);
  } else if (evaln.verdict !== "REFUSE") {
    parts.push("No standing seeded record matched that as-of month and kind. UNKNOWN — not an invented statute.");
  }

  const events = evaln.timeline.filter((r) => r.event_type === "repeal" || r.event_type === "amend" || r.event_type === "remove");
  if (events.length) {
    parts.push(
      `Enact / amend / repeal / add / remove events on or before this as-of month:\n${events
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r.event_type.toUpperCase()} ${r.effective_from} — ${r.citation} (${r.sourceUrl})`)
        .join("\n")}`,
    );
  }

  for (const note of evaln.notes) {
    if (!parts.includes(note)) parts.push(note);
  }
  return parts.join("\n\n");
}
