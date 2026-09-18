import type { PracticeArea } from "../types";
import { retrieveStats } from "./retrieve";
import type { StatRecord } from "./types";

export function formatStatBullet(record: StatRecord): string {
  return [
    `${record.claim}`,
    `Figure: ${record.value} (${record.unit}, ${record.year}, ${record.geography}).`,
    `Source: ${record.sourceTitle} — ${record.sourceUrl}`,
    `Limits: ${record.notes}`,
  ].join(" ");
}

export function formatStatsBlock(records: StatRecord[], area?: PracticeArea | null): string {
  if (!records.length) {
    return "No bundled statistic matched that ask. Whitestone will not invent a number. Ask the clerk or a state court statistical report, or try “what do the numbers say?” for cited national context.";
  }
  const header = [
    "Cited public statistics — not a prediction of YOUR case.",
    area
      ? `Session practice area: ${area}. If a state-specific figure is not in this bundle, the national or selected-court figure is shown with that caveat.`
      : "National or selected-court figures. State-specific rates are used only when a source URL is attached.",
    "Pro se counts are often undercounted. Custody outcomes by parent gender are rarely published by courts.",
  ].join(" ");
  const bullets = records.map((r, i) => `${i + 1}. ${formatStatBullet(r)}`);
  return [header, ...bullets].join("\n\n");
}

export function statsReply(query: string, area?: PracticeArea | null): string {
  return formatStatsBlock(retrieveStats({ query, area, limit: 4 }), area);
}
