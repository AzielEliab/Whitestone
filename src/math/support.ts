import { getJurisdiction } from "../knowledge";
import { formatMoney, formatPct, wrapResult, type MathResult } from "./types";
import { percentOf } from "./percent";

export const TX_SUPPORT_PERCENTS = [20, 25, 30, 35, 40] as const;
export const WI_SUPPORT_PERCENTS = [17, 25, 29, 31, 34] as const;

export const TX_SUPPORT_SOURCE = {
  title: "Texas Family Code § 154.125 (percentage of net resources)",
  url: "https://statutes.capitol.texas.gov/Docs/FA/htm/FA.154.htm",
};

export const WI_SUPPORT_SOURCE = {
  title: "Wisconsin Admin. Code DCF 150 / DCF child-support guidelines",
  url: "https://dcf.wisconsin.gov/cs/guidelines",
};

export function documentedSupportPercent(code: string | null | undefined, children: number): {
  percent: number;
  sourceTitle: string;
  sourceUrl: string;
  label: string;
} | null {
  if (children < 1) return null;
  const n = Math.min(children, 5);
  if (code === "TX") {
    return {
      percent: TX_SUPPORT_PERCENTS[n - 1],
      sourceTitle: TX_SUPPORT_SOURCE.title,
      sourceUrl: TX_SUPPORT_SOURCE.url,
      label: "Texas percentage of the obligor's net monthly resources (statute schedule). Caps, medical, and multiple-household rules are omitted.",
    };
  }
  if (code === "WI") {
    return {
      percent: WI_SUPPORT_PERCENTS[n - 1],
      sourceTitle: WI_SUPPORT_SOURCE.title,
      sourceUrl: WI_SUPPORT_SOURCE.url,
      label: "Wisconsin percentage-of-income schedule (DCF 150 overview). Deductions, shared-placement, and serial-family rules are omitted.",
    };
  }
  return null;
}

export function supportEstimate(opts: {
  jurisdiction?: string | null;
  children: number;
  obligorMonthly: number;
  otherMonthly?: number;
  chartObligation?: number;
}): MathResult {
  const kids = Math.max(1, Math.floor(opts.children || 1));
  const documented = documentedSupportPercent(opts.jurisdiction ?? null, kids);
  const j = getJurisdiction(opts.jurisdiction);
  if (documented) {
    const amount = percentOf(opts.obligorMonthly, documented.percent);
    return wrapResult({
      kind: "support",
      title: "Child-support estimator (public schedule, still incomplete)",
      summary: `${formatPct(documented.percent)} of ${formatMoney(opts.obligorMonthly)} monthly (illustrated) is ${formatMoney(amount)} for ${kids} child${kids === 1 ? "" : "ren"}.`,
      lines: [
        documented.label,
        `Children counted: ${kids} (5+ uses the published top band)`,
        `Illustrated monthly figure: ${formatMoney(amount)}`,
        "This is NOT the official interactive worksheet and not an order. Use the state calculator or clerk packet.",
        j ? `This state's table lists the model as ${j.childSupportModel.replace(/-/g, " ")} and points to ${j.childSupportGuidelines}.` : "",
      ].filter(Boolean),
      labeled: "public-formula",
      sourceTitle: documented.sourceTitle,
      sourceUrl: documented.sourceUrl,
    });
  }

  const other = opts.otherMonthly ?? 0;
  const combined = opts.obligorMonthly + other;
  const share = combined > 0 ? (opts.obligorMonthly / combined) * 100 : 100;
  const chart = opts.chartObligation;
  const shareOfChart = chart != null && Number.isFinite(chart) ? (chart * share) / 100 : null;
  const naive = percentOf(opts.obligorMonthly, kids === 1 ? 17 : kids === 2 ? 25 : 29);

  return wrapResult({
    kind: "support",
    title: "Child-support estimator — NOT your state's worksheet",
    summary:
      shareOfChart != null
        ? `If a published chart amount is ${formatMoney(chart!)}, a naive income-share of ${formatPct(share)} is ${formatMoney(shareOfChart)}.`
        : `No official ${j?.name ?? "state"} schedule is applied here. A generic percentage sketch of ${formatMoney(naive)} is shown only as arithmetic — not a guideline.`,
    lines: [
      `This is NOT ${j ? `${j.name}'s` : "a state"} official child-support worksheet.`,
      j
        ? `${j.name} uses a ${j.childSupportModel.replace(/-/g, " ")} model (${j.childSupportGuidelines}). Use that worksheet or the child-support agency: ${j.childSupportAgency}.`
        : "Choose a jurisdiction so Whitestone can name the local model. Still use the official worksheet.",
      `Your entered obligor monthly income: ${formatMoney(opts.obligorMonthly)}`,
      other ? `Other household monthly income: ${formatMoney(other)} (combined ${formatMoney(combined)}; obligor share ${formatPct(share)})` : "Other household income was not entered — income-shares states need both sides.",
      shareOfChart != null
        ? `User-supplied basic obligation from a chart: ${formatMoney(chart!)} → illustrated share ${formatMoney(shareOfChart)}`
        : `Generic (not official) sketch using 17/25/29% of obligor income only: ${formatMoney(naive)}. That is not Melson, not income-shares, and not a court number.`,
      "Whitestone will not invent a dollar order. Open the official calculator or clerk packet.",
    ],
    labeled: "heuristic",
  });
}
