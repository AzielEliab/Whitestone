import { formatMoney, formatPct, wrapResult, type MathResult } from "./types";

export function percentOf(amount: number, percent: number): number {
  return amount * (percent / 100);
}

export function proRata(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  return weights.map((w) => (total * w) / sum);
}

export function percentResult(amount: number, percent: number, label = "amount"): MathResult {
  const value = percentOf(amount, percent);
  return wrapResult({
    kind: "percent",
    title: "Percent / pro-rata",
    summary: `${formatPct(percent)} of ${formatMoney(amount)} (${label}) is ${formatMoney(value)}.`,
    lines: [`${formatPct(percent)} × ${formatMoney(amount)} = ${formatMoney(value)}`],
    labeled: "heuristic",
  });
}

export function proRataResult(total: number, weights: number[]): MathResult {
  const parts = proRata(total, weights);
  const lines = parts.map((p, i) => `Share ${i + 1} (${weights[i]}): ${formatMoney(p)}`);
  return wrapResult({
    kind: "percent",
    title: "Pro-rata split",
    summary: `${formatMoney(total)} split by weights ${weights.join(" / ")}.`,
    lines,
    labeled: "heuristic",
  });
}

/** Common surety-bond cash premium illustration — not every court uses 10%, and cash bail is different. */
export function bondCashResult(bail: number, percent = 10): MathResult {
  const cash = percentOf(bail, percent);
  return wrapResult({
    kind: "bond",
    title: "Bond cash-percentage illustration",
    summary: `${formatPct(percent)} of ${formatMoney(bail)} bail is ${formatMoney(cash)}.`,
    lines: [
      `Stated bail: ${formatMoney(bail)}`,
      `Illustrated cash / premium: ${formatMoney(cash)} (${formatPct(percent)})`,
      "A 10% figure is a common commercial-bond premium in some places — not a national rule, not a promise you will be released, and not legal advice. Cash bail, deposit bonds, and unsecured release are different. Ask the lawyer or pretrial office.",
    ],
    labeled: "heuristic",
  });
}
