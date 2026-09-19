/** Dated-source helpers. Never invent a date. Author: Aziel Eliab. */

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export interface ParsedDate {
  iso: string;
  year: number;
  month: number;
  day: number | null;
  source: "upload" | "text" | "as-of";
}

export function parseIsoDate(value: string | null | undefined): ParsedDate | null {
  const v = (value || "").trim();
  const m = v.match(/^(1[7-9]\d{2}|20\d{2})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = m[3] ? Number(m[3]) : null;
  if (month < 1 || month > 12) return null;
  if (day != null && (day < 1 || day > 31)) return null;
  return {
    iso: `${year}-${String(month).padStart(2, "0")}${day != null ? `-${String(day).padStart(2, "0")}` : ""}`,
    year,
    month,
    day,
    source: "upload",
  };
}

export function extractDatesFromText(text: string, source: ParsedDate["source"] = "text"): ParsedDate[] {
  const out: ParsedDate[] = [];
  const seen = new Set<string>();
  const push = (d: ParsedDate | null) => {
    if (!d || seen.has(d.iso)) return;
    seen.add(d.iso);
    out.push({ ...d, source });
  };
  for (const m of text.matchAll(/\b(1[7-9]\d{2}|20\d{2})-(\d{1,2})(?:-(\d{1,2}))?\b/g)) {
    push(parseIsoDate(m[0]));
  }
  for (const m of text.matchAll(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(1[7-9]\d{2}|20\d{2})\b/gi,
  )) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = Number(m[2]);
    const year = Number(m[3]);
    if (month) push({ iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, year, month, day, source });
  }
  for (const m of text.matchAll(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(1[7-9]\d{2}|20\d{2})\b/gi,
  )) {
    const month = MONTHS[m[1].toLowerCase()];
    const year = Number(m[2]);
    if (month) push({ iso: `${year}-${String(month).padStart(2, "0")}`, year, month, day: null, source });
  }
  return out;
}

export function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}
