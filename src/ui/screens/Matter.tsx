import { getJurisdiction } from "../../knowledge";
import { MATTER_LABELS, type MatterType } from "../../types";
import { useSession } from "../../session/store";

const ORDER = Object.keys(MATTER_LABELS) as MatterType[];

export function Matter() {
  const { state, setMatter } = useSession();
  const j = getJurisdiction(state.jurisdiction);
  return (
    <section className="card grid">
      <h2>What kind of matter is this?</h2>
      {j && (
        <p className="muted">
          {j.name} · {j.courtName}. Coverage: {j.coverage}. Property regime:{" "}
          {j.propertyRegime === "community" ? "community property" : "equitable distribution"}.
        </p>
      )}
      <div className="choice-grid">
        {ORDER.map((id) => (
          <button key={id} type="button" className="choice" onClick={() => setMatter(id)}>
            <strong>{MATTER_LABELS[id]}</strong>
            <span className="muted">Guided checklist + filing structure</span>
          </button>
        ))}
      </div>
    </section>
  );
}
