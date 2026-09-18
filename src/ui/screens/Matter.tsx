import { getJurisdiction } from "../../knowledge";
import { mattersForArea } from "../../practice/areas";
import { MATTER_LABELS } from "../../types";
import { useSession } from "../../session/store";
import { WhatsNext } from "../components/WhatsNext";

export function Matter() {
  const { state, setMatter } = useSession();
  const j = getJurisdiction(state.jurisdiction);
  const order = mattersForArea(state.practiceArea);
  return (
    <section className="card grid">
      <h2>What kind of matter is this?</h2>
      <WhatsNext />
      {j && (
        <p className="muted">
          {j.name} · {j.courtName}. Coverage: {j.coverage}.
          {state.practiceArea === "divorce"
            ? ` Property regime: ${
                j.propertyRegime === "community" ? "community property" : "equitable distribution"
              }.`
            : " Confirm the clerk for the correct civil or criminal docket."}
        </p>
      )}
      <div className="choice-grid">
        {order.map((id) => (
          <button key={id} type="button" className="choice" onClick={() => setMatter(id)}>
            <strong>{MATTER_LABELS[id]}</strong>
            <span className="muted">Guided checklist + filing structure</span>
          </button>
        ))}
      </div>
    </section>
  );
}
