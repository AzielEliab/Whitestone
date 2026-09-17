import { useSyncExternalStore } from "react";
import { NARROW_QUERY, shouldOfferSoftwareDownload } from "../../host";

function subscribeNarrow(onChange: () => void) {
  const mql = window.matchMedia(NARROW_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** Quiet optional zip — never shown on the hosted Worker or on phones. */
export function SoftwareDownload() {
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => true,
  );
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  if (!shouldOfferSoftwareDownload({ hostname, narrowViewport: narrow })) {
    return null;
  }
  return (
    <p className="offline-copy">
      <a
        className="quiet-link"
        href="https://github.com/AzielEliab/Whitestone/releases/latest"
        rel="noreferrer"
      >
        Optional offline copy
      </a>
    </p>
  );
}
