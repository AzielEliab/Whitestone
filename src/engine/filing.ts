import { getJurisdiction, TOPIC_BY_ID } from "../knowledge";
import type { MatterType, SessionState } from "../types";
import { MATTER_LABELS } from "../types";

export interface FilingOutline {
  courtLine: string;
  caption: string;
  partiesBlock: string;
  caseTitle: string;
  pathway: string[];
  documents: string[];
  allegations: string[];
  nextSteps: string[];
  verify: string[];
  disclaimer: string;
}

export function buildFilingOutline(state: SessionState): FilingOutline {
  const j = getJurisdiction(state.jurisdiction);
  const matter = state.matter;
  const topic = matter ? TOPIC_BY_ID[matter] : undefined;
  const petitioner = state.parties.find((p) => p.role === "petitioner");
  const respondent = state.parties.find((p) => p.role === "respondent");
  const pName = petitioner?.name.trim() || "[Petitioner full legal name]";
  const rName = respondent?.name.trim() || "[Respondent full legal name]";
  const court = j?.courtName ?? "[Court name — confirm with the clerk]";
  const place = !j
    ? "[State / District]"
    : j.code === "DC"
      ? "DISTRICT OF COLUMBIA"
      : `STATE OF ${j.name.toUpperCase()}`;

  const caseTitle = titleFor(matter, pName, rName);
  const caption = [
    `IN THE ${court.toUpperCase()}`,
    `FOR THE ${place.toUpperCase()}`,
    ``,
    `${pName},`,
    `    Petitioner,`,
    ``,
    `v.`,
    ``,
    `${rName},`,
    `    Respondent.`,
    ``,
    caseTitle,
    `Case No. ______________`,
  ].join("\n");

  const allegations: string[] = [];
  if (j && matter === "divorce") {
    allegations.push(
      `Residency (overview): ${j.residencyDivorce}. Confirm the current statute and county rule before pleading it.`,
    );
  }
  if (state.children.length) {
    allegations.push(
      `Minor children named in this session: ${state.children.map((c) => `${c.name || "child"} (${c.age || "age n/a"})`).join("; ")}. Include a UCCJEA address history on the official form.`,
    );
  }
  if (state.learned.safetyFlag) {
    allegations.push(
      "Safety concerns were flagged in this session. Consider whether a protection-order petition should be filed first or alongside, and whether a confidential-address form is needed.",
    );
  }
  for (const map of state.mappings.slice(0, 8)) {
    allegations.push(`${map.issueLabel}: ${map.allegation} (from ${map.fileName})`);
  }
  if (!allegations.length) {
    allegations.push(
      "Add facts and uploads so Whitestone can map evidence to issues. Do not invent allegations that are not in your papers.",
    );
  }

  const verify = [
    "This caption is a teaching draft. It is not filed and not exportable.",
    "Verify court name, division, county/parish, and local caption format with the clerk.",
    "Verify current forms, fees, e-filing, and service rules — they change.",
    j ? `Official starting point: ${j.selfHelpUrl}` : "Look up the state judiciary self-help site.",
    "Whitestone is not a lawyer and does not appear with you.",
  ];

  return {
    courtLine: `${court} — ${place}`,
    caption,
    partiesBlock: `Petitioner: ${pName}\nRespondent: ${rName}`,
    caseTitle,
    pathway: topic?.filingPathway ?? ["Select a matter type to see a filing pathway."],
    documents: topic?.documentChecklist ?? [],
    allegations,
    nextSteps: nextSteps(state, j?.selfHelpUrl),
    verify,
    disclaimer:
      "Educational filing structure only. Not legal advice. Not a substitute for the clerk's packet or a licensed attorney. No download, print, or export.",
  };
}

function titleFor(matter: MatterType | null, p: string, r: string): string {
  const vs = `${p} / ${r}`;
  switch (matter) {
    case "divorce":
      return `[PROPOSED TITLE] Petition for Divorce / Dissolution — ${vs}`;
    case "legal-separation":
      return `[PROPOSED TITLE] Petition for Legal Separation / Separate Maintenance — ${vs}`;
    case "custody":
    case "parenting-time":
      return `[PROPOSED TITLE] Petition Regarding Custody / Parenting Time — ${vs}`;
    case "child-support":
      return `[PROPOSED TITLE] Petition / Motion for Child Support — ${vs}`;
    case "spousal-support":
      return `[PROPOSED TITLE] Request for Spousal Support — ${vs}`;
    case "paternity":
      return `[PROPOSED TITLE] Petition to Determine Parentage — ${vs}`;
    case "guardianship":
      return `[PROPOSED TITLE] Petition for Guardianship of a Minor`;
    case "protection-order":
      return `[PROPOSED TITLE] Petition for Protection / Restraining Order — ${vs}`;
    case "adoption":
      return `[PROPOSED TITLE] Petition for Adoption (overview only)`;
    case "name-change":
      return `[PROPOSED TITLE] Petition for Change of Name`;
    default:
      return `[PROPOSED TITLE] Family-law petition — ${vs}`;
  }
}

function nextSteps(state: SessionState, url?: string): string[] {
  const steps = [
    "Write the clerk: confirm the exact packet, fee, and service method for this case type.",
    "Do not file this on-screen draft. Recreate it on the official form.",
  ];
  if (state.learned.safetyFlag) {
    steps.unshift("If you are in danger, call 911. Hotline 1-800-799-7233. Ask the clerk for today's protection-order window.");
  }
  if (url) steps.push(`Open the official self-help site in your own browser: ${url}`);
  if (state.webNotes.length) {
    steps.push(
      "Public pages retrieved for this session are listed under Web sources — title, URL, and retrieved date. They are not a filing and not a complete statute book.",
    );
  }
  if (state.matter) steps.push(`Matter selected in this session: ${MATTER_LABELS[state.matter]}.`);
  steps.push("When finished, use End & erase. Whitestone keeps nothing after the session.");
  return steps;
}
