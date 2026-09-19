import { getJurisdiction, TOPIC_BY_ID } from "../knowledge";
import { PARTY_LABELS, PRACTICE_LABELS } from "../practice/areas";
import type { SessionState } from "../types";
import { MATTER_LABELS } from "../types";

export interface SessionSnapshot {
  areaLabel: string;
  matterLabel: string | null;
  jurisdictionName: string | null;
  courtName: string | null;
  filingName: string;
  otherName: string;
  filingRole: string;
  otherRole: string;
  childrenLine: string | null;
  goal: string | null;
  note: string | null;
  answered: { id: string; prompt: string; value: string }[];
  unanswered: { id: string; prompt: string }[];
  uploadNotes: { name: string; note: string }[];
  keywords: string[];
}

export function sessionSnapshot(state: SessionState): SessionSnapshot {
  const area = state.practiceArea ?? "divorce";
  const labels = PARTY_LABELS[area];
  const j = getJurisdiction(state.jurisdiction);
  const topic = state.matter ? TOPIC_BY_ID[state.matter] : undefined;
  const filing = state.parties[0]?.name.trim() || `the ${labels.filingRole.toLowerCase()}`;
  const other = state.parties[1]?.name.trim() || `the ${labels.otherRole.toLowerCase()}`;
  const answered =
    topic?.questions
      .filter((q) => state.answers[q.id])
      .map((q) => ({ id: q.id, prompt: q.prompt, value: state.answers[q.id] })) ?? [];
  const unanswered =
    topic?.questions
      .filter((q) => !state.answers[q.id])
      .map((q) => ({ id: q.id, prompt: q.prompt })) ?? [];
  return {
    areaLabel: PRACTICE_LABELS[area],
    matterLabel: state.matter ? MATTER_LABELS[state.matter] : null,
    jurisdictionName: j?.name ?? null,
    courtName: j?.courtName ?? null,
    filingName: filing,
    otherName: other,
    filingRole: labels.filingRole,
    otherRole: labels.otherRole,
    childrenLine: state.children.length
      ? state.children.map((c) => `${c.name || "child"} (${c.age || "age n/a"})`).join("; ")
      : null,
    goal: state.facts.goals?.trim() || null,
    note: state.facts.relationship?.trim() || null,
    answered,
    unanswered,
    uploadNotes: state.uploads
      .filter((u) => u.note.trim() || u.name)
      .map((u) => ({ name: u.name, note: u.note.trim() })),
    keywords: state.learned.keywords.slice(-12),
  };
}

export function snapshotLine(state: SessionState): string {
  const s = sessionSnapshot(state);
  const bits = [
    `This session is ${s.areaLabel}${s.matterLabel ? ` / ${s.matterLabel}` : ""}${
      s.jurisdictionName ? ` in ${s.jurisdictionName}` : ""
    }.`,
    `${s.filingRole}: ${s.filingName}. ${s.otherRole}: ${s.otherName}.`,
  ];
  if (s.childrenLine) bits.push(`Children noted: ${s.childrenLine}.`);
  if (s.note) bits.push(`Case note: ${s.note}.`);
  if (s.goal) bits.push(`Stated goal: ${s.goal}.`);
  if (state.historicalMode || state.asOfYear) {
    const asOf =
      state.asOfYear && state.asOfMonth
        ? `${state.asOfYear}-${String(state.asOfMonth).padStart(2, "0")}`
        : "year/month not set";
    bits.push(`Historical as-of mode is on (${asOf}). Seeded federal timeline only — not a complete U.S. law book.`);
  }
  if (state.facts.archival?.trim()) {
    bits.push(`Archival case/ruling facts: ${state.facts.archival.trim().slice(0, 240)}.`);
  }
  if (state.facts.stated_outcome?.trim()) {
    bits.push(`Stated outcome/report: ${state.facts.stated_outcome.trim().slice(0, 200)}.`);
  }
  if (s.answered.length) {
    bits.push(
      `Answered facts: ${s.answered
        .slice(0, 4)
        .map((a) => `${a.prompt.replace(/\?$/, "")} → ${a.value}`)
        .join("; ")}.`,
    );
  }
  return bits.join(" ");
}

export function canSkipToAdvisor(state: SessionState): boolean {
  const named = state.parties.some((p) => p.name.trim());
  const facts = Boolean(
    state.facts.goals?.trim() ||
      state.facts.relationship?.trim() ||
      state.facts.archival?.trim() ||
      state.facts.stated_outcome?.trim(),
  );
  return Boolean(state.jurisdiction && state.matter && (named || facts));
}

export function whatsNextLine(state: SessionState): string {
  switch (state.step) {
    case "welcome":
      return "Pick Criminal, Civil, or Divorce. Optional: turn on historical as-of evaluation. Notices stay under Important notices.";
    case "jurisdiction":
      return "Choose the state or D.C. of the court you expect to use.";
    case "matter":
      return "Choose the specific matter type for this practice area.";
    case "facts":
      if (state.historicalMode && (state.asOfYear == null || state.asOfMonth == null)) {
        return "Set the as-of year and month, then add archival case or ruling facts to compare against the seeded corpus.";
      }
      return canSkipToAdvisor(state)
        ? "Add names and what you want the court to do — or skip to the advisor."
        : "Name the parties and a short goal so the advisor can speak to this session.";
    case "evidence":
      return state.historicalMode
        ? "Upload case filings, evidence, historical reports, or news clippings (in only). Add a document date when you have one."
        : "Uploads are optional and never exported. Continue when ready.";
    case "advise":
      return state.historicalMode
        ? "Ask a question, tap a follow-up, or open Math / Statistics / Historical as-of / Honesty eval / Case Mode. Composer stays usable on a phone keyboard."
        : "Ask a question, tap a follow-up, or open Math / Statistics. Composer stays usable on a phone keyboard.";
    case "filing":
      return "Review the on-screen structure only. Recreate papers on the clerk's form. Nothing is exported.";
    default:
      return "Continue the session, then End & erase.";
  }
}
