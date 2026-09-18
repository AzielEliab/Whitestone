/** Viewport used for compact chrome — download CTAs stay available either way. */
export const NARROW_QUERY = "(max-width: 720px)";

export const SOFTWARE_RELEASES_URL = "https://github.com/AzielEliab/Whitestone/releases/latest";
export const SOFTWARE_ZIP_URL =
  "https://github.com/AzielEliab/Whitestone/releases/latest/download/whitestone-standalone.zip";

/**
 * The live Cloudflare Worker (or author domain) is the hosted product.
 * The zip remains an optional download on that surface too.
 */
export function isHostedWorkerApp(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host) return false;
  return (
    host.endsWith(".workers.dev") ||
    host === "workers.dev" ||
    host.endsWith(".azieleliab.com") ||
    host === "azieleliab.com"
  );
}

/**
 * Optional software zip — available on hosted and local, desktop and mobile.
 * The live site still works without installing.
 */
export function shouldOfferSoftwareDownload(_opts?: {
  hostname: string;
  narrowViewport: boolean;
}): boolean {
  return true;
}

/** Hosted `/download` increments the Worker counter; local builds use the GitHub Release page. */
export function softwareDownloadHref(hostname: string): string {
  return isHostedWorkerApp(hostname) ? "/download" : SOFTWARE_RELEASES_URL;
}

export function applyHostSurface(doc: Document = document, loc: Location = location): void {
  const html = doc.documentElement;
  html.dataset.surface = isHostedWorkerApp(loc.hostname) ? "hosted" : "local";
  const narrow =
    typeof window.matchMedia === "function" && window.matchMedia(NARROW_QUERY).matches;
  html.dataset.narrow = narrow ? "true" : "false";
}
