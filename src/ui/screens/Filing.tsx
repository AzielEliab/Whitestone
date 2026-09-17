import { buildFilingOutline } from "../../engine/filing";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";

export function Filing() {
  const { state, setStep } = useSession();
  const outline = buildFilingOutline(state);
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
      <div className="chips sticky-actions">
        <Button onClick={() => setStep("advise")}>Back to advisor</Button>
      </div>
    </section>
  );
}
