import { bondCashResult, percentResult, proRataResult } from "./percent";
import { damagesResult, parseAmountList } from "./damages";
import { deadlineResult, parseFlexibleDate } from "./dates";
import { interestResult } from "./interest";
import { supportEstimate } from "./support";
import type { MathResult } from "./types";

const MONEY = String.raw`\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)`;

export function looksLikeMath(text: string): boolean {
  const q = text.toLowerCase();
  if (/\b(\d+(?:\.\d+)?)\s*%\s*of\b/.test(q)) return true;
  if (/\b\d+\s+(calendar\s+|business\s+)?days?\s+from\b/.test(q)) return true;
  if (/\b(simple|compound)\s+interest\b/.test(q)) return true;
  if (/\b(10|percent)\s*%.+\bbail\b|\bbail\b.+\b(10|percent)\s*%/.test(q)) return true;
  if (/\b(child support|guideline)\b/.test(q) && /\d/.test(q) && /\b(income|make[s]?|earn|\$)/.test(q)) return true;
  if (/\b(sum|total|add up|line items?)\b/.test(q) && /\$|\d/.test(q)) return true;
  if (/\bsplit\b.+\b\d+/.test(q) && /\d+\s*\/\s*\d+/.test(q)) return true;
  return false;
}

export function parseMathAsk(
  text: string,
  opts?: { jurisdiction?: string | null; defaultYear?: number },
): MathResult | null {
  const q = text.replace(/\s+/g, " ").trim();
  const year = opts?.defaultYear ?? new Date().getUTCFullYear();

  const bond = q.match(new RegExp(`(?:what(?:'| i)?s|calculate|compute)?\\s*(\\d+(?:\\.\\d+)?)\\s*%\\s*of\\s*${MONEY}\\s*(?:bail|bond)`, "i"))
    || q.match(new RegExp(`${MONEY}\\s*(?:bail|bond).{0,24}(\\d+(?:\\.\\d+)?)\\s*%`, "i"));
  if (bond) {
    const pct = Number(bond[1].includes("$") || bond[1].includes(",") || Number(bond[1]) > 100 ? bond[2] : bond[1]);
    const amount = Number((bond[1].includes("$") || Number(bond[1]) > 100 ? bond[1] : bond[2]).replace(/[$,]/g, ""));
    if (Number.isFinite(pct) && Number.isFinite(amount)) return bondCashResult(amount, pct);
  }

  const pctOf = q.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*%\\s*of\\s*${MONEY}`, "i"));
  if (pctOf) {
    return percentResult(Number(pctOf[2].replace(/,/g, "")), Number(pctOf[1]));
  }

  const days = q.match(
    /(\d+)\s+(calendar\s+|business\s+)?days?\s+(before|after|from)\s+(.+?)(?:\?|$)/i,
  );
  if (days) {
    const n = Number(days[1]);
    const business = /business/i.test(days[2] || "");
    const dir = days[3].toLowerCase() === "before" ? -1 : 1;
    const start = parseFlexibleDate(days[4], year);
    if (start && Number.isFinite(n)) return deadlineResult(start, n * dir, business);
  }

  const interest = q.match(
    new RegExp(
      `(simple|compound)\\s+interest(?:\\s+on)?\\s+${MONEY}\\s+at\\s+(\\d+(?:\\.\\d+)?)\\s*%(?:\\s+for\\s+(\\d+(?:\\.\\d+)?)\\s*years?)?(?:\\s+compounded\\s+(monthly|quarterly|annually|yearly|daily))?`,
      "i",
    ),
  );
  if (interest) {
    const compounds =
      interest[5]?.toLowerCase() === "monthly"
        ? 12
        : interest[5]?.toLowerCase() === "quarterly"
          ? 4
          : interest[5]?.toLowerCase() === "daily"
            ? 365
            : 1;
    return interestResult({
      principal: Number(interest[2].replace(/,/g, "")),
      annualRatePct: Number(interest[3]),
      years: interest[4] ? Number(interest[4]) : 1,
      mode: interest[1].toLowerCase() === "compound" ? "compound" : "simple",
      compoundsPerYear: compounds,
    });
  }

  const split = q.match(new RegExp(`split\\s+${MONEY}\\s+(\\d+(?:\\.\\d+)?)\\s*/\\s*(\\d+(?:\\.\\d+)?)`, "i"));
  if (split) {
    return proRataResult(Number(split[1].replace(/,/g, "")), [Number(split[2]), Number(split[3])]);
  }

  const support = q.match(
    new RegExp(
      `child support.{0,40}${MONEY}.{0,20}(?:and|&)?\\s*${MONEY}?.{0,20}(\\d+)\\s+child`,
      "i",
    ),
  ) || q.match(
    new RegExp(
      `(?:I (?:make|earn)|income(?: is)?|obligor)\\s+${MONEY}.{0,40}(\\d+)\\s+child`,
      "i",
    ),
  );
  if (support) {
    const first = Number(support[1].replace(/,/g, ""));
    const second = support[2] && /\d/.test(support[2]) && support[0].toLowerCase().includes("and")
      ? Number(String(support[2]).replace(/,/g, ""))
      : undefined;
    const kids = Number(support[support.length - 1]);
    if (Number.isFinite(first) && Number.isFinite(kids)) {
      return supportEstimate({
        jurisdiction: opts?.jurisdiction,
        children: kids,
        obligorMonthly: first,
        otherMonthly: second && Number.isFinite(second) ? second : undefined,
      });
    }
  }

  if (/\b(sum|total|add up|line items?|claim)\b/i.test(q)) {
    const lines = parseAmountList(q);
    if (lines.length >= 2) return damagesResult({ lines });
  }

  return null;
}
