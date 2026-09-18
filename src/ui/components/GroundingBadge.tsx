import type { ChatMessage } from "../../types";

export function GroundingBadge({ message }: { message: ChatMessage }) {
  if (message.role !== "advisor" || !message.grounding) return null;
  const { verdict, confidenceCap, flags, evidence, motto } = message.grounding;
  return (
    <details className={`grounding grounding-${verdict.toLowerCase()}`}>
      <summary>
        Grounding: {verdict}
        {message.receipt ? ` · receipt ${message.receipt.sha256.slice(0, 10)}…` : ""}
      </summary>
      <p className="muted">{motto}</p>
      <p className="muted">Confidence cap {Math.round(confidenceCap * 100)}% — confidence is not truth.</p>
      {flags.length > 0 && <p>Flags: {flags.join("; ")}</p>}
      {evidence.length > 0 && (
        <ul>
          {evidence.map((e, i) => (
            <li key={`${e.kind}-${i}`}>
              {e.kind}: {e.label}
              {e.ref ? (
                <>
                  {" "}
                  <a href={e.ref} target="_blank" rel="noopener noreferrer">
                    source
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {message.receipt && (
        <p className="muted">
          Session receipt sha256 {message.receipt.sha256}. Wiped with End & erase. Not ChainLock.
        </p>
      )}
    </details>
  );
}
