import type { PracticeArea } from "../types";

export type StatTopic =
  | "pro-se"
  | "custody-household"
  | "support-receipt"
  | "divorce-rate"
  | "plea"
  | "pretrial"
  | "clearance"
  | "indigent-defense"
  | "expungement"
  | "small-claims"
  | "housing"
  | "debt-collection"
  | "civil-access"
  | "methodology";

export interface StatRecord {
  id: string;
  area: PracticeArea | "all";
  topic: StatTopic;
  claim: string;
  value: string;
  unit: string;
  year: number;
  geography: string;
  sourceTitle: string;
  sourceUrl: string;
  notes: string;
}

export function assertStatRecord(record: StatRecord): void {
  if (!record.id.trim()) throw new Error("Stat record missing id");
  if (!record.claim.trim()) throw new Error(`Stat ${record.id} missing claim`);
  if (!record.sourceTitle.trim()) throw new Error(`Stat ${record.id} missing sourceTitle`);
  if (!record.sourceUrl.trim()) throw new Error(`Stat ${record.id} missing sourceUrl`);
  if (!/^https:\/\//i.test(record.sourceUrl)) {
    throw new Error(`Stat ${record.id} sourceUrl must be https`);
  }
}
