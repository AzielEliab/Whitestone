import { useSession } from "../../session/store";
import { Button } from "../components/Button";

export function Facts() {
  const { state, patch, setStep } = useSession();
  const p = state.parties[0];
  const r = state.parties[1];

  return (
    <section className="card">
      <h2>People and facts</h2>
      <p className="muted">
        Names stay in this session only. Use legal names as they should appear on a
        caption — you will still retype them on the clerk&apos;s form.
      </p>
      <div className="grid two">
        <div className="field">
          <label htmlFor="p-name">Filing party (petitioner)</label>
          <input
            id="p-name"
            value={p?.name ?? ""}
            onChange={(e) =>
              patch({
                parties: state.parties.map((x, i) => (i === 0 ? { ...x, name: e.target.value } : x)),
              })
            }
          />
        </div>
        <div className="field">
          <label htmlFor="r-name">Other party (respondent)</label>
          <input
            id="r-name"
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
        <label htmlFor="married">Marriage / relationship note</label>
        <input
          id="married"
          value={state.facts.relationship ?? ""}
          onChange={(e) => patch({ facts: { ...state.facts, relationship: e.target.value } })}
          placeholder="Married 2018; separated March 2026…"
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
      <div className="chips">
        <Button
          onClick={() =>
            patch({ children: [...state.children, { name: "", age: "", livesWith: "" }] })
          }
        >
          Add a child
        </Button>
        <Button kind="primary" onClick={() => setStep("evidence")}>
          Continue to evidence
        </Button>
      </div>
    </section>
  );
}
