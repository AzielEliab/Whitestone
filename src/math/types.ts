export const HEURISTIC_BANNER =
  "HEURISTIC / ILLUSTRATIVE — not a court worksheet, not legal advice, and not a prediction of your case. Verify dates, rates, and forms with the clerk.";

export const CLERK_VERIFY = "Verify this calendar result with the clerk. Court holidays are not fully modeled.";

export type MathKind = "deadline" | "interest" | "percent" | "bond" | "support" | "damages";

export interface MathResult {
  kind: MathKind;
  title: string;
  summary: string;
  lines: string[];
  insertText: string;
  labeled: "heuristic" | "public-formula";
  sourceTitle?: string;
  sourceUrl?: string;
}

export function formatMoney(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
}

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "n/a";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export function wrapResult(result: Omit<MathResult, "insertText">): MathResult {
  const banner = result.labeled === "public-formula"
    ? `Uses a published public schedule (${result.sourceTitle ?? "see source"}). Still not the official interactive worksheet — caps, medical, and deviations are omitted.`
    : HEURISTIC_BANNER;
  const insertText = [result.title, result.summary, ...result.lines, banner, result.sourceUrl ? `Source: ${result.sourceUrl}` : ""]
    .filter(Boolean)
    .join("\n");
  return { ...result, insertText };
}
