import { formatMoney, formatPct, wrapResult, type MathResult } from "./types";

export function simpleInterest(principal: number, annualRatePct: number, years: number): number {
  return principal * (annualRatePct / 100) * years;
}

/** Compound interest earned (future value minus principal). */
export function compoundInterest(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear = 1,
): number {
  const n = compoundsPerYear;
  if (n <= 0) return simpleInterest(principal, annualRatePct, years);
  const r = annualRatePct / 100;
  return principal * ((1 + r / n) ** (n * years) - 1);
}

export function interestResult(opts: {
  principal: number;
  annualRatePct: number;
  years: number;
  mode: "simple" | "compound";
  compoundsPerYear?: number;
}): MathResult {
  const n = opts.compoundsPerYear ?? 1;
  const earned =
    opts.mode === "simple"
      ? simpleInterest(opts.principal, opts.annualRatePct, opts.years)
      : compoundInterest(opts.principal, opts.annualRatePct, opts.years, n);
  const total = opts.principal + earned;
  return wrapResult({
    kind: "interest",
    title: opts.mode === "simple" ? "Simple interest illustration" : "Compound interest illustration",
    summary: `${opts.mode === "simple" ? "Simple" : "Compound"} interest on ${formatMoney(opts.principal)} at ${formatPct(opts.annualRatePct)} for ${opts.years} year${opts.years === 1 ? "" : "s"} is ${formatMoney(earned)} (balance ${formatMoney(total)}).`,
    lines: [
      `Principal: ${formatMoney(opts.principal)}`,
      `Annual rate: ${formatPct(opts.annualRatePct)} (user-supplied — not a statutory judgment rate unless you entered one from a statute you checked)`,
      `Time: ${opts.years} year${opts.years === 1 ? "" : "s"}`,
      opts.mode === "compound" ? `Compounds per year: ${n}` : "Method: principal × rate × time",
      `Interest: ${formatMoney(earned)}`,
      `Illustrated balance: ${formatMoney(total)}`,
      "Civil judgment interest is state-specific. Do not treat this as the clerk's amount.",
    ],
    labeled: "heuristic",
  });
}
