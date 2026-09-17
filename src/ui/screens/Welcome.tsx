import { EPHEMERAL_COPY, LEGAL_DISCLAIMER, NO_EXPORT_COPY, PRODUCT, WEB_RESEARCH_COPY } from "../../knowledge/common";
import { useSession } from "../../session/store";
import { Button } from "../components/Button";
import { LambLens } from "../components/LambLens";

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
      <p>
        This page is the full product — phone or desktop. Open the live Cloudflare
        URL in a browser and finish a session here. No zip, App Store app, or
        install.
      </p>
      <div className="banner" role="note">
        {LEGAL_DISCLAIMER}
      </div>
      <p>{EPHEMERAL_COPY}</p>
      <p>{WEB_RESEARCH_COPY}</p>
      <p>{NO_EXPORT_COPY}</p>
      <p className="muted">
        The advisor is a self-contained knowledge base and dialogue machine. It does
        not call OpenAI, Anthropic, Google, xAI, or any other third-party LLM.
        Synthesis stays in this app.
      </p>
      <p className="muted">
        Coverage is labeled. Prefer checklists, clerk packets, and cited public pages
        over fake precision. Whitestone does not invent citations and does not claim
        a complete statute book. Statutes change — verify with the clerk.
      </p>
      <p className="muted">
        Optional: use your browser&apos;s Add to Home Screen for a shortcut. Sessions
        stay ephemeral — End & erase still wipes chat, uploads, and web notes.
      </p>
      <div className="chips sticky-actions">
        <Button kind="primary" onClick={acceptDisclaimer}>
          I understand — begin a session
        </Button>
      </div>
      <p className="muted" style={{ fontSize: "0.82rem" }}>
        {PRODUCT.name} {PRODUCT.version} · Author {PRODUCT.author}
      </p>
    </section>
  );
}
