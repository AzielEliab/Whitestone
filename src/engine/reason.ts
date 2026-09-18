import { getJurisdiction, TOPIC_BY_ID } from "../knowledge";
import type { SessionState } from "../types";
import { sessionSnapshot, snapshotLine } from "./facts";
import type { AdvisorIntent } from "./intent";
import { formatPlan, workingPlan, type PlanStep } from "./plan";

export interface IracBlock {
  issue: string;
  rule: string;
  application: string;
  next: string;
}

export interface Contradiction {
  text: string;
}

export interface ArgumentNode {
  claim: string;
  support: string;
  gap: string;
}

export interface BranchNote {
  label: string;
  path: string;
}

export interface ReasoningPacket {
  snapshot: string;
  irac: IracBlock[];
  contradictions: Contradiction[];
  missing: string[];
  argumentMap: ArgumentNode[];
  plan: PlanStep[];
  branches: BranchNote[];
}

export function detectContradictions(state: SessionState): Contradiction[] {
  const out: Contradiction[] = [];
  const agree = (state.answers.agree || "").toLowerCase();
  if (state.learned.contested === true && /agreed|uncontested/.test(agree)) {
    out.push({
      text: `You marked the case as ${state.answers.agree}, but later language sounded contested. Clarify whether ${sessionSnapshot(state).otherName} is actually agreeing.`,
    });
  }
  if (state.learned.contested === false && /contest/.test(agree)) {
    out.push({
      text: "You have both 'agreed' language and a contested answer. Say which issues are still in fight.",
    });
  }
  if (state.answers["date-ba"] === "Missed a date" && state.answers["in-custody"] === "Not yet arrested") {
    out.push({
      text: "You said a court date was missed and also that there has not been an arrest. If a warrant may exist, talk to counsel — do not hide.",
    });
  }
  if (state.answers.kids === "Yes" && state.children.length === 0 && state.practiceArea === "divorce") {
    out.push({
      text: "You said there are minor children, but none are named on the People & facts screen. Add initials/ages or correct the answer.",
    });
  }
  if (state.answers.kids === "No" && state.children.length > 0) {
    out.push({
      text: "You answered that there are no minor children, but children are listed in this session. Clarify before any caption draft.",
    });
  }
  if (state.answers["danger-now"] === "Yes — emergency" && state.answers.safety === "No") {
    out.push({
      text: "Emergency danger and 'no safety concerns' are both on file. Treat safety as first if anyone is in danger.",
    });
  }
  return out;
}

export function missingFacts(state: SessionState): string[] {
  const snap = sessionSnapshot(state);
  const missing: string[] = [];
  if (!state.jurisdiction) missing.push("Pick the state or D.C. of the court.");
  if (!state.matter) missing.push("Choose a matter type so the checklist can branch.");
  if (!state.parties[0]?.name.trim()) missing.push(`Add a name for ${snap.filingRole.toLowerCase()} so replies can speak to this session.`);
  if (snap.unanswered[0]) missing.push(`Structured question still open: ${snap.unanswered[0].prompt}`);
  if (!state.uploads.length && !state.answers["skip-evidence"]) {
    missing.push("No uploads yet. You may continue from facts alone, or add files that stay in this session only.");
  }
  if (state.practiceArea === "criminal" && !state.answers["lawyer-ba"]) {
    missing.push("Say whether a lawyer or public-defender application is already pending.");
  }
  return missing.slice(0, 5);
}

export function argumentMap(state: SessionState): ArgumentNode[] {
  const snap = sessionSnapshot(state);
  const nodes: ArgumentNode[] = [];
  if (state.mappings.length) {
    for (const map of state.mappings.slice(0, 5)) {
      nodes.push({
        claim: map.issueLabel,
        support: `${map.fileName}${map.snippet ? ` — “${map.snippet.slice(0, 120)}”` : ""} (${map.allegation})`,
        gap: "Keep originals. This map is a keyword assist, not a finding.",
      });
    }
  }
  for (const note of snap.uploadNotes.filter((u) => u.note).slice(0, 3)) {
    if (nodes.some((n) => n.support.includes(note.name))) continue;
    nodes.push({
      claim: `Your note on ${note.name}`,
      support: note.note,
      gap: "Tie the note to a dated fact the clerk's form actually asks for.",
    });
  }
  if (snap.goal) {
    nodes.push({
      claim: "Stated ask of the court",
      support: snap.goal,
      gap: "Plead only facts you can support. Whitestone will not invent allegations.",
    });
  }
  if (!nodes.length) {
    nodes.push({
      claim: "No exhibit-to-issue map yet",
      support: "Facts and uploads in this session are the only inputs.",
      gap: "Add a file note or answer a structured question so the map can fill in.",
    });
  }
  return nodes.slice(0, 6);
}

export function decisionBranches(state: SessionState): BranchNote[] {
  const branches: BranchNote[] = [];
  const snap = sessionSnapshot(state);
  if (state.practiceArea === "criminal") {
    const custody = state.answers["in-custody"];
    if (custody === "In custody") {
      branches.push({
        label: "In custody",
        path: `${snap.filingName} is in custody on this session's answers. First-appearance counsel and release conditions come before any long checklist.`,
      });
    } else if (custody === "Released") {
      branches.push({
        label: "Released",
        path: "Out of custody: calendar the next date, keep every condition, and get papers to counsel. Do not discuss facts with anyone but the lawyer.",
      });
    }
    if (state.answers["date-ba"] === "Missed a date") {
      branches.push({
        label: "Missed date",
        path: "Missed-date branch: contact counsel or the clerk. Whitestone will not help anyone evade a warrant.",
      });
    }
  } else if (state.practiceArea === "civil") {
    if (state.matter === "debt-collection") {
      branches.push({
        label: "Served collection case",
        path: "Answer-deadline branch first. Defenses and exemptions come after the case is not in default.",
      });
    }
    if (state.matter === "landlord-tenant") {
      branches.push({
        label: "Housing",
        path: "If a summons exists, the hearing date controls. If there was a lockout without a court order, that is a different emergency path — ask legal aid.",
      });
    }
  } else {
    const emergency = state.answers["danger-now"] === "Yes — emergency" || state.answers.safety === "Yes — safety first";
    if (emergency) {
      branches.push({
        label: "Emergency / safety",
        path: "Safety packet before a long divorce outline. Confidential address if the court offers it.",
      });
    }
    if (state.answers.kids === "Yes" || state.children.length) {
      branches.push({
        label: "Children",
        path: `Children are in this session${snap.childrenLine ? ` (${snap.childrenLine})` : ""}. Parenting, support, and UCCJEA facts attach to the family case.`,
      });
    } else if (state.answers.kids === "No") {
      branches.push({
        label: "No minor children",
        path: "No minor-child branch: the packet is shorter (property, support between spouses, name restoration) — still verify with the clerk.",
      });
    }
  }
  return branches;
}

export function buildIrac(state: SessionState, intent: AdvisorIntent): IracBlock[] {
  const snap = sessionSnapshot(state);
  const j = getJurisdiction(state.jurisdiction);
  const topic = state.matter ? TOPIC_BY_ID[state.matter] : undefined;
  const blocks: IracBlock[] = [];

  const applyNames = (text: string) =>
    text
      .replace(/YOUR_FILING/g, snap.filingName)
      .replace(/YOUR_OTHER/g, snap.otherName)
      .replace(/YOUR_PLACE/g, snap.jurisdictionName ?? "the jurisdiction you have not chosen yet");

  if (state.learned.safetyFlag) {
    blocks.push({
      issue: "Is immediate safety ahead of every other filing?",
      rule: "Protection-order windows and 911 are for danger. Whitestone is not a shelter and not counsel.",
      application: applyNames(
        `Safety language is on in this session for YOUR_FILING. If danger is current, a protection-order clerk window usually beats a long ${snap.matterLabel ?? "civil or family"} packet.`,
      ),
      next: "Call 911 if needed. Hotline 1-800-799-7233. Ask the clerk for today's packet.",
    });
  }

  if (intent === "venue" || intent === "general" || intent === "reason") {
    blocks.push({
      issue: `Which court can hear this ${snap.matterLabel ?? snap.areaLabel.toLowerCase()} matter?`,
      rule: j
        ? `${j.name} overview: usual court name in the table is ${j.courtName}. ${j.venueNote} Confirm the clerk — this is not a venue opinion.`
        : "Venue is local. Choose a jurisdiction so Whitestone can name the table's court and self-help URL.",
      application: applyNames(
        `YOUR_FILING / YOUR_OTHER in YOUR_PLACE. ${
          snap.note ? `Case note: ${snap.note}.` : "No venue facts beyond the state pick yet."
        }`,
      ),
      next: j ? `Open the official starting point: ${j.selfHelpUrl}` : "Pick a state or D.C. on the Jurisdiction screen.",
    });
  }

  if (topic && (intent === "process" || intent === "forms" || intent === "reason" || intent === "general")) {
    const issue = topic.issueTree[0];
    blocks.push({
      issue: issue?.label ?? topic.title,
      rule: `${topic.title} (bundled overview): ${topic.summary}`,
      application: applyNames(
        `Applied to YOUR_FILING vs YOUR_OTHER${snap.goal ? ` — goal: ${snap.goal}` : ""}${
          snap.answered[0] ? ` — you answered “${snap.answered[0].value}” on ${snap.answered[0].prompt}` : ""
        }.`,
      ),
      next: topic.filingPathway[0] ?? "Ask the clerk for the current packet.",
    });
  }

  if (intent === "evidence" || state.mappings.length) {
    const first = state.mappings[0];
    blocks.push({
      issue: "What do the session uploads tend to support?",
      rule: "Exhibits should map to a dated fact the official form asks for. Keyword matches are not findings.",
      application: first
        ? `${first.fileName} was mapped to ${first.issueLabel}: ${first.allegation}`
        : "No automatic map yet. Add a short note on each file.",
      next: "Keep originals. Nothing is exported from Whitestone.",
    });
  }

  return blocks.slice(0, 3);
}

export function reasonAbout(state: SessionState, intent: AdvisorIntent): ReasoningPacket {
  return {
    snapshot: snapshotLine(state),
    irac: buildIrac(state, intent),
    contradictions: detectContradictions(state),
    missing: missingFacts(state),
    argumentMap: argumentMap(state),
    plan: workingPlan(state),
    branches: decisionBranches(state),
  };
}

export function formatIrac(blocks: IracBlock[]): string {
  return blocks
    .map(
      (b, i) =>
        `${blocks.length > 1 ? `Outline ${i + 1}. ` : ""}Issue: ${b.issue}\nRule / source: ${b.rule}\nApplication to YOUR facts: ${b.application}\nNext step: ${b.next}`,
    )
    .join("\n\n");
}

export function formatReasoning(packet: ReasoningPacket, style: "full" | "short"): string {
  const parts: string[] = [packet.snapshot];
  if (packet.contradictions.length) {
    parts.push(
      `Please clarify: ${packet.contradictions.map((c) => c.text).join(" ")} R/D/P inconsistency hint (AZ-CLCE-inspired, not that product): answers in this session do not line up.`,
    );
  }
  if (packet.branches.length && style === "full") {
    parts.push(packet.branches.map((b) => `${b.label}: ${b.path}`).join("\n"));
  }
  if (packet.irac.length) parts.push(formatIrac(style === "short" ? packet.irac.slice(0, 1) : packet.irac));
  if (packet.missing.length && style === "full") {
    parts.push(`Missing or still open: ${packet.missing.join(" ")}`);
  }
  if (style === "full") {
    parts.push(
      [
        "Argument map (session only):",
        ...packet.argumentMap.map((n) => `• ${n.claim} — support: ${n.support} — gap: ${n.gap}`),
      ].join("\n"),
    );
    parts.push(formatPlan(packet.plan));
  }
  return parts.join("\n\n");
}
