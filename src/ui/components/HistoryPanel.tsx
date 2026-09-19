import { useMemo, useState } from "react";
import {
  asOfFromSession,
  evaluateHistorical,
  formatHistoricalBlock,
  formatLawBullet,
  standingAsOf,
} from "../../history";
import { useSession } from "../../session/store";
import { AsOfPicker } from "./AsOfPicker";
import { Button } from "./Button";
import { HistoricalUploads } from "./HistoricalUploads";
import { HonestyPanel } from "./HonestyPanel";

export function HistoryPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const { state, setHistoricalMode, patch } = useSession();
  const [q, setQ] = useState("");
  const asOf = asOfFromSession(state.asOfYear, state.asOfMonth);
  const standing = useMemo(
    () => (asOf ? standingAsOf({ asOf, area: state.practiceArea, jurisdiction: state.jurisdiction }).slice(0, 5) : []),
    [asOf, state.practiceArea, state.jurisdiction],
  );
  const preview = useMemo(
    () =>
      evaluateHistorical({
        asOf,
        query: q || "standing federal law as of this month",
        archivalFacts: state.facts.archival,
        jurisdiction: state.jurisdiction,
        area: state.practiceArea,
      }),
    [asOf, q, state.facts.archival, state.jurisdiction, state.practiceArea],
  );

  return (
    <section className="tool-panel" aria-label="Historical as-of evaluation">
      <h3>Historical as-of</h3>
      <p className="muted">
        Compare archival case or ruling facts to a <strong>seeded</strong> federal timeline. Not a complete U.S. law
        book since 1776. State historical statutes are UNKNOWN unless a dated record exists. Not a lawyer.
      </p>
      <label className="web-toggle">
        <input
          type="checkbox"
          checked={state.historicalMode}
          onChange={(e) => setHistoricalMode(e.target.checked)}
        />
        Evaluate standing law as of a year and month
      </label>
      <AsOfPicker idPrefix="hist-asof" />
      <div className="field">
        <label htmlFor="archival-facts">Archival case / ruling facts (session-only)</label>
        <textarea
          id="archival-facts"
          value={state.facts.archival ?? ""}
          onChange={(e) => patch({ facts: { ...state.facts, archival: e.target.value } })}
          placeholder="Paste the dated facts you want compared — not a request to invent a holding."
        />
      </div>
      <HistoricalUploads compact />
      <HonestyPanel onInsert={onInsert} />
      <div className="field">
        <label htmlFor="hist-q">Ask the as-of engine</label>
        <input
          id="hist-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Was the 18th Amendment in force as of 1925-06?"
          autoComplete="off"
        />
      </div>
      {asOf ? (
        <ul className="source-list">
          {standing.map((row) => (
            <li key={row.id} className="source-card">
              <strong>
                {row.citation} · {row.event_type}
              </strong>
              <span className="muted source-meta">
                {row.effective_from}
                {row.effective_to ? ` → ${row.effective_to}` : ""} · {row.kind} · {row.jurisdiction}
              </span>
              <p className="source-excerpt">{row.title}</p>
              <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">
                {row.sourceTitle}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Choose year and month to preview standing seeded records.</p>
      )}
      <p className="muted">{preview.hook.status}: {preview.hook.note}</p>
      <Button
        type="button"
        onClick={() =>
          onInsert(q.trim() || `Evaluate standing law as of ${state.asOfYear ?? "YYYY"}-${state.asOfMonth ?? "MM"}.`)
        }
      >
        Ask advisor to evaluate as-of
      </Button>
      {asOf && standing[0] && (
        <Button type="button" onClick={() => onInsert(formatLawBullet(standing[0]))}>
          Insert first standing bullet
        </Button>
      )}
      {asOf && (
        <Button type="button" onClick={() => onInsert(formatHistoricalBlock(preview, state.facts.archival))}>
          Insert as-of comparison
        </Button>
      )}
    </section>
  );
}
