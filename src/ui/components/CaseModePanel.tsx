import { useMemo } from "react";
import { buildCaseExport, caseModeFromSession, exportFilename, formatCaseModeBlock } from "../../casemode";
import { standingAsOf } from "../../history";
import { caseModeVerifyQuery } from "../../research/should-fetch";
import { useSession } from "../../session/store";
import { Button } from "./Button";

function scoreText(status: "LABELED" | "UNKNOWN", value: number | null): string {
  if (status === "UNKNOWN" || value == null) return "UNKNOWN";
  return `${(value * 100).toFixed(1)} labeled (cap 75)`;
}

export function CaseModePanel({ onInsert }: { onInsert: (text: string) => void }) {
  const { state, refreshResearch } = useSession();
  const historicalSources = useMemo(() => {
    if (!state.asOfYear || !state.asOfMonth) return [];
    return standingAsOf({
      asOf: { year: state.asOfYear, month: state.asOfMonth },
      area: state.practiceArea,
      jurisdiction: state.jurisdiction,
    })
      .slice(0, 6)
      .map((r) => ({ title: `${r.citation} ${r.title}`, url: r.sourceUrl, date: r.effective_from }));
  }, [state.asOfYear, state.asOfMonth, state.practiceArea, state.jurisdiction]);
  const evaln = useMemo(
    () => caseModeFromSession({ ...state, historicalSources }),
    [state, historicalSources],
  );

  function downloadExport() {
    const card = buildCaseExport(evaln);
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(card.exportedAt);
    a.click();
    URL.revokeObjectURL(url);
  }

  const actor = evaln.fivew.independent_or_behalf;

  return (
    <section className="tool-panel" aria-label="Case Mode evaluation">
      <h3>Case Mode</h3>
      <p className="muted">
        Current and/or historical case evaluation. Scores are <strong>labeled</strong>. Confidence cap 75%.
        UNKNOWN without dated hashchained sources. Educational / archival.
      </p>
      <ul className="score-list">
        <li>
          <strong>truth_upheld</strong> {scoreText(evaln.truth_upheld.status, evaln.truth_upheld.value)}
          <span className="muted">{evaln.truth_upheld.note}</span>
        </li>
        <li>
          <strong>narrative_suppression</strong>{" "}
          {scoreText(evaln.narrative_suppression.status, evaln.narrative_suppression.value)}
          <span className="muted">{evaln.narrative_suppression.note}</span>
        </li>
        <li>
          <strong>systemic_suppression</strong>{" "}
          {scoreText(evaln.systemic_suppression.status, evaln.systemic_suppression.value)}
          <span className="muted">{evaln.systemic_suppression.note}</span>
        </li>
        <li>
          <strong>personal_professional_suppression</strong>{" "}
          {scoreText(evaln.personal_professional_suppression.status, evaln.personal_professional_suppression.value)}
          <span className="muted">{evaln.personal_professional_suppression.note}</span>
        </li>
      </ul>
      <p className="muted">
        why / who / what / how / when: {evaln.fivew.when ?? "UNKNOWN when"} · who{" "}
        {actor.role === "UNKNOWN" ? "UNKNOWN" : `${actor.name ?? "unnamed"} (${actor.role}${actor.behalfOf ? ` / ${actor.behalfOf}` : ""})`}
      </p>
      <p className="muted">
        TrajectoryLock {evaln.trajectory.status}
        {evaln.trajectory.line_fit != null ? ` line_fit ${evaln.trajectory.line_fit.toFixed(2)}` : ""} · VibeLock{" "}
        {evaln.vibelock.status} · SpectralLock {evaln.spectrallock.status} · lattice{" "}
        {evaln.honesty.engines.lattice.nodes.length} node(s)
      </p>
      <Button type="button" onClick={() => onInsert("Run Case Mode on the stated outcome against my uploads.")}>
        Ask advisor for Case Mode
      </Button>
      <Button
        type="button"
        onClick={() =>
          void refreshResearch(
            caseModeVerifyQuery({
              stated: state.facts.stated_outcome,
              official: state.facts.official_narrative,
              archival: state.facts.archival,
              jurisdiction: state.jurisdiction,
            }),
            "manual",
          )
        }
      >
        Verify online (allowlisted pages)
      </Button>
      <Button type="button" onClick={() => onInsert(formatCaseModeBlock(evaln))}>
        Insert Case Mode block
      </Button>
      <Button type="button" onClick={downloadExport}>
        Export hash chain + score card
      </Button>
    </section>
  );
}
