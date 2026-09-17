import { EPHEMERAL_COPY, LEGAL_DISCLAIMER, NO_EXPORT_COPY, PRODUCT } from "../../knowledge/common";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";
import { LambLens } from "../components/LambLens";
import { SoftwareDownload } from "../components/SoftwareDownload";

export function Welcome() {
  const { acceptDisclaimer } = useSession();
  return (
    <section className="card grid">
      <LambLens />
      <h1>Whitestone</h1>
      <p className="serif muted">
        An ephemeral pro se family-law advisor for all 50 states and D.C. Educational
        procedural guidance — not a lawyer, not legal advice, not a replacement for
        counsel.
      </p>
      <div className="banner" role="note">
        {LEGAL_DISCLAIMER}
      </div>
      <p>{EPHEMERAL_COPY}</p>
      <p>{NO_EXPORT_COPY}</p>
      <p className="muted">
        The advisor is a self-contained knowledge base and dialogue machine. It does
        not call OpenAI, Anthropic, Google, xAI, or any other third-party LLM. A
        downloaded copy works without API keys.
      </p>
      <p className="muted">
        Coverage is labeled. Prefer checklists and filing structure over fake
        precision. Statutes change — verify with the clerk.
      </p>
      <div className="chips">
        <Button kind="primary" onClick={acceptDisclaimer}>
          I understand — begin a session
        </Button>
        <SoftwareDownload />
      </div>
      <p className="muted" style={{ fontSize: "0.82rem" }}>
        {PRODUCT.name} {PRODUCT.version} · Author {PRODUCT.author}
      </p>
    </section>
  );
}
