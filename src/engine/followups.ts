import { nextQuestion, starterPrompts } from "./dialogue";
import type { AdvisorIntent } from "./intent";
import type { SessionState } from "../types";

export function followUpPrompts(state: SessionState, intent: AdvisorIntent): string[] {
  const chips: string[] = [];
  const q = nextQuestion(state);
  if (q) chips.push(q.prompt);

  if (state.historicalMode || intent === "historical") {
    chips.push("Was the 18th Amendment in force as of 1925-06?");
    chips.push("What was standing federal law as of 1866-04?");
  }

  if (intent === "math") {
    chips.push("30 business days from March 1 2026");
    if (state.practiceArea === "criminal") chips.push("what's 10% of $5000 bail");
    if (state.practiceArea !== "criminal") chips.push("What do the numbers say about support or filings?");
  } else if (intent === "stats") {
    chips.push("What should I do next with these numbers in mind?");
    chips.push("How do I know which court is correct?");
  } else if (intent === "venue" || intent === "forms") {
    chips.push("What is the usual first filing packet here?");
    chips.push("What should I gather before I file?");
  } else if (intent === "evidence") {
    chips.push("What should I do next?");
    chips.push("Walk me through the issues using my facts");
  } else if (intent === "next" || intent === "process") {
    chips.push("What do the numbers say?");
    chips.push("Walk me through the issues using my facts");
  } else {
    chips.push("What should I do next?");
    chips.push("What do the numbers say?");
    if (state.practiceArea === "criminal") chips.push("What usually happens at arraignment?");
  }

  for (const p of starterPrompts(state)) {
    if (!chips.includes(p)) chips.push(p);
  }

  const seen = new Set<string>();
  return chips.filter((c) => {
    const key = c.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}
