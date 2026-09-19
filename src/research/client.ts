import { RESEARCH_CAPABILITY, type ResearchInput, type ResearchResult } from "./types";

function unavailable(notes: string): ResearchResult {
  return {
    ok: false,
    capability: RESEARCH_CAPABILITY,
    sources: [],
    notes,
    unavailable: true,
    failed: [],
    fetched: 0,
    cached: 0,
  };
}

const RESEARCH_MS = 4_000;

async function fetchResearch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RESEARCH_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function probeResearch(): Promise<boolean> {
  try {
    const res = await fetchResearch("/api/research", {
      method: "GET",
      headers: { accept: "application/json" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean; capability?: string };
    return data.ok === true && data.capability === RESEARCH_CAPABILITY;
  } catch {
    return false;
  }
}

export async function requestResearch(input: ResearchInput): Promise<ResearchResult> {
  try {
    const res = await fetchResearch("/api/research", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        jurisdiction: input.jurisdiction,
        matter: input.matter,
        practiceArea: input.practiceArea,
        query: input.query,
        reason: input.reason,
      }),
    });
    if (res.status === 404) {
      return unavailable(
        "Live research is not on this copy. The hosted Worker must be redeployed so /api/research is live.",
      );
    }
    if (res.status === 429) {
      return {
        ok: false,
        capability: RESEARCH_CAPABILITY,
        sources: [],
        notes: "The public-page lookup is rate-limited. Using the bundled knowledge layer.",
        unavailable: false,
        failed: [{ url: "/api/research", reason: "rate-limited" }],
        fetched: 0,
        cached: 0,
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        capability: RESEARCH_CAPABILITY,
        sources: [],
        notes: "The public-page lookup did not succeed. Using the bundled knowledge layer.",
        unavailable: false,
        failed: [{ url: "/api/research", reason: `http-${res.status}` }],
        fetched: 0,
        cached: 0,
      };
    }
    return (await res.json()) as ResearchResult;
  } catch {
    return unavailable("Live research could not be reached. Using the bundled knowledge layer.");
  }
}
