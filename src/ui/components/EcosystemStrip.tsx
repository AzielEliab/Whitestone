import { ECOSYSTEM_SITES } from "../../ecosystem/sites";

/** Quiet cross-reference. The pro se session stays the page; /doors has the full list. */
export function EcosystemStrip() {
  return (
    <footer className="ecosystem-strip">
      <nav aria-label="Ecosystem">
        <a className="eco-label" href="/doors">
          Ecosystem
        </a>
        <ul>
          {ECOSYSTEM_SITES.map((site) => (
            <li key={site.href}>
              <a href={site.href} rel="noopener noreferrer" title={site.summary}>
                {site.name}
                {site.clarify ? <span className="sr-only">. {site.summary}</span> : null}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
