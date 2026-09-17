import { TOPIC_BY_ID } from "../knowledge";
import type { GuidedQuestion, MatterType, SessionState } from "../types";

export function nextQuestion(state: SessionState): GuidedQuestion | null {
  if (!state.matter) return null;
  const topic = TOPIC_BY_ID[state.matter];
  const unanswered = topic.questions.find((q) => !state.answers[q.id]);
  if (unanswered) {
    return {
      id: unanswered.id,
      prompt: unanswered.prompt,
      why: unanswered.why,
      options: unanswered.options,
      freeText: !unanswered.options,
    };
  }

  if (state.learned.safetyFlag && !state.answers["safety-follow"]) {
    return {
      id: "safety-follow",
      prompt:
        "You mentioned safety concerns. Do you want the next steps to prioritize a protection-order packet before other filings?",
      why: "Safety filings and confidential addresses should come first when danger is present.",
      options: ["Yes — protection order first", "Keep the current matter first", "I am safe enough to continue"],
    };
  }

  if (state.uploads.length === 0 && !state.answers["skip-evidence"]) {
    return {
      id: "skip-evidence",
      prompt: "You have not uploaded evidence yet. Do you want to add files, or continue with a filing outline from facts alone?",
      why: "Uploads stay in this session only. They are never exported.",
      options: ["Continue without files", "I will add files next"],
    };
  }

  if (!state.answers["clerk-ready"]) {
    return {
      id: "clerk-ready",
      prompt:
        "Before we show a caption draft: you will verify every form, fee, and service rule with the clerk. Ready to see the in-app filing structure?",
      why: "Whitestone drafts structure on screen only. It does not file or export.",
      options: ["Show the filing structure", "Ask another question first"],
    };
  }

  return null;
}

export function starterPrompts(matter: MatterType | null): string[] {
  if (!matter) {
    return [
      "What should I gather before I file?",
      "How do I know which court is correct?",
      "What does 'best interests' mean in practice?",
    ];
  }
  const map: Record<MatterType, string[]> = {
    divorce: [
      "What is the usual first filing packet here?",
      "Do I have to be separated first?",
      "What temporary orders can I ask for?",
    ],
    "legal-separation": [
      "Does this state actually offer legal separation?",
      "Can I later convert this to a divorce?",
    ],
    custody: [
      "How do I know if this is the child's home state?",
      "What goes in a UCCJEA affidavit?",
      "When are temporary custody orders used?",
    ],
    "parenting-time": [
      "How specific should a holiday schedule be?",
      "When do courts use supervised time?",
    ],
    "child-support": [
      "Which guideline model does this state use?",
      "What income proof should I bring?",
      "Can another state change my order?",
    ],
    "spousal-support": [
      "Is there a formula here, or only factors?",
      "Can I get support while the case is pending?",
    ],
    paternity: [
      "Should I sign an acknowledgment at the hospital?",
      "How do I ask for a genetic test?",
    ],
    guardianship: [
      "Which court takes a minor's guardianship?",
      "Do I need both parents' consent?",
    ],
    "protection-order": [
      "What should the incident affidavit include?",
      "What happens after an emergency order?",
    ],
    adoption: [
      "What is different about a stepparent adoption?",
      "When does ICPC apply?",
    ],
    "name-change": [
      "Can I restore a former name in the divorce?",
      "What notice is needed to change a child's name?",
    ],
  };
  return map[matter];
}
