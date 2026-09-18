import { CLERK_VERIFY, wrapResult, type MathResult } from "./types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface CalendarYmd {
  y: number;
  m: number;
  d: number;
}

export function ymd(y: number, m: number, d: number): CalendarYmd {
  return { y, m, d };
}

export function fromDate(date: Date): CalendarYmd {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

export function toUtcDate(value: CalendarYmd): Date {
  return new Date(Date.UTC(value.y, value.m - 1, value.d));
}

export function formatYmd(value: CalendarYmd): string {
  const dt = toUtcDate(value);
  return `${WEEKDAYS[dt.getUTCDay()]}, ${MONTHS[value.m - 1]} ${value.d}, ${value.y}`;
}

export function addCalendarDays(start: CalendarYmd, days: number): CalendarYmd {
  const dt = toUtcDate(start);
  dt.setUTCDate(dt.getUTCDate() + days);
  return fromDate(dt);
}

export function weekdayUtc(value: CalendarYmd): number {
  return toUtcDate(value).getUTCDay();
}

/** Saturday/Sunday skipped. Court holidays are not modeled. */
export function addBusinessDays(start: CalendarYmd, days: number): CalendarYmd {
  if (!Number.isInteger(days) || days === 0) return start;
  const step = days > 0 ? 1 : -1;
  let left = Math.abs(days);
  let cursor = start;
  while (left > 0) {
    cursor = addCalendarDays(cursor, step);
    const dow = weekdayUtc(cursor);
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  return cursor;
}

export function parseFlexibleDate(raw: string, fallbackYear = new Date().getUTCFullYear()): CalendarYmd | null {
  const text = raw.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (validYmd(y, m, d)) return ymd(y, m, d);
  }
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (slash) {
    const m = Number(slash[1]);
    const d = Number(slash[2]);
    const y = slash[3] ? Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3]) : fallbackYear;
    if (validYmd(y, m, d)) return ymd(y, m, d);
  }
  const named = text.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?,?(?:\s+(\d{4}))?$/i,
  );
  if (named) {
    const m = monthIndex(named[1]);
    const d = Number(named[2]);
    const y = named[3] ? Number(named[3]) : fallbackYear;
    if (m && validYmd(y, m, d)) return ymd(y, m, d);
  }
  return null;
}

function validYmd(y: number, m: number, d: number): boolean {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function monthIndex(name: string): number | null {
  const key = name.slice(0, 3).toLowerCase();
  const map: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  return map[key] ?? null;
}

export function deadlineResult(start: CalendarYmd, days: number, business: boolean): MathResult {
  const end = business ? addBusinessDays(start, days) : addCalendarDays(start, days);
  const unit = business ? "business day" : "calendar day";
  const abs = Math.abs(days);
  const direction = days < 0 ? "before" : "after";
  return wrapResult({
    kind: "deadline",
    title: "Date / deadline math",
    summary: `${abs} ${unit}${abs === 1 ? "" : "s"} ${direction} ${formatYmd(start)} is ${formatYmd(end)}.`,
    lines: [
      `Start: ${formatYmd(start)}`,
      `Offset: ${days} ${unit}${abs === 1 ? "" : "s"} (${business ? "Sat/Sun skipped" : "calendar"})`,
      `Result: ${formatYmd(end)}`,
      CLERK_VERIFY,
    ],
    labeled: "heuristic",
  });
}
