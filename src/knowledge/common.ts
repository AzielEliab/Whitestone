import type { CoverageLevel, PracticeArea } from "../types";

export const PRODUCT = {
  name: "Whitestone",
  version: "1.4.0",
  author: "Aziel Eliab",
  lens: ["Service", "Clarity", "Peace"] as const,
};

export const LEGAL_DISCLAIMER = [
  "Whitestone is educational software. It is not a law firm, not a lawyer, and not a substitute for a licensed attorney, court clerk, or judge.",
  "Nothing here is legal advice, a prediction of your case, or a representation that Whitestone can replace counsel.",
  "Statutes, court rules, local forms, and fees change. Coverage is a high-level procedural overview — not an annotated code of every statute.",
  "Do not treat captions, allegation maps, or checklists as court-ready filings. Verify every requirement with the clerk of the court that will hear the case, and with counsel when you can.",
  "Whitestone does not invent case citations. If a citation is not shown, it was not looked up.",
  "If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233. Suicide & Crisis Lifeline: 988.",
].join(" ");

export const FEDERAL_FRAMEWORK: {
  id: string;
  title: string;
  coverage: CoverageLevel;
  body: string;
  areas?: PracticeArea[];
}[] = [
  {
    id: "uccjea",
    title: "UCCJEA — which state may decide custody",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "The Uniform Child Custody Jurisdiction and Enforcement Act is in force in all 50 states and D.C. A court generally needs home-state jurisdiction (the child lived in the state for the last six months, or since birth if younger) before it issues an initial custody order. Emergency jurisdiction can exist for immediate danger, but it is usually temporary. Do not file a competing custody case in a second state to shop for a result — the first court with proper jurisdiction usually keeps the case. Confirm home state, significant connections, and any existing order before choosing a venue.",
  },
  {
    id: "uifsa",
    title: "UIFSA — interstate child support",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "The Uniform Interstate Family Support Act, together with the federal IV-D child-support program, governs how support orders are established, modified, and enforced across state lines. Generally only one state has continuing exclusive jurisdiction to modify an order. Other states can enforce. Use the state child-support agency and the court that issued the controlling order; do not assume a new state can rewrite support just because someone moved.",
  },
  {
    id: "pkpa",
    title: "PKPA — full faith and credit for custody",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "The federal Parental Kidnapping Prevention Act requires states to give full faith and credit to qualifying custody determinations of other states. It works alongside the UCCJEA. If another state already has a valid custody order, a new filing should usually seek registration or enforcement, not a fresh determination.",
  },
  {
    id: "vawa-safety",
    title: "Safety and protection orders",
    coverage: "federal-framework",
    areas: ["divorce", "civil"],
    body: "Family protection / restraining orders are state-court processes. Federal law (including VAWA-related full-faith-and-credit rules) helps qualifying protection orders travel across state lines. If there is violence, stalking, or immediate danger, prioritize safety planning and a protection-order petition over a long divorce checklist. Whitestone never stores your files after the session ends. Tell a clerk or advocate if you need address confidentiality.",
  },
  {
    id: "iv-d",
    title: "IV-D child-support agencies",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "Every state and D.C. has a child-support enforcement agency funded under Title IV-D. These agencies can locate parents, establish parentage, obtain and enforce support, and intercept tax refunds. They are not your private lawyer. You may also ask the family court for a support order in a divorce or custody case.",
  },
  {
    id: "icpc",
    title: "ICPC — interstate placement (adoption / foster)",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "The Interstate Compact on the Placement of Children applies when a child is placed across state lines for foster care or adoption. Private interstate adoptions usually need ICPC approval before the child moves. This is an overview only — adoption is court-supervised and time-sensitive.",
  },
  {
    id: "upa",
    title: "Parentage frameworks",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "Many states follow ideas from the Uniform Parentage Act (in various revisions): a marital presumption, voluntary acknowledgment of parentage, genetic testing, and court judgments. An acknowledgment often has the force of a judgment after a short rescission window. Do not sign an acknowledgment if you are unsure. A later genetic test does not automatically undo a judgment — you must use the state's challenge process.",
  },
  {
    id: "service",
    title: "Service of process",
    coverage: "federal-framework",
    body: "Most family cases require proper service of the petition and summons on the other party. Common methods: personal service by a sheriff or process server, certified mail where allowed, or service by publication after a due-diligence showing. Defective service can void later orders. Ask the clerk for the local service packet and keep proofs of service.",
  },
  {
    id: "fee-waiver",
    title: "Fee waivers",
    coverage: "federal-framework",
    body: "Every jurisdiction offers a process to waive or defer filing fees for people who cannot afford them (often called in forma pauperis, fee waiver, or statement of inability to pay). Ask the clerk for the current form. A waiver of the filing fee does not always waive service costs or later motion fees.",
  },
  {
    id: "best-interests",
    title: "Best-interests standard",
    coverage: "federal-framework",
    areas: ["divorce"],
    body: "Custody and parenting-time decisions are almost always governed by the child's best interests. Factors commonly include the child's safety, each parent's caregiving history, stability, the child's ties to school and community, any history of abuse, and (when appropriate) the child's views. States list factors differently. Whitestone maps your facts to these themes; it does not score a winner.",
  },
  {
    id: "counsel-rights",
    title: "Right to counsel in criminal cases",
    coverage: "federal-framework",
    areas: ["criminal"],
    body: "In the United States, a person accused of a crime that can lead to jail generally has a right to a lawyer, including an appointed lawyer if they cannot afford one. Ask for counsel at the first appearance. Whitestone is not that lawyer and cannot appear with you. For serious charges, contact the public defender or hired counsel before you talk about facts.",
  },
  {
    id: "silence",
    title: "Silence and questioning (overview)",
    coverage: "federal-framework",
    areas: ["criminal"],
    body: "You may say you want a lawyer and that you will remain silent. Officers may still ask you to identify yourself where a state law requires it. This is civic education — not a script for an interrogation and not advice to resist a lawful arrest. Do not destroy phones or papers.",
  },
  {
    id: "appear",
    title: "Appear in court",
    coverage: "federal-framework",
    areas: ["criminal"],
    body: "Missing a required criminal court date can produce a warrant and a new charge. If you cannot appear, contact your lawyer or the clerk before the date. Whitestone will not help anyone evade arrest or hide from a warrant.",
  },
  {
    id: "fdcpa",
    title: "Debt-collection overlay (FDCPA overview)",
    coverage: "federal-framework",
    areas: ["civil"],
    body: "Federal collector-conduct rules (including the Fair Debt Collection Practices Act) limit some third-party collector behavior. They do not by themselves dismiss a valid lawsuit. If you were served, the answer deadline on the summons controls. Ask legal aid about validation, ownership of the debt, and state exemptions. Do not hide assets.",
  },
  {
    id: "housing-overview",
    title: "Housing court is local",
    coverage: "federal-framework",
    areas: ["civil"],
    body: "Eviction notice periods, just-cause rules, and deposit statutes are state and often city specific. Federal fair-housing rules overlay discrimination. Illegal lockouts and utility shutoffs are often unlawful — ask legal aid. Whitestone will not tell a landlord how to lock someone out.",
  },
];

export const NO_EXPORT_COPY =
  "Whitestone never downloads, exports, prints, or packages your filings, chat, or evidence. You may upload files into this session. Captions and outlines stay on screen only. When you close the window or choose End & erase, the session is wiped.";

export const WEB_RESEARCH_COPY =
  "The live app may fetch allowlisted public court, legal-aid, and government pages so answers can cite current clerk/self-help material. Fetched snippets live only in this session (or a short Worker cache of the same public URL). Offline zip copies do not include live research. This is still not legal advice and not a complete statute book.";

export const EPHEMERAL_COPY =
  "Chat, uploads, fetched web notes, and derived case state live only in this browser session (memory and session storage). There is no user account and no case file on a server. End & erase wipes chat, uploads, web notes, metadata, IndexedDB, and caches for this session.";
