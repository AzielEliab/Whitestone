import { useEffect, useRef } from "react";
import { buildFilingOutline } from "../../engine/filing";
import { defaultResearchQuery } from "../../practice/areas";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";
import { WebSources } from "../components/WebSources";

export function Filing() {
  const { state, setStep, setWebEnabled, clearWebNotes, refreshResearch } = useSession();
  const outline = buildFilingOutline(state);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || !state.webEnabled || !state.jurisdiction || state.webNotes.length) return;
    seeded.current = true;
    void refreshResearch(`${defaultResearchQuery(state.practiceArea)} clerk packet official forms`, "filing");
  }, [state.webEnabled, state.jurisdiction, state.practiceArea, state.webNotes.length, refreshResearch]);
  return (
    <section className="card grid">
      <h2>Filing structure — on screen only</h2>
      <p className="warn">{outline.disclaimer}</p>
      <p className="muted">{outline.courtLine}</p>
      <div className="caption" aria-label="Caption draft, not selectable for export">
        {outline.caption}
      </div>
      <div>
        <h3>Pathway</h3>
        <ol>
          {outline.pathway.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div>
        <h3>Document checklist</h3>
        <ul>
          {outline.documents.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Issues / allegation map</h3>
        <ul>
          {outline.allegations.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Next steps</h3>
        <ol>
          {outline.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="banner">
        {outline.verify.map((s) => (
          <p key={s} style={{ marginBottom: 6 }}>
            {s}
          </p>
        ))}
      </div>
      <WebSources
        sources={state.webNotes}
        status={state.webStatus}
        message={state.webMessage}
        enabled={state.webEnabled}
        onToggle={setWebEnabled}
        onClear={clearWebNotes}
        onRefresh={() => {
          void refreshResearch(`${defaultResearchQuery(state.practiceArea)} clerk packet official forms`, "manual");
        }}
      />
      <div className="chips sticky-actions">
        <Button onClick={() => setStep("advise")}>Back to advisor</Button>
      </div>
    </section>
  );
}
