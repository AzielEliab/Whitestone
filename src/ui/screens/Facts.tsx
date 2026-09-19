import { canSkipToAdvisor } from "../../engine/facts";
import { PARTY_LABELS } from "../../practice/areas";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";
import { AsOfPicker } from "../components/AsOfPicker";
import { HistoricalUploads } from "../components/HistoricalUploads";
import { WhatsNext } from "../components/WhatsNext";

export function Facts() {
  const { state, patch, setStep, seedAdvisor, setHistoricalMode } = useSession();
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
      <WhatsNext />
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
      <div className="history-option">
        <label className="web-toggle">
          <input
            type="checkbox"
            checked={state.historicalMode}
            onChange={(e) => setHistoricalMode(e.target.checked)}
          />
          Historical as-of evaluation (year + month). Seeded federal timeline — not every law since 1776.
        </label>
        {state.historicalMode && (
          <>
            <AsOfPicker />
            <div className="field">
              <label htmlFor="archival">Archival case / ruling facts to compare</label>
              <textarea
                id="archival"
                value={state.facts.archival ?? ""}
                onChange={(e) => patch({ facts: { ...state.facts, archival: e.target.value } })}
                placeholder="Dated facts from the archival file — do not ask Whitestone to invent a holding."
              />
            </div>
            <div className="field">
              <label htmlFor="stated-outcome">Stated outcome / report / result to test</label>
              <textarea
                id="stated-outcome"
                value={state.facts.stated_outcome ?? ""}
                onChange={(e) => patch({ facts: { ...state.facts, stated_outcome: e.target.value } })}
                placeholder="What the official report or later write-up claimed happened — Whitestone will not invent a buried-truth finding without dated uploads."
              />
            </div>
            <div className="field">
              <label htmlFor="official-narrative">Official narrative (optional, defaults to stated outcome)</label>
              <textarea
                id="official-narrative"
                value={state.facts.official_narrative ?? ""}
                onChange={(e) => patch({ facts: { ...state.facts, official_narrative: e.target.value } })}
                placeholder="The public / official story. Official narrative is never treated as evidence."
              />
            </div>
            <HistoricalUploads />
            <p className="muted">
              End & erase wipes the as-of date, archival notes, honesty lattice, and uploads with the rest of
              the session. Not legal advice.
            </p>
          </>
        )}
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
        {canSkipToAdvisor(state) && (
          <Button
            onClick={() => {
              seedAdvisor();
            }}
          >
            Skip to advisor
          </Button>
        )}
        <Button onClick={() => setStep("matter")}>Back</Button>
      </div>
    </section>
  );
}
