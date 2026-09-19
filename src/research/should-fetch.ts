import { isPracticeArea, mattersForArea } from "../practice/areas";
import type { MatterType, PracticeArea } from "../types";
import { MAX_QUERY_CHARS, type ResearchInput, type ResearchReason } from "./types";

const MATTERS = new Set<MatterType>(mattersForArea(null));

/** Procedural / currency questions that benefit from an allowlisted public page. */
export const FETCH_HINTS =
  /form|packet|clerk|court|file|filing|fee|self-?help|official|current|statute|code|guideline|worksheet|residenc|venue|where to|portal|lawhelp|support|custody|divorce|dissolution|protect|restrain|parenting|paternity|parentage|guardian|adoption|name change|alimony|spousal|service of process|summons|caption|look ?up|from the web|public page|website|small claims|eviction|landlord|tenant|contract|debt|collection|bail|arraign|discovery|plea|sentence|expunge|miranda|public defender|criminal|civil|statistic|numbers say|plea rate|pro se|caseload|as of|as-of|historical|amendment|constitution|prohibition|archives/i;

export const STATUTE_HINT = /statute|code|§|usc|annotated|title \d+/i;

const REASONS = new Set<ResearchReason>(["ask", "filing", "manual"]);

export function shouldFetch(opts: {
  query: string;
  jurisdiction?: string | null;
  matter?: MatterType | null;
  practiceArea?: PracticeArea | null;
  reason?: ResearchReason;
}): boolean {
  const reason = opts.reason ?? "ask";
  const query = opts.query.trim();
  if (reason === "filing" || reason === "manual") {
    return Boolean(opts.jurisdiction || opts.matter);
  }
  if (!query) return false;
  if (
    /\b(honesty|truth_buried|truth_overcame|anti-corruption|zionpattern|triadscore|hashchain lattice|case mode|casemode|truth_upheld|narrative_suppression|trajectorylock)\b/i.test(
      query,
    )
  ) {
    return false;
  }
  if (FETCH_HINTS.test(query)) return true;
  if (opts.jurisdiction && opts.matter && query.length >= 12) return true;
  return false;
}

export function parseResearchInput(raw: unknown): { ok: true; value: ResearchInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Expected a JSON object." };
  const body = raw as Record<string, unknown>;

  let jurisdiction: string | null = null;
  if (typeof body.jurisdiction === "string" && body.jurisdiction.trim()) {
    const code = body.jurisdiction.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return { ok: false, error: "jurisdiction must be a two-letter code." };
    jurisdiction = code;
  }

  let matter: MatterType | null = null;
  if (typeof body.matter === "string" && body.matter.trim()) {
    if (!MATTERS.has(body.matter as MatterType)) return { ok: false, error: "Unknown matter type." };
    matter = body.matter as MatterType;
  }

  let practiceArea: PracticeArea | null = null;
  if (typeof body.practiceArea === "string" && body.practiceArea.trim()) {
    if (!isPracticeArea(body.practiceArea)) return { ok: false, error: "Unknown practice area." };
    practiceArea = body.practiceArea;
  }

  const query = typeof body.query === "string" ? body.query.trim().slice(0, MAX_QUERY_CHARS) : "";
  const reason: ResearchReason =
    typeof body.reason === "string" && REASONS.has(body.reason as ResearchReason)
      ? (body.reason as ResearchReason)
      : "ask";

  return { ok: true, value: { jurisdiction, matter, practiceArea, query, reason } };
}
