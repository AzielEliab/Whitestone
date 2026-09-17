import { useMemo, useState } from "react";
import { listJurisdictions } from "../../knowledge";
import { useSession } from "../../session/store";

export function Jurisdiction() {
  const { setJurisdiction, state } = useSession();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return listJurisdictions().filter(
      (j) => !needle || j.name.toLowerCase().includes(needle) || j.code.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <section className="card">
      <h2>Where will the case be heard?</h2>
      <p className="muted">
        Pick the state or D.C. of the court you expect to use. This is not a
        jurisdiction opinion. Child-custody venue often follows the child&apos;s
        home state (UCCJEA), which may differ from where you live now.
      </p>
      <div className="field">
        <label htmlFor="j-search">Search jurisdictions</label>
        <input
          id="j-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Oregon or OR"
          autoComplete="off"
          enterKeyHint="search"
          inputMode="search"
        />
      </div>
      <div className="choice-grid">
        {rows.map((j) => (
          <button
            key={j.code}
            type="button"
            className="choice"
            aria-pressed={state.jurisdiction === j.code}
            onClick={() => setJurisdiction(j.code)}
          >
            <strong>
              {j.name} ({j.code})
            </strong>
            <span className="muted">{j.courtName}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
