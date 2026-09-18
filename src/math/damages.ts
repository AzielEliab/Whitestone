import { percentOf } from "./percent";
import { formatMoney, wrapResult, type MathResult } from "./types";

export interface DamageLine {
  label: string;
  amount: number;
}

export function sumLines(lines: DamageLine[]): number {
  return lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0);
}

export function damagesResult(opts: {
  lines: DamageLine[];
  feePercent?: number;
  credit?: number;
}): MathResult {
  const subtotal = sumLines(opts.lines);
  const fee = opts.feePercent ? percentOf(subtotal, opts.feePercent) : 0;
  const credit = opts.credit ?? 0;
  const total = subtotal + fee - credit;
  return wrapResult({
    kind: "damages",
    title: "Damages / claim totaling",
    summary: `Line items total ${formatMoney(subtotal)}${fee ? `; illustrated fee ${formatMoney(fee)}` : ""}${credit ? `; credit ${formatMoney(credit)}` : ""}. Illustrated claim ${formatMoney(total)}.`,
    lines: [
      ...opts.lines.map((line) => `${line.label || "Item"}: ${formatMoney(line.amount)}`),
      `Subtotal: ${formatMoney(subtotal)}`,
      opts.feePercent ? `Illustrated fee (${opts.feePercent}%): ${formatMoney(fee)}` : "",
      credit ? `Credit / already paid: ${formatMoney(credit)}` : "",
      `Illustrated total: ${formatMoney(total)}`,
      "This is addition of numbers you typed. It is not a judgment, not a small-claims cap, and not a collection plan.",
    ].filter(Boolean),
    labeled: "heuristic",
  });
}

export function parseAmountList(text: string): DamageLine[] {
  const lines: DamageLine[] = [];
  const re =
    /(?:^|[;,\n]|\band\b)\s*(?:([A-Za-z][\w\s/-]{0,40}?)[:\-]\s*)?\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const amount = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(amount)) continue;
    lines.push({ label: (m[1] || `Item ${lines.length + 1}`).trim(), amount });
  }
  return lines;
}
