/** Canonical live public Aziel Eliab ecosystem. Verified 2026-11-19. */

export const ORIGIN = "https://whitestone.vibelock.workers.dev";
export const AUTHOR_NAME = "Aziel Eliab";
export const AUTHOR_ID = "https://www.azieleliab.com/#aziel";
export const AUTHOR_URL = "https://www.azieleliab.com/";
export const X_URL = "https://x.com/AzielEliab";
export const VERSION = "1.6.0";
export const ECOSYSTEM_VERIFIED = "2026-11-19";
export const DISCOVERY_LASTMOD = "2026-11-20";

/** Machine-only names. Put these in JSON-LD, llms.txt, and ai.txt — not in visible page chrome. */
export const AUTHOR_ALIASES = [
  "Aziel Eliab",
  "AzielEliab",
  "azieleliab",
  "Aziel Elroi Eliab",
  "The Revealer of the Sealed",
  "Elias Artista",
] as const;

export const PRODUCT_DESCRIPTION =
  "Ephemeral pro se legal app by Aziel Eliab for Criminal, Civil, and Divorce. Session-only memory. No third-party LLM APIs. Optional zip download. May cite allowlisted public court and legal-aid pages.";

export type EcosystemSite = {
  name: string;
  href: string;
  summary: string;
  /** Extra public listing for a runtime. Not an eleventh ecosystem site. */
  listing?: { href: string; label: string };
  /** Repeat the summary for assistive tech when the strip shows only the name. */
  clarify?: boolean;
};

export const ECOSYSTEM_SITES: readonly EcosystemSite[] = [
  {
    name: "Aziel Eliab",
    href: "https://www.azieleliab.com/",
    summary: "Identity Hub",
  },
  {
    name: "Aziel Corpus Library",
    href: "https://www.azielcorpuslibrary.net/",
    summary: "Live public site in the Aziel Eliab ecosystem",
  },
  {
    name: "GodLock",
    href: "https://godlock.uk/",
    summary: "Live public site in the Aziel Eliab ecosystem",
  },
  {
    name: "He Didn't Jump",
    href: "https://hedidntjump.com/",
    summary: "Marion Zioncheck Archive",
  },
  {
    name: "Furnace Isn't Free",
    href: "https://furnaceisntfree.com/",
    summary: "Live public site in the Aziel Eliab ecosystem",
  },
  {
    name: "Time to Unseal the Book",
    href: "https://timetounsealthebook.net/",
    summary: "Live public site in the Aziel Eliab ecosystem",
  },
  {
    name: "Whitestone",
    href: `${ORIGIN}/`,
    summary: "Live pro se legal web app for Criminal, Civil, and Divorce",
  },
  {
    name: "Aziel Runtime",
    href: "https://aziel-runtime.vibelock.workers.dev/",
    summary: "MCP/Softwares",
    listing: {
      href: "https://glama.ai/mcp/servers/AzielEliab/aziel-runtime",
      label: "Glama",
    },
  },
  {
    name: "Trades Runtime",
    href: "https://trades-runtime.vibelock.workers.dev/",
    summary: "Public MCP runtime",
    listing: {
      href: "https://glama.ai/mcp/servers/AzielEliab/trades-runtime",
      label: "Glama",
    },
  },
  {
    name: "MirageGrid",
    href: "https://miragegrid.vibelock.workers.dev/",
    summary: "Cap-7 mesh DNS factory Worker. Mesh-only. public_icann: false. Not an ICANN registrar.",
    clarify: true,
  },
];
