import type { MatterType } from "../types";
import { FEDERAL_FRAMEWORK } from "./common";
import { JURISDICTIONS, JURISDICTION_BY_CODE } from "./jurisdictions";
import { TOPIC_BY_ID, TOPICS } from "./topics";
import type { RetrievalHit } from "./types";

export * from "./types";
export * from "./common";
export * from "./jurisdictions";
export * from "./topics";

export function getJurisdiction(code: string | null | undefined) {
  if (!code) return undefined;
  return JURISDICTION_BY_CODE[code.toUpperCase()];
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function retrieveGuidance(opts: {
  query: string;
  jurisdiction?: string | null;
  matter?: MatterType | null;
  extra?: string[];
}): RetrievalHit[] {
  const bag = tokens([opts.query, ...(opts.extra ?? [])].join(" "));
  const hits: RetrievalHit[] = [];

  const matter = opts.matter ? TOPIC_BY_ID[opts.matter] : undefined;
  if (matter) {
    hits.push({
      score: 12,
      source: "topic",
      title: matter.title,
      body: matter.summary,
      topicId: matter.id,
    });
  }

  const j = getJurisdiction(opts.jurisdiction);
  if (j) {
    hits.push({
      score: 10,
      source: "jurisdiction",
      title: `${j.name} — court & divorce timing`,
      body: `Usual family trial court: ${j.courtName}. ${j.venueNote} Typical divorce residency: ${j.residencyDivorce}. Timing / separation: ${j.waitingOrSeparation}. Property: ${j.propertyRegime === "community" ? "community property" : "equitable distribution"}. Child-support model: ${j.childSupportModel.replace(/-/g, " ")}. Support duration (overview): ${j.childSupportEnds}. Agency: ${j.childSupportAgency}. Protection-order name: ${j.protectionOrderName}. Legal separation: ${j.legalSeparation} Official starting point: ${j.selfHelpUrl}`,
      jurisdiction: j.code,
    });
  }

  for (const topic of TOPICS) {
    let score = 0;
    for (const k of topic.keywords) {
      if (bag.some((t) => k.includes(t) || t.includes(k))) score += 3;
    }
    const titleTok = tokens(topic.title + " " + topic.summary);
    for (const t of bag) if (titleTok.includes(t)) score += 1;
    if (opts.matter === topic.id) score += 4;
    if (score > 0) {
      hits.push({
        score,
        source: "topic",
        title: topic.title,
        body: `${topic.summary} Filing path: ${topic.filingPathway.slice(0, 3).join(" ")}`,
        topicId: topic.id,
      });
    }
  }

  for (const fed of FEDERAL_FRAMEWORK) {
    let score = 0;
    const ft = tokens(fed.title + " " + fed.body);
    for (const t of bag) if (ft.includes(t)) score += 2;
    if (
      bag.some((t) =>
        ["uccjea", "home", "interstate", "uifsa", "iv-d", "safety", "911", "service", "fee"].includes(t),
      )
    ) {
      score += 1;
    }
    if (score > 0) {
      hits.push({
        score,
        source: "federal",
        title: fed.title,
        body: fed.body,
      });
    }
  }

  const seen = new Set<string>();
  return hits
    .sort((a, b) => b.score - a.score)
    .filter((h) => {
      const key = h.source + h.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function listJurisdictions() {
  return JURISDICTIONS;
}
