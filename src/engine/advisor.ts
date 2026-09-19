import { coherenceCheck, sessionReceipt, RESPONSIBILITY_LINE } from "../guard";
import type { CoherenceReport } from "../guard";
import { FEDERAL_FRAMEWORK, getJurisdiction, retrieveGuidance, TOPIC_BY_ID } from "../knowledge";
import { LEGAL_DISCLAIMER } from "../knowledge/common";
import { parseMathAsk } from "../math";
import { PRACTICE_LABELS } from "../practice/areas";
import { criminalRefuse } from "../practice/refuse";
import { fallbackResearchNote, formatWebNotes } from "../research/format";
import type { ResearchResult } from "../research/types";
import { retrieveStats, formatStatsBlock } from "../stats";
import {
  asOfFromSession,
  evaluateHistorical,
  formatHistoricalBlock,
  looksHistorical,
  standingAsOf,
} from "../history";
import { formatHonestyBlock, honestyFromSession } from "../honesty";
import type { SessionState } from "../types";
import { MATTER_LABELS } from "../types";
import { nextQuestion } from "./dialogue";
import { sessionSnapshot, snapshotLine } from "./facts";
import { followUpPrompts } from "./followups";
import { routeIntent, type AdvisorIntent } from "./intent";
import { learnFromSession, learnFromText } from "./learn";
import { formatPlan, workingPlan } from "./plan";
import { formatIrac, formatReasoning, reasonAbout } from "./reason";

export interface AdviseResult {
  reply: string;
  state: SessionState;
  intent: AdvisorIntent;
  followUps: string[];
  grounding: CoherenceReport;
  receipt: ReturnType<typeof sessionReceipt>;
}

export function openingMessage(state: SessionState): string {
  const j = getJurisdiction(state.jurisdiction);
  const topic = state.matter ? TOPIC_BY_ID[state.matter] : undefined;
  const bits = [
    "I am Whitestone's session advisor — a structured knowledge guide, not a lawyer and not an online model calling an outside company.",
    LEGAL_DISCLAIMER,
    "This chat exists only in your current session. There is no export of filings, chat, or evidence.",
  ];
  if (state.webEnabled) {
    bits.push(
      "On the hosted app I may retrieve allowlisted public court, legal-aid, and government pages for currency. Those snippets stay in this session only. Offline copies fall back to the bundled knowledge layer. I still do not invent citations, and I am not a lawyer.",
    );
  }
  if (state.practiceArea) {
    bits.push(`Practice area for this session: ${PRACTICE_LABELS[state.practiceArea]}. Changing area clears matter-specific notes so sessions do not mix.`);
  }
  if (state.historicalMode || state.asOfYear) {
    const asOf =
      state.asOfYear && state.asOfMonth
        ? `${state.asOfYear}-${String(state.asOfMonth).padStart(2, "0")}`
        : "year and month not set yet";
    bits.push(
      `Historical as-of evaluation is on (${asOf}). The engine compares your archival facts to a seeded federal constitutional and major-statute timeline with source URLs — not a complete digitized corpus of every U.S. law since 1776. State historical statutes are UNKNOWN unless a dated record exists. I will not invent holdings, form numbers, or uncitable “the law said X in 1850” claims. Upload case filings, evidence, historical reports, and news clippings on the historical path — in only. Honesty scores (truth_buried / truth_overcame_lie / honesty_overall) stay UNKNOWN without dated sources. Confidence is not truth.`,
    );
  }
  if (state.practiceArea === "criminal") {
    bits.push(
      "Criminal sessions are rights and process education. I will not help commit a crime, destroy evidence, intimidate a witness, or evade arrest or court process. For any charge that could mean jail or a record, talk to a lawyer or public defender.",
    );
  }
  if (j) {
    bits.push(
      `Jurisdiction in this session: ${j.name}. Usual court: ${j.courtName}. Coverage level: ${j.coverage} (not a complete annotated code).`,
    );
  }
  if (topic) bits.push(`${topic.title}: ${topic.summary}`);
  const named = state.parties.some((p) => p.name.trim()) || Object.keys(state.answers).length || state.facts.goals;
  if (named) bits.push(snapshotLine(state));
  if (state.learned.safetyFlag) {
    bits.push(
      "Safety language appeared in this session. If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233.",
    );
  }
  const q = nextQuestion(state);
  if (q) bits.push(`Next structured question: ${q.prompt}`);
  bits.push("Ask a question, use Math or Statistics, or skip ahead after jurisdiction, matter, and a few facts.");
  return bits.join("\n\n");
}

export function advise(
  state: SessionState,
  userText: string,
  research?: ResearchResult | null,
): AdviseResult {
  const learned = learnFromText(learnFromSession(state), userText);
  const next: SessionState = { ...state, learned };
  const intent = routeIntent(userText, next);
  const snap = sessionSnapshot(next);
  const factsLine = snapshotLine(next);
  const j = getJurisdiction(state.jurisdiction);
  const topic = state.matter ? TOPIC_BY_ID[state.matter] : undefined;

  const refused = criminalRefuse(userText);
  if (refused) {
    return finish(next, userText, intent, [refused, RESPONSIBILITY_LINE, lens()], research, [], factsLine, topic ? [topic.summary] : []);
  }

  const hits = retrieveGuidance({
    query: userText,
    jurisdiction: state.jurisdiction,
    matter: state.matter,
    practiceArea: state.practiceArea,
    extra: [...learned.keywords, ...Object.values(state.answers), ...state.uploads.map((u) => u.note), factsLine],
    answers: state.answers,
  });

  const math = parseMathAsk(userText, { jurisdiction: state.jurisdiction });
  const stats =
    intent === "stats" || /\bnumbers|statistic|how common|plea rate|pro se\b/i.test(userText)
      ? retrieveStats({ query: userText, area: state.practiceArea, limit: 3 })
      : [];
  const asOf = asOfFromSession(state.asOfYear, state.asOfMonth);
  const historicalOn =
    intent === "historical" ||
    state.historicalMode ||
    looksHistorical(userText) ||
    Boolean(state.facts.archival?.trim() && asOf);
  const historical = historicalOn
    ? evaluateHistorical({
        asOf,
        query: userText,
        archivalFacts: state.facts.archival,
        jurisdiction: state.jurisdiction,
        area: state.practiceArea,
        research,
      })
    : null;
  const honestyOn =
    intent === "honesty" ||
    Boolean(state.historicalMode && (state.facts.stated_outcome?.trim() || state.uploads.some((u) => u.kind && u.kind !== "evidence"))) ||
    (historicalOn && state.uploads.length > 0);
  const honesty = honestyOn
    ? honestyFromSession({
        ...next,
        historicalSources: historical
          ? [...historical.matched, ...historical.standing].slice(0, 6).map((r) => ({
              title: `${r.citation} ${r.title}`,
              url: r.sourceUrl,
              date: r.effective_from,
            }))
          : asOf
            ? standingAsOf({ asOf, area: state.practiceArea, jurisdiction: state.jurisdiction })
                .slice(0, 6)
                .map((r) => ({ title: `${r.citation} ${r.title}`, url: r.sourceUrl, date: r.effective_from }))
            : [],
      })
    : null;
  const reasoned = reasonAbout(next, intent);

  const parts: string[] = [];
  const knowledgeBits: string[] = [];

  if (learned.safetyFlag && (intent === "safety" || intent === "general")) {
    parts.push(
      `Safety first for ${snap.filingName}. If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233. A protection-order clerk window is usually faster than a long packet in another matter.`,
    );
  }

  if (intent !== "math" && intent !== "stats") {
    parts.push(personalizedLead(intent, snap, factsLine));
  }

  if (math) {
    parts.push(math.insertText);
    if (stats[0]) {
      parts.push(
        `Public-stat context (not a prediction of YOUR case): ${stats[0].claim} Source: ${stats[0].sourceTitle} — ${stats[0].sourceUrl} (${stats[0].year}).`,
      );
    }
  }

  if (intent === "stats" || (stats.length && intent !== "math")) {
    parts.push(formatStatsBlock(stats, state.practiceArea));
  }

  if (research?.sources.length) {
    parts.push(formatWebNotes(research));
  } else {
    const fallback = research ? fallbackResearchNote(research) : null;
    if (fallback) parts.push(fallback);
    else if (state.webNotes.length && intent !== "math") {
      parts.push(
        "Previously retrieved public pages remain in the Web sources panel for this session only. End & erase clears them.",
      );
    }
  }

  if (historical) {
    parts.push(formatHistoricalBlock(historical, state.facts.archival));
    knowledgeBits.push(
      ...historical.matched.map((r) => `${r.citation} ${r.title} ${r.sourceUrl}`),
      ...historical.standing.slice(0, 4).map((r) => `${r.citation} ${r.sourceUrl}`),
      historical.honesty,
    );
  }

  if (honesty) {
    parts.push(formatHonestyBlock(honesty));
    knowledgeBits.push(honesty.limitation, honesty.nolie, ...honesty.cites);
  }

  if (intent === "citation" || /citation|case law|held that|precedent/i.test(userText)) {
    parts.push(
      "Whitestone does not invent case citations. I will not fabricate an opinion name or a reporter cite. Ask the clerk, a law library, or counsel for controlling authority.",
    );
  }

  if (intent !== "historical" && j && (intent === "venue" || /residenc|how long|wait|separat|court|where to file|venue|clerk|community|property|protect|legal separation/i.test(userText))) {
    const q = userText.toLowerCase();
    if (/residenc|how long|wait|separat/.test(q) && state.matter === "divorce" && state.practiceArea !== "criminal") {
      const line = `${j.name} divorce timing (overview, verify): residency ${j.residencyDivorce}. Waiting / separation: ${j.waitingOrSeparation}.`;
      parts.push(line);
      knowledgeBits.push(line);
    }
    if ((intent === "support" || /child support|guideline|worksheet/.test(q)) && state.practiceArea !== "criminal") {
      const line = `${j.name} child support (overview): model ${j.childSupportModel.replace(/-/g, " ")}; duration ${j.childSupportEnds}; guidelines referenced as ${j.childSupportGuidelines}; agency ${j.childSupportAgency}. Any dollar figure is HEURISTIC / ILLUSTRATIVE unless it cites a public schedule with a source URL. Use the official worksheet.`;
      parts.push(line);
      knowledgeBits.push(line);
    }
    if (intent === "venue" || /court|where to file|venue|clerk/.test(q)) {
      const line = `Usual court: ${j.courtName}. Venue note: ${j.venueNote} Self-help: ${j.selfHelpUrl}`;
      parts.push(line);
      knowledgeBits.push(line);
    }
    if (/community|property|equitable/.test(q) && state.practiceArea === "divorce") {
      parts.push(
        `Property regime (overview): ${j.propertyRegime === "community" ? "community property" : "equitable distribution"}. This is not a valuation of your estate.`,
      );
    }
    if (/protect|restrain|injunction|pfa/.test(q) && state.practiceArea !== "criminal") {
      parts.push(`Local family-order name (overview): ${j.protectionOrderName}. Confirm the current petition title with the clerk.`);
    }
    if (/legal separation|separate maintenance/.test(q)) {
      parts.push(`${j.name} legal-separation note: ${j.legalSeparation}`);
    }
  }

  if (intent === "historical" || intent === "honesty") {
    /* Dated corpus / honesty block already appended. Do not dump today's checklist as if it were 1850 law. */
  } else if (intent === "forms" && topic) {
    parts.push(
      `For ${snap.filingName} in a ${MATTER_LABELS[topic.id]} matter, typical documents (verify locally — form numbers change): ${topic.documentChecklist.slice(0, 5).join("; ")}.`,
    );
    knowledgeBits.push(topic.documentChecklist.join(" "));
  } else if (intent === "process" && topic) {
    parts.push(`${topic.title} pathway (overview): ${topic.filingPathway.slice(0, 4).join(" ")}`);
    knowledgeBits.push(topic.summary);
  } else if (intent === "general" && topic && !math) {
    parts.push(`${topic.title} — one issue branch: ${topic.issueTree[0]?.label ?? topic.title}. ${topic.summary}`);
    knowledgeBits.push(topic.summary);
  }

  if (intent === "evidence" || intent === "reason") {
    parts.push(formatReasoning(reasoned, "full"));
  } else if (intent === "next") {
    parts.push(formatPlan(workingPlan(next)));
    if (reasoned.branches.length) {
      parts.push(reasoned.branches.map((b) => `${b.label}: ${b.path}`).join("\n"));
    }
    if (reasoned.irac[0]) parts.push(formatIrac(reasoned.irac.slice(0, 1)));
  } else if (intent === "process" || intent === "venue" || intent === "general") {
    if (reasoned.irac[0] && !math) parts.push(formatIrac(reasoned.irac.slice(0, 1)));
    if (reasoned.contradictions.length) {
      parts.push(`Please clarify: ${reasoned.contradictions.map((c) => c.text).join(" ")}`);
    }
  }

  if (intent !== "forms" && intent !== "stats" && intent !== "math" && intent !== "historical" && intent !== "honesty") {
    for (const hit of hits.slice(0, intent === "general" ? 2 : 3)) {
      parts.push(`${hit.title}: ${hit.body}`);
      knowledgeBits.push(hit.body);
    }
  }

  if (!hits.length && !j && !math) {
    parts.push(
      "Choose a jurisdiction and matter so I can retrieve the matching checklist. I only adapt from this session's answers and uploads.",
    );
  }

  for (const fed of FEDERAL_FRAMEWORK) {
    if (fed.id === "uccjea" && /home state|another state|moved|interstate custody/i.test(userText)) {
      parts.push(fed.body);
      knowledgeBits.push(fed.body);
    }
  }

  const follow = nextQuestion(next);
  if (follow && intent !== "math") {
    parts.push(`To keep this session structured: ${follow.prompt}${follow.why ? ` (${follow.why})` : ""}`);
  } else if (intent === "next" || intent === "general") {
    parts.push(
      "Open Filing structure for an on-screen caption and checklist when you are ready — still not a filing, and not exportable.",
    );
  }

  parts.push(RESPONSIBILITY_LINE);
  parts.push(lens());

  return finish(
    next,
    userText,
    intent,
    parts,
    research,
    stats.map((s) => s.id),
    factsLine,
    knowledgeBits,
    [...stats.map((s) => s.sourceUrl), ...(historical?.sourceUrls ?? []), ...(honesty?.evidence.map((e) => e.source).filter((s) => /^https:\/\//.test(s)) ?? [])],
    Boolean(math),
    reasoned.contradictions.length > 0,
  );
}

function personalizedLead(intent: AdvisorIntent, snap: ReturnType<typeof sessionSnapshot>, factsLine: string): string {
  if (intent === "next") {
    return `${factsLine} Here is a short working plan for ${snap.filingName}, not a script that replaces counsel.`;
  }
  if (intent === "venue") {
    return `${snap.filingName} asked about venue in ${snap.jurisdictionName ?? "an unchosen state"} for ${snap.matterLabel ?? snap.areaLabel}.`;
  }
  if (intent === "forms") {
    return `Packet question for ${snap.filingName} vs ${snap.otherName}. Form numbers change — prefer the clerk's current stack.`;
  }
  if (intent === "evidence") {
    return `Mapping uploads and notes for ${snap.filingName}. Keyword matches are not findings.`;
  }
  return factsLine;
}

function lens(): string {
  return "Lamb Lens: Service → Clarity → Peace. Verify with the court. End & erase when you are done.";
}

function finish(
  next: SessionState,
  userText: string,
  intent: AdvisorIntent,
  parts: string[],
  research: ResearchResult | null | undefined,
  statIds: string[],
  sessionFacts: string,
  knowledgeBits: string[],
  statUrls: string[] = [],
  mathLabeled = false,
  contradictsSession = false,
): AdviseResult {
  const primary = parts.filter(Boolean).join("\n\n");
  const grounding = coherenceCheck({
    primary,
    sessionFacts,
    userText,
    research,
    knowledgeBits,
    statIds,
    statUrls,
    mathLabeled,
    contradictsSession,
  });
  const reply = grounding.emitted;
  const sourceUrls = [
    ...(research?.sources.map((s) => s.url) ?? []),
    ...statUrls,
  ];
  const receipt = sessionReceipt(reply, sourceUrls, statIds);
  return {
    reply,
    state: next,
    intent,
    followUps: followUpPrompts(next, intent),
    grounding,
    receipt,
  };
}
