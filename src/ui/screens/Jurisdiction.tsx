import { useMemo, useState } from "react";
import { listJurisdictions } from "../../knowledge";
import { jurisdictionCopy } from "../../practice/areas";
import { useSession } from "../../session/store";
import { WhatsNext } from "../components/WhatsNext";

export function Jurisdiction() {
  const { setJurisdiction, state } = useSession();
  const [q, setQ] = useState("");
  const copy = jurisdictionCopy(state.practiceArea);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return listJurisdictions().filter(
      (j) => !needle || j.name.toLowerCase().includes(needle) || j.code.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <section className="card">
      <h2>{copy.heading}</h2>
      <WhatsNext />
      <p className="muted">{copy.body}</p>
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
