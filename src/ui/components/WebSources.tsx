import { retrievedDay } from "../../research/format";
import type { WebSource, WebStatus } from "../../types";
import { Button } from "./Button";

export function WebSources({
  sources,
  status,
  message,
  enabled,
  onToggle,
  onClear,
  onRefresh,
}: {
  sources: WebSource[];
  status: WebStatus;
  message: string;
  enabled: boolean;
  onToggle: (on: boolean) => void;
  onClear: () => void;
  onRefresh: () => void;
}) {
  return (
    <section className="web-sources" aria-label="Web sources for this session">
      <h3>Web sources (this session)</h3>
      <p className="muted">
        Allowlisted public court, legal-aid, and government pages only. Not legal
        advice. Not a complete statute book. End & erase clears these notes.
      </p>
      <label className="web-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <span>Use public court / legal-aid pages for this session</span>
      </label>
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Status: {statusLabel(status)}
        {message ? ` — ${message}` : ""}
      </p>
      {sources.length === 0 ? (
        <p className="muted">No public pages retrieved yet in this session.</p>
      ) : (
        <ul className="source-list">
          {sources.map((source) => (
            <li key={source.url} className="source-card">
              <strong>{source.title}</strong>
              <span className="muted source-meta">
                {source.label} · retrieved {retrievedDay(source.retrievedAt)}
              </span>
              <p className="source-excerpt">{source.excerpt}</p>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                Open source
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="chips source-actions">
        <Button type="button" onClick={onRefresh} disabled={!enabled || status === "loading"}>
          {status === "loading" ? "Looking up…" : "Look up public pages"}
        </Button>
        <Button type="button" onClick={onClear} disabled={!sources.length}>
          Clear web notes
        </Button>
      </div>
    </section>
  );
}

export function SourceChips({ sources }: { sources?: WebSource[] }) {
  if (!sources?.length) return null;
  return (
    <div className="source-chips">
      {sources.map((source) => (
        <a
          key={source.url}
          className="chip source-chip"
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {source.title}
        </a>
      ))}
    </div>
  );
}

function statusLabel(status: WebStatus): string {
  switch (status) {
    case "loading":
      return "retrieving allowlisted pages";
    case "ok":
      return "retrieved for this session";
    case "unavailable":
      return "live lookup unavailable — local knowledge in use";
    case "blocked":
      return "host not allowlisted";
    case "off":
      return "web lookup off";
    default:
      return "idle";
  }
}
