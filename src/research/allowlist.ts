import { JURISDICTIONS } from "../knowledge/jurisdictions/data";
import type { AllowMatch } from "./types";

/** Legal-aid / LawHelp hosts (public education — not counsel). */
const LEGAL_AID_HOSTS = new Set([
  "www.lawhelp.org",
  "lawhelp.org",
  "www.lawhelpinteractive.org",
  "texaslawhelp.org",
  "www.texaslawhelp.org",
  "www.illinoislegalaid.org",
  "illinoislegalaid.org",
  "www.masslegalhelp.org",
  "masslegalhelp.org",
  "www.lawhelpny.org",
  "lawhelpny.org",
  "www.washingtonlawhelp.org",
  "washingtonlawhelp.org",
  "oregonlawhelp.org",
  "www.oregonlawhelp.org",
  "www.peoples-law.org",
  "peoples-law.org",
  "www.lsc.gov",
  "lsc.gov",
  "www.legal-aid.org",
  "legal-aid.org",
]);

/** Conservative public-education state-bar hosts. */
const STATE_BAR_HOSTS = new Set([
  "www.calbar.ca.gov",
  "calbar.ca.gov",
]);

/** Non-.gov judiciary portals that appear in the jurisdiction table or are well-known court systems. */
const JUDICIARY_EXTRA_HOSTS = new Set([
  "www.lasc.org",
  "lasc.org",
  "www.oscn.net",
  "oscn.net",
  "www.sccourts.org",
  "sccourts.org",
  "www.vermontjudiciary.org",
  "vermontjudiciary.org",
]);

const FEDERAL_HOST_RE =
  /(^|\.)(usa\.gov|justice\.gov|acf\.hhs\.gov|hhs\.gov|childwelfare\.gov|lsc\.gov|congress\.gov|uscourts\.gov|bjs\.gov|ojp\.gov|consumerfinance\.gov|ftc\.gov|hud\.gov)$/;

let selfHelpHostCache: Set<string> | null = null;

export function selfHelpHosts(): Set<string> {
  if (selfHelpHostCache) return selfHelpHostCache;
  const hosts = new Set<string>();
  for (const j of JURISDICTIONS) {
    const parsed = parseHttpsUrl(j.selfHelpUrl);
    if (parsed) hosts.add(parsed.hostname);
  }
  selfHelpHostCache = hosts;
  return hosts;
}

export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1") {
    return true;
  }
  if (/^10\.\d+\.\d+\.\d+$/.test(h)) return true;
  if (/^192\.168\.\d+\.\d+$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(h)) return true;
  if (/^169\.254\.\d+\.\d+$/.test(h)) return true;
  if (h === "metadata.google.internal" || h.endsWith(".internal")) return true;
  return false;
}

export function parseHttpsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!host || isPrivateHost(host)) return null;
    return url;
  } catch {
    return null;
  }
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, "");
}

export function classifyHost(host: string): AllowMatch | null {
  const h = normalizeHost(host);
  if (!h || isPrivateHost(h)) return null;

  if (h === "law.justia.com" || h === "statutes.justia.com") {
    return {
      kind: "justia",
      label: "Justia (unofficial statute browser — confirm the official state code)",
    };
  }
  if (h === "justia.com" || h === "www.justia.com" || h.endsWith(".justia.com")) {
    return null;
  }

  if (h === "www.law.cornell.edu" || h.endsWith(".law.cornell.edu")) {
    return {
      kind: "lii",
      label: "Cornell LII (public legal encyclopedia — not official for your court)",
    };
  }

  if (h === "www.lawhelp.org" || h.endsWith(".lawhelp.org") || LEGAL_AID_HOSTS.has(h)) {
    return {
      kind: "legal-aid",
      label: "Legal aid / LawHelp (public education — not your lawyer)",
    };
  }

  if (STATE_BAR_HOSTS.has(h)) {
    return { kind: "state-bar", label: "State bar public education" };
  }

  if (h.endsWith(".gov")) {
    if (FEDERAL_HOST_RE.test(h)) {
      return { kind: "federal-public", label: "U.S. government public page" };
    }
    return { kind: "state-judiciary", label: "Court / self-help portal" };
  }

  if (selfHelpHosts().has(h) || JUDICIARY_EXTRA_HOSTS.has(h)) {
    return { kind: "state-judiciary", label: "Court / self-help portal" };
  }

  if (h.endsWith(".us") && /(^|\.)(courts?|judiciary|selfhelp)/.test(h)) {
    return { kind: "state-judiciary", label: "Court / self-help portal" };
  }

  return null;
}

export function classifyUrl(raw: string): AllowMatch | null {
  const url = parseHttpsUrl(raw);
  if (!url) return null;
  return classifyHost(url.hostname);
}

export function isAllowedUrl(raw: string): boolean {
  return classifyUrl(raw) !== null;
}

export function shouldFetchUrl(raw: string): boolean {
  return isAllowedUrl(raw);
}

export function describeAllowlist(): {
  kinds: string[];
  patterns: string[];
  exampleHosts: string[];
  blockedExamples: string[];
} {
  return {
    kinds: ["state-judiciary", "legal-aid", "state-bar", "lii", "justia", "federal-public"],
    patterns: [
      "https only",
      "state judiciary / self-help hosts from the jurisdiction table",
      "*.gov court and public pages",
      "*.us court/judiciary hostnames",
      "LawHelp and listed legal-aid hosts",
      "Cornell LII and law.justia.com (labeled unofficial)",
      "usa.gov / justice.gov / ACF / uscourts.gov / CFPB public pages (family, civil, criminal education)",
    ],
    exampleHosts: [
      "selfhelp.courts.ca.gov",
      "www.nycourts.gov",
      "www.lawhelp.org",
      "www.law.cornell.edu",
      "law.justia.com",
      "www.usa.gov",
      "www.justice.gov",
      "www.uscourts.gov",
      "www.consumerfinance.gov",
    ],
    blockedExamples: ["random blogs", "SEO mills", "lawyer-directory hosts", "www.justia.com", "non-allowlisted hosts"],
  };
}
