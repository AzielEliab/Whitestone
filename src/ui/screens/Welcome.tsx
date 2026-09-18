import { EPHEMERAL_COPY, LEGAL_DISCLAIMER, NO_EXPORT_COPY, PRODUCT, WEB_RESEARCH_COPY } from "../../knowledge/common";
import {
  hasAreaSpecificState,
  PRACTICE_AREAS,
  PRACTICE_BLURBS,
  PRACTICE_LABELS,
} from "../../practice/areas";
import { useSession } from "../../session/store";
import type { PracticeArea } from "../../types";
import { SoftwareDownload } from "../components/SoftwareDownload";
import { LambLens } from "../components/LambLens";
import { WhatsNext } from "../components/WhatsNext";

export function Welcome() {
  const { state, beginSession } = useSession();

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
      <p className="serif muted">
        One ephemeral pro se advisor — Criminal, Civil, and Divorce. Educational
        procedural guidance for all 50 states and D.C. Not a lawyer, not legal advice.
      </p>
      <WhatsNext />
      <h2>Choose a practice area</h2>
      <p className="muted">
        One software. Pick Criminal, Civil, or Divorce for this session. Change later
        only with a reset so areas do not mix.
      </p>
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
      <details className="notices">
        <summary>Important notices — not a lawyer, session-only, no case exports</summary>
        <div className="banner" role="note">
          {LEGAL_DISCLAIMER}
        </div>
        <p>{EPHEMERAL_COPY}</p>
        <p>{WEB_RESEARCH_COPY}</p>
        <p>{NO_EXPORT_COPY}</p>
        <p className="muted">
          The advisor is a self-contained knowledge base, dialogue machine, labeled math,
          cited statistics, and an AZCoherence-inspired grounding pass. It does not call
          OpenAI, Anthropic, Google, xAI, Groq, or any other third-party LLM. Synthesis
          stays in this app. Default path works without Workers AI.
        </p>
        <p className="muted">
          Coverage is labeled. Prefer checklists, clerk packets, and cited public pages
          over fake precision. Whitestone does not invent citations or statistics and does
          not claim a complete statute book. Statutes change — verify with the clerk.
        </p>
        <p className="muted">
          Optional: use your browser&apos;s Add to Home Screen for a shortcut. Sessions
          stay ephemeral — End & erase still wipes chat, uploads, and web notes.
        </p>
      </details>
      <SoftwareDownload variant="welcome" />
      <p className="muted" style={{ fontSize: "0.82rem" }}>
        {PRODUCT.name} {PRODUCT.version} · Author {PRODUCT.author}
      </p>
    </section>
  );
}
