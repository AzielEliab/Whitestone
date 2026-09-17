import { useSyncExternalStore } from "react";
import { isHostedWorkerApp, NARROW_QUERY, shouldOfferSoftwareDownload } from "../../host";

function subscribeNarrow(onChange: () => void) {
  const mql = window.matchMedia(NARROW_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function SoftwareDownload({ className = "btn download-cta" }: { className?: string }) {
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => true,
  );
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;
  if (!shouldOfferSoftwareDownload({ hostname, narrowViewport: narrow })) {
    return null;
  }
  const href = isHostedWorkerApp(hostname)
    ? "/download"
    : "https://github.com/AzielEliab/Whitestone/releases/latest";
  return (
    <a className={className} href={href} rel="noreferrer">
      Optional desktop zip
    </a>
  );
}
