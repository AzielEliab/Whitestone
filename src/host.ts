/** Viewport where download CTAs and desktop chrome get in the way. */
export const NARROW_QUERY = "(max-width: 720px)";

/**
 * The live Cloudflare Worker (or author domain) is the product.
 * Do not send people to a zip from that surface.
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

/** Optional offline-zip footer — never on phones or the hosted Worker. */
export function shouldOfferSoftwareDownload(opts: {
  hostname: string;
  narrowViewport: boolean;
}): boolean {
  if (opts.narrowViewport) return false;
  if (isHostedWorkerApp(opts.hostname)) return false;
  return true;
}

export function applyHostSurface(doc: Document = document, loc: Location = location): void {
  const html = doc.documentElement;
  html.dataset.surface = isHostedWorkerApp(loc.hostname) ? "hosted" : "local";
  const narrow =
    typeof window.matchMedia === "function" && window.matchMedia(NARROW_QUERY).matches;
  html.dataset.narrow = narrow ? "true" : "false";
}
