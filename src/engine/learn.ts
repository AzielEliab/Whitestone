import type { LearnedSession, SessionState } from "../types";

const SAFETY = /\b(violen|abuse|stalk|threat|hit|weapon|gun|strangl|afraid|911|restraining|protection order)\b/i;
const CONTESTED = /\b(contest|disagree|won't agree|will not agree|fight|trial|object)\b/i;
const AGREED = /\b(agreed|uncontested|we agree|settled|both agree)\b/i;

export function learnFromText(learned: LearnedSession, text: string): LearnedSession {
  const keywords = new Set(learned.keywords);
  for (const t of text.toLowerCase().match(/[a-z0-9-]{4,}/g) ?? []) {
    if (!STOP.has(t)) keywords.add(t);
  }
  const notes = [...learned.notes];
  let safetyFlag = learned.safetyFlag || SAFETY.test(text);
  let contested = learned.contested;
  if (CONTESTED.test(text)) contested = true;
  if (AGREED.test(text) && contested !== true) contested = false;
  if (safetyFlag && !notes.includes("safety")) notes.push("safety");
  if (contested === true && !notes.includes("contested")) notes.push("contested");
  if (contested === false && !notes.includes("agreed")) notes.push("agreed");

  const priorities = [...learned.priorities];
  if (safetyFlag && !priorities.includes("safety-first")) priorities.unshift("safety-first");

  return {
    keywords: [...keywords].slice(-80),
    priorities: [...new Set(priorities)].slice(0, 12),
    safetyFlag,
    contested,
    notes: notes.slice(-20),
  };
}

export function learnFromSession(state: SessionState): LearnedSession {
  let learned = state.learned;
  for (const m of state.messages) {
    if (m.role === "user") learned = learnFromText(learned, m.text);
  }
  for (const v of Object.values(state.answers)) learned = learnFromText(learned, v);
  for (const v of Object.values(state.facts)) learned = learnFromText(learned, v);
  for (const u of state.uploads) {
    learned = learnFromText(learned, `${u.name} ${u.note} ${u.text.slice(0, 2000)}`);
  }
  if (state.children.length) {
    learned = {
      ...learned,
      priorities: [...new Set([...learned.priorities, "children"])],
    };
  }
  return learned;
}

const STOP = new Set([
  "that",
  "this",
  "with",
  "from",
  "have",
  "been",
  "they",
  "them",
  "your",
  "about",
  "would",
  "could",
  "should",
  "there",
  "their",
  "what",
  "when",
  "where",
  "which",
  "while",
  "will",
  "just",
  "into",
  "then",
  "than",
  "also",
  "only",
  "some",
  "more",
]);
