import { getJurisdiction, TOPIC_BY_ID } from "../knowledge";
import type { SessionState } from "../types";
import { sessionSnapshot } from "./facts";

export interface PlanStep {
  order: number;
  text: string;
  prerequisite?: string;
}

export function workingPlan(state: SessionState): PlanStep[] {
  const snap = sessionSnapshot(state);
  const topic = state.matter ? TOPIC_BY_ID[state.matter] : undefined;
  const j = getJurisdiction(state.jurisdiction);
  const steps: PlanStep[] = [];
  const push = (text: string, prerequisite?: string) => {
    steps.push({ order: steps.length + 1, text, prerequisite });
  };

  if (state.learned.safetyFlag || state.answers.safety === "Yes — safety first" || state.answers["danger-now"] === "Yes — emergency") {
    push("If anyone is in danger now, call 911. Hotline 1-800-799-7233. Ask the clerk for today's protection-order window before a long packet in another matter.");
  }

  if (state.practiceArea === "criminal") {
    if (state.answers["in-custody"] === "In custody") {
      push("Ask for a lawyer or the public defender at the first appearance. Do not discuss the facts of the charge on this screen.", "in custody");
    } else if (state.answers["lawyer-ba"] === "Not yet" || !state.answers["lawyer-ba"]) {
      push(`${snap.filingName}: contact the public defender or hired counsel before talking about the facts.`, "counsel not yet set");
    }
    if (state.answers["date-ba"] === "Missed a date") {
      push("A missed criminal date can produce a warrant. Contact counsel or the clerk promptly. Do not hide.", "missed date");
    } else {
      push("Calendar the next date. Appear. If you cannot, call the lawyer or clerk before the date.");
    }
    if (state.answers.conditions === "Yes") {
      push("Read every release condition the same day. Breaking conditions can mean re-arrest.");
    }
    push("Give charging papers and any bail order to the lawyer. Do not destroy phones, texts, or videos.");
  } else if (state.practiceArea === "civil") {
    if (state.matter === "debt-collection") {
      push("Read the summons deadline first. A missed answer can become a default. This is not a suggestion to hide assets.");
    }
    if (state.matter === "landlord-tenant") {
      push("If you have a summons, calendar the hearing. Illegal lockouts are different from a filed eviction — ask legal aid.");
    }
    push(`Confirm the correct ${j?.name ?? "local"} docket and dollar limit with the clerk${snap.matterLabel ? ` for ${snap.matterLabel}` : ""}.`);
    if (snap.unanswered[0]) push(`Answer the open structured question: ${snap.unanswered[0].prompt}`);
    if (!state.uploads.length) push("Optional: upload the contract, lease, invoices, or summons so the session can map exhibits to issues.");
    push(`Name ${snap.otherName} the way the clerk's packet requires (legal entity, not only a trade name) before you file or answer.`);
  } else {
    if (state.answers.kids === "Yes" || state.children.length) {
      push("Map the child's last six months before choosing venue. UCCJEA home-state facts belong on the official affidavit.");
    }
    if (j && state.matter === "divorce") {
      push(`${j.name} divorce timing (overview, verify): residency ${j.residencyDivorce}. Waiting / separation: ${j.waitingOrSeparation}.`);
    }
    push(`Ask the ${j?.name ?? "local"} clerk for the current ${snap.matterLabel ?? "family"} packet, fee, and service method.`);
    if (snap.unanswered[0]) push(`Still unanswered: ${snap.unanswered[0].prompt}`);
    if (state.matter === "child-support") {
      push("Use the official guideline worksheet or agency calculator. Any dollar on this screen is illustrative only.");
    }
  }

  if (topic) {
    const nextPath = topic.filingPathway[0];
    if (nextPath) push(nextPath, "local pathway");
  }

  push("Nothing on this screen is a filing or an export. Recreate papers on the official form. End & erase when finished.");
  return steps.slice(0, 7);
}

export function formatPlan(steps: PlanStep[]): string {
  return [
    "Working plan for this session (prioritized, still not legal advice):",
    ...steps.map((s) => `${s.order}. ${s.text}${s.prerequisite ? ` [${s.prerequisite}]` : ""}`),
  ].join("\n");
}
