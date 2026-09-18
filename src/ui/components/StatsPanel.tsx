import { useMemo, useState } from "react";
import { formatStatBullet, statsForArea, retrieveStats } from "../../stats";
import { useSession } from "../../session/store";
import { Button } from "./Button";

export function StatsPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const { state } = useSession();
  const [q, setQ] = useState("");
  const rows = useMemo(
    () => (q.trim() ? retrieveStats({ query: q, area: state.practiceArea, limit: 5 }) : statsForArea(state.practiceArea, 5)),
    [q, state.practiceArea],
  );

  return (
    <section className="tool-panel" aria-label="Cited statistics">
      <h3>Statistics</h3>
      <p className="muted">
        Cited public figures only. Not a prediction of your case. National vs state is labeled.
        No invented statistics.
      </p>
      <div className="field">
        <label htmlFor="stat-q">Ask the numbers</label>
        <input
          id="stat-q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="plea rates, pro se parents, debt collection…"
          autoComplete="off"
        />
      </div>
      <ul className="source-list">
        {rows.map((row) => (
          <li key={row.id} className="source-card">
            <strong>{row.value}</strong>
            <span className="muted source-meta">
              {row.year} · {row.geography}
            </span>
            <p className="source-excerpt">{row.claim}</p>
            <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer">
              {row.sourceTitle}
            </a>
            <p className="muted">{row.notes}</p>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        onClick={() =>
          onInsert(q.trim() || "What do the numbers say?")
        }
      >
        Ask advisor for cited bullets
      </Button>
      {rows[0] && (
        <Button type="button" onClick={() => onInsert(formatStatBullet(rows[0]))}>
          Insert first cited bullet
        </Button>
      )}
    </section>
  );
}
