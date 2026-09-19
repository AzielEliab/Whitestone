import { useMemo } from "react";
import { formatHonestyBlock, honestyFromSession } from "../../honesty";
import { standingAsOf } from "../../history";
import { useSession } from "../../session/store";
import { Button } from "./Button";

export function HonestyPanel({ onInsert }: { onInsert: (text: string) => void }) {
  const { state } = useSession();
  const historicalSources = useMemo(() => {
    if (!state.asOfYear || !state.asOfMonth) return [];
    return standingAsOf({
      asOf: { year: state.asOfYear, month: state.asOfMonth },
      area: state.practiceArea,
      jurisdiction: state.jurisdiction,
    }).slice(0, 6).map((r) => ({ title: `${r.citation} ${r.title}`, url: r.sourceUrl, date: r.effective_from }));
  }, [state.asOfYear, state.asOfMonth, state.practiceArea, state.jurisdiction]);
  const evaln = useMemo(
    () => honestyFromSession({ ...state, historicalSources }),
    [state, historicalSources],
  );

  return (
    <section className="tool-panel" aria-label="Anti-corruption honesty evaluation">
      <h3>Honesty / anti-corruption</h3>
      <p className="muted">
        Compare stated outcomes and reports to session uploads. Scores are <strong>labeled</strong> — Confidence is
        not truth. UNKNOWN when dated sources are missing. Not a lawyer.
      </p>
      <ul className="score-list">
        <li>
          <strong>truth_buried</strong>{" "}
          {evaln.truth_buried.status === "UNKNOWN" || evaln.truth_buried.value == null
            ? "UNKNOWN"
            : `${(evaln.truth_buried.value * 100).toFixed(1)} labeled`}
          <span className="muted">{evaln.truth_buried.note}</span>
        </li>
        <li>
          <strong>truth_overcame_lie</strong>{" "}
          {evaln.truth_overcame_lie.status === "UNKNOWN" || evaln.truth_overcame_lie.value == null
            ? "UNKNOWN"
            : `${(evaln.truth_overcame_lie.value * 100).toFixed(1)} labeled`}
          <span className="muted">{evaln.truth_overcame_lie.note}</span>
        </li>
        <li>
          <strong>honesty_overall</strong>{" "}
          {evaln.honesty_overall.status === "UNKNOWN" || evaln.honesty_overall.value == null
            ? "UNKNOWN"
            : `${(evaln.honesty_overall.value * 100).toFixed(1)} labeled (cap 75)`}
          <span className="muted">{evaln.honesty_overall.note}</span>
        </li>
      </ul>
      <p className="muted">
        Engines (ported, not invented): AZ-CLCE triple {evaln.engines.clce.triple.toFixed(2)} · SPRE PC{" "}
        {evaln.engines.spre.pc.toFixed(2)} · PhysLing {evaln.engines.physling.verified ? "verified" : "UNKNOWN"} ·
        triadscore {evaln.engines.triadscore.triad_ok ? "3-of-4" : "not 3-of-4"} · ZionPattern{" "}
        {evaln.engines.zion.display}/75 · lattice {evaln.engines.lattice.nodes.length} node(s)
      </p>
      {evaln.evidence.length > 0 && (
        <ul className="source-list">
          {evaln.evidence.slice(0, 6).map((e, i) => (
            <li key={`${e.source}-${i}`} className="source-card">
              <strong>
                {e.kind}
                {e.date ? ` · ${e.date}` : ""}
              </strong>
              <span className="muted source-meta">{e.label}</span>
              <p className="source-excerpt">{e.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" onClick={() => onInsert("Score honesty of the stated outcome against my uploads.")}>
        Ask advisor for honesty eval
      </Button>
      <Button type="button" onClick={() => onInsert(formatHonestyBlock(evaln))}>
        Insert honesty block
      </Button>
    </section>
  );
}
