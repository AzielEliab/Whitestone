import { useMemo, useState } from "react";
import {
  bondCashResult,
  damagesResult,
  deadlineResult,
  interestResult,
  parseFlexibleDate,
  percentResult,
  supportEstimate,
  type MathResult,
} from "../../math";
import { useSession } from "../../session/store";
import { Button } from "./Button";

export function MathPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const { state } = useSession();
  const [tab, setTab] = useState<"deadline" | "interest" | "percent" | "support" | "damages">("deadline");
  const [days, setDays] = useState("30");
  const [date, setDate] = useState("2026-03-01");
  const [business, setBusiness] = useState(false);
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("2");
  const [compound, setCompound] = useState(false);
  const [amount, setAmount] = useState("5000");
  const [pct, setPct] = useState("10");
  const [bond, setBond] = useState(true);
  const [obligor, setObligor] = useState("4000");
  const [other, setOther] = useState("");
  const [kids, setKids] = useState("1");
  const [lines, setLines] = useState("Repairs: 800\nDeposit: 200");

  const result = useMemo((): MathResult | null => {
    if (tab === "deadline") {
      const start = parseFlexibleDate(date);
      const n = Number(days);
      if (!start || !Number.isFinite(n)) return null;
      return deadlineResult(start, n, business);
    }
    if (tab === "interest") {
      return interestResult({
        principal: Number(principal),
        annualRatePct: Number(rate),
        years: Number(years),
        mode: compound ? "compound" : "simple",
        compoundsPerYear: compound ? 12 : 1,
      });
    }
    if (tab === "percent") {
      const a = Number(amount);
      const p = Number(pct);
      if (!Number.isFinite(a) || !Number.isFinite(p)) return null;
      return bond ? bondCashResult(a, p) : percentResult(a, p);
    }
    if (tab === "support") {
      return supportEstimate({
        jurisdiction: state.jurisdiction,
        children: Number(kids) || 1,
        obligorMonthly: Number(obligor) || 0,
        otherMonthly: other ? Number(other) : undefined,
      });
    }
    const parsed = lines
      .split("\n")
      .map((row) => {
        const m = row.match(/^\s*(.+?)[:\-]\s*\$?\s*([\d,.]+)\s*$/);
        return m ? { label: m[1].trim(), amount: Number(m[2].replace(/,/g, "")) } : null;
      })
      .filter((row): row is { label: string; amount: number } => Boolean(row && Number.isFinite(row.amount)));
    return parsed.length ? damagesResult({ lines: parsed }) : null;
  }, [tab, days, date, business, principal, rate, years, compound, amount, pct, bond, obligor, other, kids, lines, state.jurisdiction]);

  return (
    <section className="tool-panel" aria-label="Math tools">
      <h3>Math</h3>
      <p className="muted">
        HEURISTIC / ILLUSTRATIVE unless a public formula is cited. Not a court worksheet.
      </p>
      <div className="chips">
        {(["deadline", "interest", "percent", "support", "damages"] as const).map((id) => (
          <button key={id} type="button" className="chip" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {id}
          </button>
        ))}
      </div>
      {tab === "deadline" && (
        <div className="grid two">
          <Field label="Start date" value={date} onChange={setDate} />
          <Field label="Days" value={days} onChange={setDays} inputMode="numeric" />
          <label className="web-toggle">
            <input type="checkbox" checked={business} onChange={(e) => setBusiness(e.target.checked)} />
            Business days (Sat/Sun skipped; holidays not fully modeled)
          </label>
        </div>
      )}
      {tab === "interest" && (
        <div className="grid two">
          <Field label="Principal" value={principal} onChange={setPrincipal} inputMode="decimal" />
          <Field label="Annual rate %" value={rate} onChange={setRate} inputMode="decimal" />
          <Field label="Years" value={years} onChange={setYears} inputMode="decimal" />
          <label className="web-toggle">
            <input type="checkbox" checked={compound} onChange={(e) => setCompound(e.target.checked)} />
            Compound monthly
          </label>
        </div>
      )}
      {tab === "percent" && (
        <div className="grid two">
          <Field label="Amount" value={amount} onChange={setAmount} inputMode="decimal" />
          <Field label="Percent" value={pct} onChange={setPct} inputMode="decimal" />
          <label className="web-toggle">
            <input type="checkbox" checked={bond} onChange={(e) => setBond(e.target.checked)} />
            Treat as bail / bond cash %
          </label>
        </div>
      )}
      {tab === "support" && (
        <div className="grid two">
          <Field label="Obligor monthly $" value={obligor} onChange={setObligor} inputMode="decimal" />
          <Field label="Other monthly $ (optional)" value={other} onChange={setOther} inputMode="decimal" />
          <Field label="Children" value={kids} onChange={setKids} inputMode="numeric" />
        </div>
      )}
      {tab === "damages" && (
        <div className="field">
          <label htmlFor="dmg">Line items (Label: amount)</label>
          <textarea id="dmg" value={lines} onChange={(e) => setLines(e.target.value)} />
        </div>
      )}
      {result && (
        <div className="banner">
          <p>
            <strong>{result.title}</strong>
          </p>
          <p>{result.summary}</p>
          <Button
            type="button"
            onClick={() => onInsert(`Please review this math in-session:\n${result.insertText}`)}
          >
            Insert result into chat
          </Button>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "decimal" | "numeric";
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} inputMode={inputMode} autoComplete="off" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
