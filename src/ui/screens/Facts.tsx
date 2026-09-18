import { PARTY_LABELS } from "../../practice/areas";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";

export function Facts() {
  const { state, patch, setStep } = useSession();
  const p = state.parties[0];
  const r = state.parties[1];
  const area = state.practiceArea ?? "divorce";
  const labels = PARTY_LABELS[area];
  const showChildren = area === "divorce";
  const relationshipLabel =
    area === "criminal" ? "Charge / case note" : area === "civil" ? "Dispute note" : "Marriage / relationship note";
  const relationshipPlaceholder =
    area === "criminal"
      ? "Misdemeanor arraignment next Tuesday; public defender requested…"
      : area === "civil"
        ? "Small-claims over an unpaid invoice; served last week…"
        : "Married 2018; separated March 2026…";

  return (
    <section className="card">
      <h2>People and facts</h2>
      <p className="muted">
        Names stay in this session only. Use legal names as they should appear on a
        caption — you will still retype them on the clerk&apos;s form.
        {area === "criminal"
          ? " Criminal cases are usually brought by the prosecutor. This caption is teaching structure only."
          : null}
      </p>
      <div className="grid two">
        <div className="field">
          <label htmlFor="p-name">{labels.filing}</label>
          <input
            id="p-name"
            autoComplete="name"
            enterKeyHint="next"
            value={p?.name ?? ""}
            onChange={(e) =>
              patch({
                parties: state.parties.map((x, i) => (i === 0 ? { ...x, name: e.target.value } : x)),
              })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="r-name">{labels.other}</label>
          <input
            id="r-name"
            autoComplete="name"
            enterKeyHint="next"
            value={r?.name ?? ""}
            onChange={(e) =>
              patch({
                parties: state.parties.map((x, i) => (i === 1 ? { ...x, name: e.target.value } : x)),
              })
            }
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="married">{relationshipLabel}</label>
        <input
          id="married"
          value={state.facts.relationship ?? ""}
          onChange={(e) => patch({ facts: { ...state.facts, relationship: e.target.value } })}
          placeholder={relationshipPlaceholder}
        />
      </div>
      <div className="field">
        <label htmlFor="goals">What do you need the court to do?</label>
        <textarea
          id="goals"
          value={state.facts.goals ?? ""}
          onChange={(e) => patch({ facts: { ...state.facts, goals: e.target.value } })}
        />
      </div>
      {showChildren && (
        <>
          <h3>Minor children (optional)</h3>
          {state.children.map((c, i) => (
            <div className="grid two" key={i}>
              <div className="field">
                <label>Child initials or first name</label>
                <input
                  value={c.name}
                  onChange={(e) => {
                    const children = state.children.slice();
                    children[i] = { ...c, name: e.target.value };
                    patch({ children });
                  }}
                />
              </div>
              <div className="field">
                <label>Age</label>
                <input
                  value={c.age}
                  onChange={(e) => {
                    const children = state.children.slice();
                    children[i] = { ...c, age: e.target.value };
                    patch({ children });
                  }}
                />
              </div>
            </div>
          ))}
        </>
      )}
      <div className="chips sticky-actions">
        {showChildren && (
          <Button
            onClick={() =>
              patch({ children: [...state.children, { name: "", age: "", livesWith: "" }] })
            }
          >
            Add a child
          </Button>
        )}
        <Button kind="primary" onClick={() => setStep("evidence")}>
          Continue to evidence
        </Button>
        <Button onClick={() => setStep("matter")}>Back</Button>
      </div>
    </section>
  );
}
