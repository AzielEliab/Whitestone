import { EPHEMERAL_COPY, LEGAL_DISCLAIMER, NO_EXPORT_COPY, PRODUCT, WEB_RESEARCH_COPY } from "../../knowledge/common";
import {
  hasAreaSpecificState,
  PRACTICE_AREAS,
  PRACTICE_BLURBS,
  PRACTICE_LABELS,
} from "../../practice/areas";
import { useSession } from "../../session/store";
import type { PracticeArea } from "../../types";
import { Advanced } from "../components/Advanced";
import { LambLens } from "../components/LambLens";
import { WhatsNext } from "../components/WhatsNext";

export function Welcome() {
  const { state, beginSession, setHistoricalMode, setCaseMode } = useSession();

  function chooseArea(area: PracticeArea) {
    if (state.practiceArea && state.practiceArea !== area && hasAreaSpecificState(state)) {
      const ok = window.confirm(
        "Switch practice area? This clears matter, facts, chat, uploads, and web notes so sessions do not mix.",
      );
      if (!ok) return;
    }
    beginSession(area);
  }

  return (
    <section className="card grid">
      <LambLens />
      <h1>Whitestone</h1>
      <p className="lede">
        A private session to walk through Criminal, Civil, or Divorce procedure for any U.S. state or D.C.
        Erase it when you are done.
      </p>
      <WhatsNext />
      <h2>Choose a practice area</h2>
      <div className="area-grid sticky-actions">
        {PRACTICE_AREAS.map((id) => (
          <button
            key={id}
            type="button"
            className="area-choice"
            aria-pressed={state.practiceArea === id}
            onClick={() => chooseArea(id)}
          >
            <strong>{PRACTICE_LABELS[id]}</strong>
            <span>{PRACTICE_BLURBS[id]}</span>
          </button>
        ))}
      </div>
      <Advanced>
        <h3>Session options</h3>
        <label className="web-toggle">
          <input
            type="checkbox"
            checked={state.historicalMode}
            onChange={(e) => setHistoricalMode(e.target.checked)}
          />
          <span>
            <strong>Historical as-of</strong> — compare archival facts to standing law for a year and month.
            Honesty scores stay UNKNOWN without dated sources. Seeded federal milestones only.
          </span>
        </label>
        <label className="web-toggle">
          <input type="checkbox" checked={state.caseMode} onChange={(e) => setCaseMode(e.target.checked)} />
          <span>
            <strong>Case Mode</strong> — labeled evaluation of a current or historical case, with an optional
            score-card export. Confidence stays capped. UNKNOWN without dated sources.
          </span>
        </label>
        <h3>Notes</h3>
        <div className="banner" role="note">
          {LEGAL_DISCLAIMER}
        </div>
        <p>{EPHEMERAL_COPY}</p>
        <p>{WEB_RESEARCH_COPY}</p>
        <p>{NO_EXPORT_COPY}</p>
        <p className="muted">
          Criminal sessions cover procedure and rights education. Whitestone refuses help committing a crime,
          destroying evidence, intimidating a witness, or evading process. Civil sessions cover court self-help
          for the matters on the buttons above.
        </p>
        <p className="muted">
          The advisor is a self-contained knowledge base, dialogue machine, labeled math, cited statistics, and
          an AZCoherence-inspired grounding pass. It does not call a third-party model. The default path works
          without Workers AI.
        </p>
        <p className="muted">
          Coverage is a checklist plus cited public pages. Whitestone does not invent citations or statistics.
          Historical as-of says UNKNOWN when a dated record is missing. Verify dates and forms with the clerk.
        </p>
        <p className="muted">
          Optional: use your browser&apos;s Add to Home Screen for a shortcut. End & erase still wipes the session.
        </p>
      </Advanced>
      <p className="byline">
        {PRODUCT.name} {PRODUCT.version} · {PRODUCT.author}
      </p>
    </section>
  );
}
