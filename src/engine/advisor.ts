import { FEDERAL_FRAMEWORK, getJurisdiction, retrieveGuidance, TOPIC_BY_ID } from "../knowledge";
import { LEGAL_DISCLAIMER } from "../knowledge/common";
import { fallbackResearchNote, formatWebNotes } from "../research/format";
import type { ResearchResult } from "../research/types";
import type { SessionState } from "../types";
import { MATTER_LABELS } from "../types";
import { nextQuestion } from "./dialogue";
import { learnFromSession, learnFromText } from "./learn";

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
  if (j) {
    bits.push(
      `Jurisdiction in this session: ${j.name}. Usual court: ${j.courtName}. Coverage level: ${j.coverage} (not a complete annotated code).`,
    );
  }
  if (topic) {
    bits.push(`${topic.title}: ${topic.summary}`);
  }
  if (state.learned.safetyFlag) {
    bits.push(
      "Safety language appeared in this session. If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233.",
    );
  }
  const q = nextQuestion(state);
  if (q) bits.push(`Next structured question: ${q.prompt}`);
  return bits.join("\n\n");
}

export function advise(
  state: SessionState,
  userText: string,
  research?: ResearchResult | null,
): { reply: string; state: SessionState } {
  const learned = learnFromText(learnFromSession(state), userText);
  const next: SessionState = { ...state, learned };
  const j = getJurisdiction(state.jurisdiction);
  const topic = state.matter ? TOPIC_BY_ID[state.matter] : undefined;
  const hits = retrieveGuidance({
    query: userText,
    jurisdiction: state.jurisdiction,
    matter: state.matter,
    extra: [...learned.keywords, ...Object.values(state.answers), ...state.uploads.map((u) => u.note)],
  });

  const parts: string[] = [];

  if (learned.safetyFlag) {
    parts.push(
      "Safety first. If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233. A protection-order clerk window is usually faster than a long divorce packet.",
    );
  }

  if (research?.sources.length) {
    parts.push(formatWebNotes(research));
  } else {
    const fallback = research ? fallbackResearchNote(research) : null;
    if (fallback) parts.push(fallback);
    else if (state.webNotes.length) {
      parts.push(
        "Previously retrieved public pages remain in the Web sources panel for this session only. End & erase clears them.",
      );
    }
  }

  if (/citation|case law|held that|precedent/i.test(userText)) {
    parts.push(
      "Whitestone does not invent case citations. I will not fabricate an opinion name or a reporter cite. Ask the clerk, a law library, or counsel for controlling authority.",
    );
  }

  if (j) {
    const q = userText.toLowerCase();
    if (/residenc|how long|wait|separat/.test(q) && state.matter === "divorce") {
      parts.push(
        `${j.name} divorce timing (overview, verify): residency ${j.residencyDivorce}. Waiting / separation: ${j.waitingOrSeparation}.`,
      );
    }
    if (/child support|guideline|worksheet/.test(q)) {
      parts.push(
        `${j.name} child support (overview): model ${j.childSupportModel.replace(/-/g, " ")}; duration ${j.childSupportEnds}; guidelines referenced as ${j.childSupportGuidelines}; agency ${j.childSupportAgency}. Use the official worksheet — I do not output a dollar figure.`,
      );
    }
    if (/court|where to file|venue|clerk/.test(q)) {
      parts.push(`Usual court: ${j.courtName}. Venue note: ${j.venueNote} Self-help: ${j.selfHelpUrl}`);
    }
    if (/community|property|equitable/.test(q)) {
      parts.push(
        `Property regime (overview): ${j.propertyRegime === "community" ? "community property" : "equitable distribution"}. This is not a valuation of your estate.`,
      );
    }
    if (/protect|restrain|injunction|pfa/.test(q)) {
      parts.push(`Local family-order name (overview): ${j.protectionOrderName}. Confirm the current petition title with the clerk.`);
    }
    if (/legal separation|separate maintenance/.test(q)) {
      parts.push(`${j.name} legal-separation note: ${j.legalSeparation}`);
    }
  }

  if (topic) {
    parts.push(`Issue tree for ${MATTER_LABELS[topic.id]}: ${topic.issueTree.map((n) => n.label).join(" · ")}`);
    const docs = topic.documentChecklist.slice(0, 4).join("; ");
    parts.push(`Typical documents (verify locally): ${docs}.`);
  }

  for (const hit of hits.slice(0, 3)) {
    parts.push(`${hit.title}: ${hit.body}`);
  }

  if (!hits.length && !j) {
    parts.push(
      "Choose a jurisdiction and matter so I can retrieve the matching checklist. I only adapt from this session's answers and uploads.",
    );
  }

  const follow = nextQuestion(next);
  if (follow) {
    parts.push(`To keep this session structured: ${follow.prompt}${follow.why ? ` (${follow.why})` : ""}`);
  } else {
    parts.push(
      "The structured questions for this matter are complete. Open Filing structure for an on-screen caption and checklist — still not a filing, and not exportable.",
    );
  }

  parts.push(
    "Lamb Lens: Service → Clarity → Peace. Verify with the court. End & erase when you are done.",
  );

  for (const fed of FEDERAL_FRAMEWORK) {
    if (fed.id === "uccjea" && /home state|another state|moved|interstate custody/i.test(userText)) {
      parts.push(fed.body);
    }
  }

  return { reply: parts.join("\n\n"), state: next };
}
