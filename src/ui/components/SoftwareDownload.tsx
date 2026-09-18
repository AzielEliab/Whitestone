import { softwareDownloadHref, shouldOfferSoftwareDownload } from "../../host";

type Variant = "header" | "welcome" | "footer";

function currentHostname(): string {
  return typeof window === "undefined" ? "" : window.location.hostname;
}

/** Optional software zip — hosted and mobile included. The live site works without installing. */
export function SoftwareDownload({ variant = "footer" }: { variant?: Variant }) {
  const hostname = currentHostname();
  if (!shouldOfferSoftwareDownload({ hostname, narrowViewport: false })) {
    return null;
  }
  const href = softwareDownloadHref(hostname);

  if (variant === "header") {
    return (
      <a className="btn download-cta" href={href} rel="noreferrer">
        Download software
      </a>
    );
  }

  if (variant === "welcome") {
    return (
      <p className="download-welcome">
        <a className="quiet-link" href={href} rel="noreferrer">
          Download software
        </a>
        <span className="muted">
          {" "}
          — optional GitHub Release zip. This live site is the full product and works without installing.
        </span>
      </p>
    );
  }

  return (
    <p className="offline-copy">
      <a className="quiet-link" href={href} rel="noreferrer">
        Download software
      </a>
      <span> — optional zip. The live site works without installing.</span>
    </p>
  );
}
