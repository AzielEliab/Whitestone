import { getJurisdiction, TOPIC_BY_ID } from "../knowledge";
import { PARTY_LABELS } from "../practice/areas";
import type { MatterType, PracticeArea, SessionState } from "../types";
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
  const area: PracticeArea = state.practiceArea ?? "divorce";
  const party = PARTY_LABELS[area];
  const petitioner = state.parties.find((p) => p.role === "petitioner");
  const respondent = state.parties.find((p) => p.role === "respondent");
  const pName =
    petitioner?.name.trim() ||
    (area === "criminal" ? "[Defendant full legal name]" : `[${party.filingRole} full legal name]`);
  const rName =
    respondent?.name.trim() ||
    (area === "criminal" ? `[The State / People of ${j?.name ?? "this jurisdiction"}]` : `[${party.otherRole} full legal name]`);
  const court = j?.courtName ?? "[Court name — confirm with the clerk]";
  const place = !j
    ? "[State / District]"
    : j.code === "DC"
      ? "DISTRICT OF COLUMBIA"
      : `STATE OF ${j.name.toUpperCase()}`;

  const caseTitle = titleFor(matter, pName, rName, area);
  const caption =
    area === "criminal"
      ? [
          `IN THE ${court.toUpperCase()}`,
          `FOR THE ${place.toUpperCase()}`,
          ``,
          `${rName.toUpperCase()}`,
          `    Prosecution (teaching label only),`,
          ``,
          `v.`,
          ``,
          `${pName},`,
          `    Defendant.`,
          ``,
          caseTitle,
          `Case No. ______________`,
        ].join("\n")
      : [
          `IN THE ${court.toUpperCase()}`,
          `FOR THE ${place.toUpperCase()}`,
          ``,
          `${pName},`,
          `    ${party.filingRole},`,
          ``,
          `v.`,
          ``,
          `${rName},`,
          `    ${party.otherRole}.`,
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
    partiesBlock: `${party.filingRole}: ${pName}\n${party.otherRole}: ${rName}`,
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

function titleFor(matter: MatterType | null, p: string, r: string, area: PracticeArea): string {
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
    case "small-claims":
      return `[PROPOSED TITLE] Small-claims claim — ${vs}`;
    case "contract-dispute":
      return `[PROPOSED TITLE] Civil complaint (contract overview) — ${vs}`;
    case "landlord-tenant":
      return `[PROPOSED TITLE] Housing / unlawful-detainer papers — ${vs}`;
    case "civil-protection-order":
      return `[PROPOSED TITLE] Petition for Civil Protection / Harassment Order — ${vs}`;
    case "debt-collection":
      return `[PROPOSED TITLE] Answer / appearance in a collection case — ${vs}`;
    case "bail-arraignment":
      return `[INFORMATIONAL] Arraignment / release — not a petition you file to start a prosecution`;
    case "discovery":
      return `[INFORMATIONAL] Discovery request structure — confirm the local criminal rule`;
    case "plea":
      return `[INFORMATIONAL] Plea overview — not a plea form`;
    case "sentencing":
      return `[INFORMATIONAL] Sentencing checklist — not a judgment`;
    case "expungement":
      return `[PROPOSED TITLE] Petition for expungement / sealing / set-aside`;
    case "rights-education":
      return `[INFORMATIONAL] Rights education — no caption to file`;
    default:
      return area === "criminal"
        ? `[INFORMATIONAL] Criminal process outline — ${vs}`
        : area === "civil"
          ? `[PROPOSED TITLE] Civil filing — ${vs}`
          : `[PROPOSED TITLE] Family-law petition — ${vs}`;
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
