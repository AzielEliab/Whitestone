import type { ResearchResult } from "../research/types";
import type { PracticeArea } from "../types";
import { dateOnOrBeforeAsOf, formatAsOf, formatAsOfIso, parseAsOf } from "./asof";
import type { AsOfMonth } from "./types";
import { LAW_RECORDS } from "./records";
import {
  jurisdictionHook,
  recordMatchesQuery,
  scoreRecordQuery,
  standingAsOf,
  timelineAsOf,
  type JurisdictionHook,
} from "./retrieve";
import { CORPUS_HONESTY, HISTORICAL_DISCLAIMER, lawKindForArea, type LawKind, type LawRecord } from "./types";

const HOLDING_CLAIM =
  /\b(held that|the court held|the ruling (was|said)|precedent (is|was)|in \d{4}.{0,90}held)\b/i;
const UNCITEABLE_YEAR_LAW =
  /\b(in|as of|as-of)\s+(1[7-9]\d{2}|20\d{2})\b.{0,120}\b(the law|statute|amendment|required|said|held)\b|\bthe law (said|required|held|was)\b.{0,80}\b(1[7-9]\d{2}|20\d{2})\b/i;
const INVENTED_FORM = /\bform [a-z]{1,3}-?\d{2,4}\b|\bform \d{3,5}\b/i;

export type HistoricalVerdict = "MATCH" | "UNKNOWN" | "REFUSE" | "NEED-DATE";

export interface HistoricalEvaluation {
  verdict: HistoricalVerdict;
  asOf: AsOfMonth | null;
  asOfLabel: string;
  honesty: string;
  disclaimer: string;
  hook: JurisdictionHook;
  standing: LawRecord[];
  timeline: LawRecord[];
  matched: LawRecord[];
  later: LawRecord[];
  refused: string[];
  unknown: string[];
  notes: string[];
  sourceUrls: string[];
}

export function looksHistorical(text: string): boolean {
  return /\b(as of|as-of|historical|standing law|what (was|were) the law|in (1[7-9]\d{2}|20\d{2})|amendment|repeal|enacted|volstead|prohibition)\b/i.test(
    text,
  );
}

export function extractAsOfFromText(text: string): AsOfMonth | null {
  const labeled = text.match(/\b(?:as of|as-of)\s+([A-Za-z]+\s+\d{4}|\d{4}-\d{1,2}(?:-\d{1,2})?|\d{4})\b/i);
  if (labeled) return parseAsOf(labeled[1]);
  const ym = text.match(/\b(1[7-9]\d{2}|20\d{2})-(\d{1,2})\b/);
  if (ym) return parseAsOf(`${ym[1]}-${ym[2]}`);
  const named = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(1[7-9]\d{2}|20\d{2})\b/i,
  );
  if (named) return parseAsOf(`${named[1]} ${named[2]}`);
  return null;
}

export function evaluateHistorical(opts: {
  asOf?: AsOfMonth | null;
  query?: string;
  archivalFacts?: string;
  jurisdiction?: string | null;
  area?: PracticeArea | null;
  kind?: LawKind | "all";
  research?: ResearchResult | null;
}): HistoricalEvaluation {
  const query = (opts.query ?? "").trim();
  const archival = (opts.archivalFacts ?? "").trim();
  const combined = [query, archival].filter(Boolean).join("\n");
  const asOf = opts.asOf ?? extractAsOfFromText(combined);
  const hook = jurisdictionHook(opts.jurisdiction);
  const kind = opts.kind ?? lawKindForArea(opts.area);
  const refused: string[] = [];
  const unknown: string[] = [];
  const notes: string[] = [CORPUS_HONESTY, HISTORICAL_DISCLAIMER];

  if (!asOf) {
    return {
      verdict: "NEED-DATE",
      asOf: null,
      asOfLabel: "no as-of month",
      honesty: CORPUS_HONESTY,
      disclaimer: HISTORICAL_DISCLAIMER,
      hook,
      standing: [],
      timeline: [],
      matched: [],
      later: [],
      refused,
      unknown: ["Pick a year and month (as of YYYY-MM) before comparing archival facts to standing law."],
      notes,
      sourceUrls: [],
    };
  }

  const standing = standingAsOf({ asOf, kind, area: opts.area, jurisdiction: opts.jurisdiction });
  const timeline = timelineAsOf({ asOf, kind, area: opts.area, query: combined });
  const scored = uniqueRecords(
    LAW_RECORDS.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      return combined ? recordMatchesQuery(r, combined) : false;
    }).sort((a, b) => scoreRecordQuery(b, combined) - scoreRecordQuery(a, combined)),
  );
  const matched = scored.filter((r) => dateOnOrBeforeAsOf(r.effective_from, asOf));
  const later = scored.filter((r) => !dateOnOrBeforeAsOf(r.effective_from, asOf));

  if (hook.status === "UNKNOWN") {
    unknown.push(hook.note);
  }

  if (HOLDING_CLAIM.test(combined)) {
    refused.push(
      "REFUSE — I will not invent or confirm an uncitable holding. This corpus stores dated enact/amend/repeal/add/remove records, not reconstructed opinions.",
    );
  }
  if (INVENTED_FORM.test(combined) && !/https:\/\//i.test(combined)) {
    refused.push(
      "REFUSE — I will not treat an invented or uncitable form number as historical law. Form numbers change; they are not in this dated bundle.",
    );
  }
  if (UNCITEABLE_YEAR_LAW.test(combined) && matched.length === 0) {
    refused.push(
      `REFUSE — I will not state that “the law said X” in ${formatAsOf(asOf)} without a dated record that has a source URL.`,
    );
  }

  if (opts.jurisdiction && hook.status === "UNKNOWN" && /statute|code|§|session law|compiled/i.test(combined)) {
    unknown.push(
      `No dated ${hook.name} statute row exists for that ask. Coverage status: UNKNOWN.`,
    );
  }

  if (opts.research?.sources.length) {
    notes.push(
      `Allowlisted research pages in this session may be compared as current excerpts (retrieved dates on those cards), not as a back-dated official code.`,
    );
  }

  if (!combined) {
    notes.push(
      `As of ${formatAsOf(asOf)} (${formatAsOfIso(asOf)}), ${standing.length} seeded record(s) are treated as standing in the matching kind. That is the bundle size — not the size of U.S. law.`,
    );
  } else if (matched.length === 0 && refused.length === 0) {
    unknown.push(
      `No seeded dated record matched those archival facts as of ${formatAsOf(asOf)}. Gap stays a gap.`,
    );
  }

  let verdict: HistoricalEvaluation["verdict"] = "MATCH";
  if (refused.length) verdict = "REFUSE";
  else if (!matched.length && (unknown.length || hook.status === "UNKNOWN")) verdict = "UNKNOWN";
  else if (matched.length || standing.length) verdict = "MATCH";
  else verdict = "UNKNOWN";

  const sourceUrls = [
    ...new Set([
      ...standing.map((r) => r.sourceUrl),
      ...matched.map((r) => r.sourceUrl),
      ...timeline.map((r) => r.sourceUrl),
      ...(opts.research?.sources.map((s) => s.url) ?? []),
    ]),
  ];

  return {
    verdict,
    asOf,
    asOfLabel: `${formatAsOf(asOf)} (${formatAsOfIso(asOf)})`,
    honesty: CORPUS_HONESTY,
    disclaimer: HISTORICAL_DISCLAIMER,
    hook,
    standing,
    timeline,
    matched: uniqueRecords(matched),
    later: uniqueRecords(later),
    refused,
    unknown,
    notes,
    sourceUrls,
  };
}

function uniqueRecords(rows: LawRecord[]): LawRecord[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}
