import { fromDate, toUtcDate, ymd, type CalendarYmd } from "../math/dates";
import type { AsOfMonth } from "./types";

/** July 1776 — Declaration; federal constitutional government begins later (1789). */
export const FOUNDING_YEAR = 1776;
export const FOUNDING_MONTH = 7;

const MONTH_NAMES = [
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

export function asOfKey(asOf: AsOfMonth): number {
  return asOf.year * 12 + asOf.month;
}

export function compareAsOf(a: AsOfMonth, b: AsOfMonth): number {
  return asOfKey(a) - asOfKey(b);
}

export function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function asOfStart(asOf: AsOfMonth): CalendarYmd {
  return ymd(asOf.year, asOf.month, 1);
}

export function asOfEnd(asOf: AsOfMonth): CalendarYmd {
  return ymd(asOf.year, asOf.month, lastDayOfMonth(asOf.year, asOf.month));
}

export function formatAsOf(asOf: AsOfMonth): string {
  return `${MONTH_NAMES[asOf.month - 1]} ${asOf.year}`;
}

export function formatAsOfIso(asOf: AsOfMonth): string {
  return `${asOf.year}-${String(asOf.month).padStart(2, "0")}`;
}

export function currentAsOf(): AsOfMonth {
  const now = fromDate(new Date());
  return { year: now.y, month: now.m };
}

export function isValidAsOf(asOf: AsOfMonth): boolean {
  if (!Number.isInteger(asOf.year) || !Number.isInteger(asOf.month)) return false;
  if (asOf.month < 1 || asOf.month > 12) return false;
  if (asOf.year < FOUNDING_YEAR) return false;
  if (asOf.year === FOUNDING_YEAR && asOf.month < FOUNDING_MONTH) return false;
  const max = currentAsOf();
  if (asOf.year > max.year) return false;
  if (asOf.year === max.year && asOf.month > max.month) return false;
  return true;
}

export function isoToAsOf(iso: string): AsOfMonth | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const asOf = { year: Number(m[1]), month: Number(m[2]) };
  if (asOf.month < 1 || asOf.month > 12) return null;
  return asOf;
}

/** Year-only strings mean “as of December of that year.” */
export function parseAsOf(raw: string): AsOfMonth | null {
  const text = raw.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (iso) {
    const asOf = { year: Number(iso[1]), month: Number(iso[2]) };
    return isValidAsOf(asOf) ? asOf : null;
  }
  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    const asOf = { year, month: 12 };
    return isValidAsOf(asOf) ? asOf : null;
  }
  const named = text.match(
    /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})$/i,
  );
  if (named) {
    const month = monthIndex(named[1]);
    const asOf = { year: Number(named[2]), month: month ?? 0 };
    return isValidAsOf(asOf) ? asOf : null;
  }
  const namedAfter = text.match(
    /^(\d{4})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)$/i,
  );
  if (namedAfter) {
    const month = monthIndex(namedAfter[2]);
    const asOf = { year: Number(namedAfter[1]), month: month ?? 0 };
    return isValidAsOf(asOf) ? asOf : null;
  }
  return null;
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

export function dateOnOrBeforeAsOf(iso: string, asOf: AsOfMonth): boolean {
  const from = isoToAsOf(iso);
  if (!from) return false;
  return compareAsOf(from, asOf) <= 0;
}

/**
 * Month-resolution standing: a dated event is in force as of YYYY-MM when
 * effective_from's year-month ≤ as-of, and effective_to is null or later than as-of.
 * A repeal dated the as-of month is treated as already ended for that month.
 */
export function isInForceAsOf(
  effectiveFrom: string,
  effectiveTo: string | null,
  asOf: AsOfMonth,
): boolean {
  if (!dateOnOrBeforeAsOf(effectiveFrom, asOf)) return false;
  if (!effectiveTo) return true;
  const to = isoToAsOf(effectiveTo);
  if (!to) return false;
  return compareAsOf(to, asOf) > 0;
}

export function asOfFromSession(year: number | null | undefined, month: number | null | undefined): AsOfMonth | null {
  if (year == null || month == null) return null;
  const asOf = { year, month };
  return isValidAsOf(asOf) ? asOf : null;
}

export function yearsForPicker(): number[] {
  const max = currentAsOf().year;
  const years: number[] = [];
  for (let y = max; y >= FOUNDING_YEAR; y--) years.push(y);
  return years;
}

export function monthsForPicker(): { value: number; label: string }[] {
  return MONTH_NAMES.map((label, i) => ({ value: i + 1, label }));
}

/** Exposed for tests that need a UTC calendar day from an as-of month. */
export function asOfEndUtc(asOf: AsOfMonth): Date {
  return toUtcDate(asOfEnd(asOf));
}

export function asOfStartUtc(asOf: AsOfMonth): Date {
  return toUtcDate(asOfStart(asOf));
}
