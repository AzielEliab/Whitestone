import type { MatterType } from "../../types";
import type { TopicModule } from "../types";
import { CIVIL_TOPICS } from "./civil";
import { CRIMINAL_TOPICS } from "./criminal";

const honestyBase = [
  "This is educational procedural structure, not legal advice.",
  "Local rules and forms control. Confirm with the clerk and, when you can, a licensed attorney.",
  "Whitestone does not invent case citations or predict outcomes.",
];

export const FAMILY_TOPICS: TopicModule[] = [
  {
    id: "divorce",
    title: "Divorce / dissolution",
    coverage: "checklist",
    summary:
      "A divorce (sometimes called dissolution) asks a court to end a marriage and then divide property and debts, decide support, and — if there are children — enter parenting and child-support orders. Every U.S. jurisdiction now has a no-fault path. Residency, waiting periods, and whether you must live apart first differ by state.",
    issueTree: [
      {
        id: "jurisdiction-venue",
        label: "Can this court hear the case?",
        children: [
          { id: "residency", label: "Residency / domicile" },
          { id: "service", label: "Service on the other spouse" },
          { id: "military", label: "Servicemembers Civil Relief Act pauses" },
        ],
      },
      {
        id: "grounds",
        label: "Grounds and timing",
        children: [
          { id: "no-fault", label: "No-fault / irretrievable breakdown" },
          { id: "separation", label: "Required separation period" },
          { id: "covenant", label: "Covenant-marriage extras (few states)" },
        ],
      },
      {
        id: "children",
        label: "Children of the marriage",
        children: [
          { id: "custody", label: "Decision-making / custody" },
          { id: "parenting-time", label: "Parenting time" },
          { id: "child-support", label: "Child support & health insurance" },
        ],
      },
      {
        id: "money",
        label: "Money and property",
        children: [
          { id: "property", label: "Marital / community property" },
          { id: "debts", label: "Debts" },
          { id: "spousal", label: "Spousal support" },
          { id: "temp", label: "Temporary orders" },
        ],
      },
    ],
    questions: [
      { id: "married", prompt: "Are you currently married (including a possible informal / common-law marriage)?", why: "Divorce only ends a legally recognized marriage.", options: ["Yes, licensed marriage", "Possible informal / common-law marriage", "Already divorced", "Unsure"] },
      { id: "live-apart", prompt: "Are you and the other spouse living apart? If yes, about how long?", why: "Some states require a separation period before filing or before a decree." },
      { id: "agree", prompt: "Do you expect this case to be agreed (uncontested) or contested?", why: "Agreed cases often use shorter packets and may skip trial settings.", options: ["Mostly agreed", "Partly agreed", "Contested", "Unsure"] },
      { id: "kids", prompt: "Are there minor children of this relationship?", why: "Children trigger parenting-plan, support, and sometimes longer waiting rules.", options: ["Yes", "No", "Adult children only"] },
      { id: "safety", prompt: "Are there safety concerns (violence, stalking, threats) that should come first?", why: "Safety filings and address confidentiality should precede a long divorce outline.", options: ["Yes — safety first", "Past concerns, not current", "No"] },
      { id: "where-spouse", prompt: "Does the other spouse live in this same state?", why: "Affects venue, service, and sometimes residency exceptions.", options: ["Yes", "No — other U.S. state", "Outside the U.S.", "Unknown"] },
      { id: "property", prompt: "Is there a house, retirement account, business, or significant debt to divide?", why: "Property disclosure and temporary-use orders may be needed.", options: ["Yes, significant estate", "Mostly personal property", "Mostly debt", "Unsure"] },
    ],
    documentChecklist: [
      "Petition / complaint for divorce or dissolution (local form if one exists)",
      "Summons and proof-of-service packet",
      "Confidential information / party-information sheet (often required)",
      "Financial affidavit or income-and-expense declaration",
      "Proposed parenting plan if there are minor children",
      "Child-support worksheet using the state guideline",
      "Temporary-orders motion if you need interim support, use of a home, or exclusive possession",
      "Fee-waiver application if you cannot pay the filing fee",
      "Military affidavit if the other party may be in the armed forces",
    ],
    evidenceIdeas: [
      { issue: "Residency", examples: ["Lease, utility bill, driver license, voter or school records showing time in the state/county"] },
      { issue: "Marriage", examples: ["Marriage certificate", "Informal-marriage evidence (joint taxes, reputation, agreement)"] },
      { issue: "Income", examples: ["Paystubs, tax returns, business ledgers, unemployment or benefit letters"] },
      { issue: "Property / debts", examples: ["Deeds, titles, account statements, retirement summaries, loan statements"] },
      { issue: "Parenting", examples: ["School and medical records, calendars of caregiving, messages about exchanges"] },
      { issue: "Safety", examples: ["Police reports, photos of injuries or damage, threatening messages, prior orders"] },
    ],
    filingPathway: [
      "Confirm residency and the correct court/county with the clerk.",
      "Pick the local petition packet (agreed vs. contested; with or without children).",
      "Complete captions, party names, and any required statistical forms.",
      "File, pay or waive the fee, and get a case number.",
      "Serve the other party the way the clerk's packet requires; file proof of service.",
      "Exchange financial disclosures; draft a parenting plan and support worksheet if needed.",
      "Seek temporary orders only if something cannot wait.",
      "If agreed, submit a proposed decree on the local form. If not, follow the scheduling order to conference or trial.",
      "Do not treat a draft caption as a filed case. The clerk stamps the case.",
    ],
    honesty: [
      ...honestyBase,
      "Waiting periods and separation rules are easy to get wrong — read the current local instruction sheet.",
    ],
    keywords: ["divorce", "dissolution", "marriage", "spouse", "decree", "petition", "irreconcilable", "no-fault", "property", "debt"],
  },
  {
    id: "legal-separation",
    title: "Legal separation",
    coverage: "checklist",
    summary:
      "Legal separation (or separate maintenance / divorce from bed and board) lets a court divide some rights and duties without ending the marriage. Not every state offers a true legal-separation status. Texas, for example, does not. Use it when someone needs court orders but is not ready — or not eligible — to dissolve the marriage.",
    issueTree: [
      { id: "available", label: "Does this state offer the status?", children: [{ id: "analog", label: "Separate maintenance / bed-and-board analog" }] },
      { id: "why", label: "Why not a divorce?", children: [{ id: "religion", label: "Religious or personal reasons" }, { id: "benefits", label: "Insurance / immigration / waiting period" }] },
      { id: "orders", label: "What orders are needed?", children: [{ id: "support", label: "Support" }, { id: "parenting", label: "Parenting" }, { id: "property", label: "Temporary property use" }] },
    ],
    questions: [
      { id: "why-sep", prompt: "Why are you looking at legal separation instead of divorce?", why: "If the state does not offer the status, a divorce or a stand-alone support/custody case may be the real path." },
      { id: "later-divorce", prompt: "Do you expect to convert this to a divorce later?", why: "Some states let a separation case convert; others need a new filing.", options: ["Yes", "No", "Unsure"] },
      { id: "kids-sep", prompt: "Are there minor children?", why: "Parenting and support can often be ordered even without a divorce.", options: ["Yes", "No"] },
    ],
    documentChecklist: [
      "Confirm with the clerk that legal separation / separate maintenance exists here",
      "Petition for legal separation or separate maintenance",
      "Summons and service packet",
      "Financial affidavit",
      "Parenting plan and support worksheet if there are children",
    ],
    evidenceIdeas: [
      { issue: "Need for orders without dissolution", examples: ["Insurance letters", "Religious-marriage notes (optional)", "Proof of living apart"] },
      { issue: "Support / parenting", examples: ["Same evidence as divorce checklists"] },
    ],
    filingPathway: [
      "Ask the clerk whether this court accepts legal-separation or separate-maintenance petitions.",
      "If not, ask about stand-alone custody, support, or protection cases.",
      "If yes, file and serve as you would a divorce, then request the specific orders you need.",
    ],
    honesty: [
      ...honestyBase,
      "Availability of legal separation is state-specific. Do not assume the status exists.",
    ],
    keywords: ["legal separation", "separate maintenance", "bed and board", "limited divorce"],
  },
  {
    id: "custody",
    title: "Custody / decision-making",
    coverage: "checklist",
    summary:
      "Custody is about who makes major decisions for a child (legal / decision-making) and where the child lives (physical / residential). Many states have renamed these ideas. The child's best interests control. Across state lines, the UCCJEA usually decides which state may issue the first order.",
    issueTree: [
      { id: "which-state", label: "Which state has jurisdiction?", children: [{ id: "home-state", label: "Home state (6 months)" }, { id: "emergency", label: "Emergency / danger" }, { id: "existing", label: "Existing out-of-state order" }] },
      { id: "legal", label: "Decision-making", children: [{ id: "joint", label: "Joint / shared" }, { id: "sole", label: "Sole on some or all issues" }] },
      { id: "physical", label: "Residential custody", children: [{ id: "primary", label: "Primary residence" }, { id: "equal", label: "Equal or near-equal time" }] },
      { id: "safety-c", label: "Safety", children: [{ id: "abuse", label: "Abuse / neglect findings" }, { id: "substance", label: "Substance use" }] },
    ],
    questions: [
      { id: "home-state", prompt: "Where has the child lived for the last six months?", why: "Home-state jurisdiction under the UCCJEA is the usual starting rule." },
      { id: "existing-order", prompt: "Is there already a custody or parenting order anywhere?", why: "A second state usually cannot redo a valid first order.", options: ["Yes, this state", "Yes, another state", "No", "Unsure"] },
      { id: "who-caregave", prompt: "Who has been the child's day-to-day caregiver?", why: "Caregiving history is a core best-interests fact." },
      { id: "decision-split", prompt: "Can you share major decisions (school, medical, religion) or is one area contested?", why: "Courts often split decision-making by topic when parents cannot co-parent every issue." },
      { id: "safety-c", prompt: "Are there abuse, neglect, or substance-use concerns?", why: "Safety findings can change both decision-making and parenting time.", options: ["Yes", "No", "Unsure"] },
    ],
    documentChecklist: [
      "Petition to allocate parental responsibilities / complaint for custody (local title)",
      "UCCJEA affidavit (child's addresses for the last 5 years — widely required)",
      "Proposed parenting plan",
      "Request for temporary orders if the child needs a stable schedule now",
      "Any existing orders from this or another state (for registration if needed)",
    ],
    evidenceIdeas: [
      { issue: "Home state / stability", examples: ["School enrollment", "Pediatric records", "Lease showing the child lived here"] },
      { issue: "Caregiving", examples: ["Calendars", "Messages arranging care", "Affidavits from teachers or relatives (if the court accepts them)"] },
      { issue: "Safety", examples: ["CPS/DCF records you lawfully have", "Police reports", "Medical records", "Prior protection orders"] },
      { issue: "Child's needs", examples: ["IEP or 504 plans", "Therapy letters", "Activity schedules"] },
    ],
    filingPathway: [
      "Map the child's last six months (and five-year address history) before choosing a state.",
      "If another state already issued an order, ask the clerk about registration / enforcement, not a brand-new case.",
      "File the local custody petition plus the UCCJEA affidavit.",
      "Serve every parent and any legal guardian.",
      "Ask for temporary orders only if the schedule or safety cannot wait.",
      "Mediation is required in many courts before a contest hearing.",
    ],
    honesty: honestyBase,
    keywords: ["custody", "decision-making", "parental responsibilities", "legal custody", "physical custody", "uccjea", "home state", "best interests"],
  },
  {
    id: "parenting-time",
    title: "Parenting time",
    coverage: "checklist",
    summary:
      "Parenting time (visitation) is the schedule of overnights, midweek time, holidays, and exchanges. It can be built inside a divorce or custody case or modified later when facts change. Safety can justify supervised time or exchanges at a neutral place.",
    issueTree: [
      { id: "schedule", label: "Regular schedule", children: [{ id: "overnights", label: "Overnights" }, { id: "midweek", label: "Midweek" }] },
      { id: "holidays", label: "Holidays and school breaks" },
      { id: "exchanges", label: "Exchanges and travel" },
      { id: "supervised", label: "Supervised or therapeutic time" },
    ],
    questions: [
      { id: "current-sched", prompt: "What schedule is actually happening now?", why: "Courts often start from the status quo unless it is unsafe." },
      { id: "distance", prompt: "How far apart do the households live?", why: "Distance drives midweek feasibility and travel costs." },
      { id: "holidays", prompt: "Which holidays or breaks are most important to each household?", why: "Holiday tables prevent yearly fights." },
      { id: "supervise", prompt: "Is supervised parenting time or a monitored exchange needed for safety?", why: "Supervision is a safety tool, not a punishment theory.", options: ["Yes", "Maybe", "No"] },
    ],
    documentChecklist: [
      "Motion or petition to set / modify parenting time",
      "Proposed calendar (regular, holidays, summers)",
      "Request for a specific exchange location if conflict is high",
      "If modifying: a short statement of what has changed since the last order",
    ],
    evidenceIdeas: [
      { issue: "Status quo", examples: ["Calendars", "School pickup logs", "Messages confirming overnights"] },
      { issue: "Distance / work", examples: ["Work schedules", "Maps of commute", "Child-care hours"] },
      { issue: "Safety at exchanges", examples: ["Incident reports", "Hostile messages at handoffs"] },
    ],
    filingPathway: [
      "If there is no case yet, parenting time is usually requested inside a custody or divorce filing.",
      "If there is already an order, file a modification in the court that issued it (or the court that now has exclusive jurisdiction).",
      "Attach a concrete proposed schedule — vague 'reasonable time' language is hard to enforce.",
      "Ask the clerk whether mediation is required before a hearing.",
    ],
    honesty: honestyBase,
    keywords: ["parenting time", "visitation", "overnights", "holiday schedule", "supervised", "exchanges"],
  },
  {
    id: "child-support",
    title: "Child support",
    coverage: "checklist",
    summary:
      "Child support is a guideline math problem first: each state has a presumptive formula (income shares, percentage of income, or Melson). Courts can deviate with written reasons. Health insurance, child care, and extraordinary medical costs are often add-ons. Interstate cases follow UIFSA.",
    issueTree: [
      { id: "guideline", label: "Guideline worksheet", children: [{ id: "income", label: "Gross / net income" }, { id: "impute", label: "Imputed income" }] },
      { id: "addons", label: "Add-ons", children: [{ id: "health", label: "Health insurance" }, { id: "daycare", label: "Work-related child care" }] },
      { id: "parenting-credit", label: "Parenting-time adjustment" },
      { id: "enforce", label: "Enforcement / IV-D agency" },
    ],
    questions: [
      { id: "incomes-known", prompt: "Do you know both households' current incomes?", why: "The guideline starts from income evidence, not guesses.", options: ["Both known", "Only mine", "Only theirs", "Neither"] },
      { id: "overnights-cs", prompt: "About how many overnights does each parent have in a year?", why: "Many guidelines credit substantial parenting time." },
      { id: "insurance", prompt: "Who can get health insurance for the child, and at what cost?", why: "Medical support is usually part of the order." },
      { id: "agency", prompt: "Do you want the state child-support agency involved, or only a court order?", why: "IV-D agencies enforce but are not your lawyer.", options: ["Court only", "Open a IV-D case", "Already have a IV-D case", "Unsure"] },
      { id: "existing-cs", prompt: "Is there already a support order to modify or enforce?", why: "UIFSA limits which state can modify.", options: ["Yes", "No", "Unsure"] },
    ],
    documentChecklist: [
      "State child-support worksheet (mandatory in most courts)",
      "Last 3–12 months of paystubs and the most recent tax return",
      "Proof of health-insurance premiums and child-care invoices",
      "Motion to modify if an order already exists (state the change in circumstances)",
      "IV-D application if you want agency enforcement",
    ],
    evidenceIdeas: [
      { issue: "Income", examples: ["Paystubs", "W-2 / 1099", "Profit-and-loss for self-employment", "Unemployment letters"] },
      { issue: "Add-ons", examples: ["Insurance declarations page", "Daycare invoices", "Unreimbursed medical bills"] },
      { issue: "Parenting time", examples: ["Calendar of overnights"] },
    ],
    filingPathway: [
      "Identify whether you need a first order, a modification, or enforcement.",
      "If an out-of-state order controls, ask the agency/clerk about UIFSA registration before seeking a change.",
      "Complete the official worksheet — do not invent a round number.",
      "File in the existing family case when there is one; otherwise ask the clerk for a stand-alone support petition.",
      "Keep using the guideline until a court signs a different number.",
    ],
    honesty: [
      ...honestyBase,
      "Any dollar figure is HEURISTIC / ILLUSTRATIVE unless it cites a public formula with a source URL. Use the official state worksheet or agency calculator — never treat Whitestone as the worksheet.",
    ],
    keywords: ["child support", "guideline", "worksheet", "arrears", "iv-d", "uifsa", "imputed income", "medical support"],
  },
  {
    id: "spousal-support",
    title: "Spousal support / alimony",
    coverage: "checklist",
    summary:
      "Spousal support (alimony, maintenance) is discretionary in most states and is separate from property division. Courts look at need, ability to pay, length of the marriage, age and health, and the standard of living. Some states have advisory formulas; many do not. Temporary support can be requested early.",
    issueTree: [
      { id: "temp-ss", label: "Temporary support during the case" },
      { id: "final-ss", label: "Duration and amount after judgment" },
      { id: "factors", label: "Need vs. ability to pay" },
      { id: "mod", label: "Later modification / termination" },
    ],
    questions: [
      { id: "length", prompt: "About how long has the marriage lasted?", why: "Duration is a primary factor almost everywhere." },
      { id: "gap", prompt: "Is there a large income or earning-capacity gap?", why: "Need and ability to pay are the core pairing.", options: ["Yes", "No", "Unsure"] },
      { id: "stay-home", prompt: "Did one spouse leave the workforce to care for children or the household?", why: "Rehabilitation and earning-capacity facts matter." },
      { id: "temp-need", prompt: "Do you need support before the final decree (rent, insurance, food)?", why: "Temporary orders have a shorter packet than a final award.", options: ["Yes", "No"] },
    ],
    documentChecklist: [
      "Request for temporary / final spousal support in the petition or a motion",
      "Detailed income-and-expense declaration for both households if available",
      "Proof of the marital standard of living (housing, insurance, recurring bills)",
      "Any local advisory worksheet if the court publishes one",
    ],
    evidenceIdeas: [
      { issue: "Need", examples: ["Budget", "Lease", "Medical bills", "Job-search records"] },
      { issue: "Ability to pay", examples: ["Other spouse's paystubs", "Business deposits", "Lifestyle evidence that is lawfully obtained"] },
      { issue: "Marriage length / roles", examples: ["Marriage certificate", "Work-history timeline"] },
    ],
    filingPathway: [
      "Plead the request in the initial petition so you do not waive it by silence (local rules differ).",
      "If bills cannot wait, file a temporary-support motion with a complete financial affidavit.",
      "Ask the clerk whether the court uses an advisory formula or only factor lists.",
      "Property division and support interact — do not treat them as identical.",
    ],
    honesty: [
      ...honestyBase,
      "There is no national alimony calculator. Do not treat any round number as an award.",
    ],
    keywords: ["alimony", "spousal support", "maintenance", "temporary support", "rehabilitative"],
  },
  {
    id: "paternity",
    title: "Parentage / paternity",
    coverage: "checklist",
    summary:
      "Parentage decides who is a legal parent. Paths include a marital presumption, a voluntary acknowledgment, genetic testing, and a court judgment. An acknowledgment often becomes a judgment after a short rescission window. Parentage is usually the gateway to custody and child support.",
    issueTree: [
      { id: "presumption", label: "Marital or holding-out presumption" },
      { id: "vap", label: "Voluntary acknowledgment" },
      { id: "test", label: "Genetic testing" },
      { id: "judgment", label: "Court judgment of parentage" },
    ],
    questions: [
      { id: "married-at-birth", prompt: "Was anyone married to the birth parent when the child was born?", why: "A marital presumption may already name a legal parent.", options: ["Yes", "No", "Unsure"] },
      { id: "acknowledgment", prompt: "Did anyone sign a voluntary acknowledgment of parentage at the hospital or later?", why: "Acknowledgments are often as strong as judgments after the rescission period.", options: ["Yes", "No", "Unsure"] },
      { id: "want-test", prompt: "Is genetic testing needed before anyone signs or agrees?", why: "Do not sign an acknowledgment if you need a test first.", options: ["Yes", "No", "Already tested"] },
      { id: "after-parentage", prompt: "After parentage is clear, do you also need custody, parenting time, or support?", why: "Many courts can enter those orders in the same case.", options: ["All of those", "Support only", "Custody / time only", "Parentage only"] },
    ],
    documentChecklist: [
      "Petition to determine parentage / complaint to establish paternity",
      "Request for genetic testing if facts are disputed",
      "Birth-certificate and acknowledgment copies if they exist",
      "Proposed custody / support orders if you want them in the same case",
    ],
    evidenceIdeas: [
      { issue: "Acknowledgment / presumption", examples: ["Birth certificate", "Signed VAP/AOP", "Marriage certificate"] },
      { issue: "Testing", examples: ["Accredited lab results already in hand", "Agency test order"] },
      { issue: "Holding out", examples: ["School records listing a parent", "Joint residence evidence"] },
    ],
    filingPathway: [
      "Collect the birth certificate and any acknowledgment before filing.",
      "If you need a test, say so in the petition; do not sign a new acknowledgment in the meantime.",
      "File in the local family or juvenile / parentage court the clerk names.",
      "The IV-D agency can often open a parentage-and-support case if that is all you need.",
    ],
    honesty: honestyBase,
    keywords: ["paternity", "parentage", "acknowledgment", "genetic test", "vap", "aop", "presumption"],
  },
  {
    id: "guardianship",
    title: "Guardianship",
    coverage: "checklist",
    summary:
      "A guardian is a court-appointed stand-in for a parent when a parent cannot safely or practically care for a child. Some states use probate court; others use family or juvenile court. This is not an adoption. Parents often keep residual rights and can later ask to end the guardianship.",
    issueTree: [
      { id: "need", label: "Why a guardian is needed" },
      { id: "which-court", label: "Probate vs. family / juvenile court" },
      { id: "notice", label: "Notice to parents and other required people" },
      { id: "powers", label: "School, medical, and housing powers" },
    ],
    questions: [
      { id: "parents-able", prompt: "Are one or both parents unavailable, incapacitated, or consenting?", why: "Consent and notice rules decide how the case is served.", options: ["Consenting", "Unavailable", "Objecting", "Mixed"] },
      { id: "kin", prompt: "Is the proposed guardian a relative already caring for the child?", why: "Kinship facts help the best-interests story and sometimes venue." },
      { id: "icpc-g", prompt: "Would the child move to another state if appointed?", why: "Interstate placement can trigger extra compact processes." },
    ],
    documentChecklist: [
      "Petition for guardianship of a minor (local probate or family form)",
      "Proposed order listing school and medical powers",
      "Consents if parents agree; otherwise a service plan for each parent",
      "Background / fingerprint packet if the court requires it",
      "Letters of guardianship after appointment — schools and doctors usually want the letters, not just a petition",
    ],
    evidenceIdeas: [
      { issue: "Need", examples: ["Proof of parent's absence, incarceration, or incapacity", "Existing caregiver affidavit"] },
      { issue: "Best interests", examples: ["School records in the guardian's district", "Medical continuity"] },
    ],
    filingPathway: [
      "Ask the clerk whether minors' guardianships are filed in probate, family, or juvenile court.",
      "Name every parent and any existing guardian in the caption and serve them.",
      "If a parent objects, expect a best-interests hearing — this is not a default paperwork path.",
      "After appointment, get certified letters; a petition alone does not authorize school enrollment.",
    ],
    honesty: [
      ...honestyBase,
      "Guardianship is not adoption and does not by itself end parental rights.",
    ],
    keywords: ["guardianship", "guardian", "letters of guardianship", "probate", "kinship"],
  },
  {
    id: "protection-order",
    title: "Protection / restraining order (family)",
    coverage: "checklist",
    summary:
      "A family protection or restraining order is a civil court order that can require no-contact, stay-away distances, exclusive use of a home, temporary parenting limits, and surrender of firearms where the statute allows. If you are in danger, this comes before a divorce outline. Emergency / ex parte orders are short; a return hearing is required.",
    issueTree: [
      { id: "immediate", label: "Immediate safety" },
      { id: "relationship", label: "Qualifying relationship (family / household / dating — state-defined)" },
      { id: "exparte", label: "Temporary / ex parte order" },
      { id: "hearing", label: "Return hearing for a longer order" },
    ],
    questions: [
      { id: "danger-now", prompt: "Is anyone in immediate danger right now?", why: "If yes, call 911 first. The court process is next, not instead.", options: ["Yes — emergency", "Not this moment, but recently", "No"] },
      { id: "relationship-po", prompt: "What is the relationship to the other person?", why: "Family-order statutes have relationship tests; some conduct belongs in a different civil or criminal path." },
      { id: "children-po", prompt: "Do you need temporary parenting or exclusive-use-of-home terms in the order?", why: "Ask for the remedies the statute actually allows.", options: ["Yes, children", "Yes, home", "Both", "No-contact only"] },
      { id: "confidential", prompt: "Do you need your address kept off the papers the other party sees?", why: "Many courts have a confidential-address form." },
    ],
    documentChecklist: [
      "Local petition for a family protection / restraining / injunction order",
      "Affidavit describing recent incidents with dates, places, and what happened",
      "Request for temporary (ex parte) relief if danger is immediate",
      "Confidential-address form if needed",
      "Any prior orders, police report numbers, or photos you can attach",
    ],
    evidenceIdeas: [
      { issue: "Incidents", examples: ["Dated narrative", "Photos", "Texts / emails / voicemail transcripts", "Medical visit notes", "Police report numbers"] },
      { issue: "Relationship", examples: ["Marriage certificate", "Shared lease", "Child's birth certificate"] },
    ],
    filingPathway: [
      "If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233.",
      "Go to the clerk the same day if possible; many courts have a same-day protection-order window.",
      "Write recent, specific incidents. Courts need facts, not labels.",
      "Ask for every remedy you need (stay-away, home, children, firearms if authorized).",
      "Serve the other party the way the clerk instructs — often the sheriff.",
      "Appear at the return hearing even if a temporary order was granted.",
    ],
    honesty: [
      ...honestyBase,
      "A protection order is not a criminal conviction, but violating it can be a crime. Whitestone cannot file for you.",
    ],
    keywords: ["protection order", "restraining order", "injunction", "ex parte", "no contact", "domestic violence", "pfa", "dvo", "209a"],
  },
  {
    id: "adoption",
    title: "Adoption (overview)",
    coverage: "procedural-overview",
    summary:
      "Adoption creates a new parent-child relationship and usually ends the legal rights of a prior parent. It is court-supervised. Common paths: stepparent, kinship, agency / foster, and private-placement. Interstate moves often need ICPC approval. This module is an overview only — not a home-study or consent packet.",
    issueTree: [
      { id: "path", label: "Which adoption path?", children: [{ id: "step", label: "Stepparent" }, { id: "kin", label: "Kinship / relative" }, { id: "agency", label: "Agency / foster" }] },
      { id: "consent", label: "Consent or termination of parental rights" },
      { id: "home-study", label: "Home study / background checks" },
      { id: "final", label: "Finalization hearing" },
    ],
    questions: [
      { id: "path-ad", prompt: "What kind of adoption are you exploring?", why: "Packets differ sharply by path.", options: ["Stepparent", "Relative / kinship", "Agency or foster", "Private placement", "Unsure"] },
      { id: "consent-ad", prompt: "Have the existing legal parents consented, or must rights be terminated?", why: "Missing consent is the usual reason an adoption cannot be finalized.", options: ["Consent in hand", "Termination case pending", "Neither", "Unsure"] },
      { id: "interstate-ad", prompt: "Does the child live in a different state from the adopting adult?", why: "ICPC may apply before the child moves." },
    ],
    documentChecklist: [
      "Ask the clerk for the correct adoption packet (stepparent packets are often shorter)",
      "Consents or a companion termination case",
      "Home-study / criminal-background instructions",
      "Child's birth certificate and any existing custody orders",
      "ICPC paperwork if the placement crosses state lines",
    ],
    evidenceIdeas: [
      { issue: "Relationship to the child", examples: ["Marriage to a parent (stepparent)", "Kinship proof", "Placement history"] },
      { issue: "Consent / TPR", examples: ["Signed consents", "Termination judgment"] },
    ],
    filingPathway: [
      "Identify the path with the clerk or agency before writing captions.",
      "Do not move a child across state lines for adoption without checking ICPC.",
      "File only when required consents, notices, and background steps are understood.",
      "The finalization hearing is what creates the new parentage — not the petition alone.",
    ],
    honesty: [
      ...honestyBase,
      "Coverage is overview. Adoption has specialized counsel and agency rules Whitestone does not replace.",
    ],
    keywords: ["adoption", "stepparent", "icpc", "termination", "home study", "finalization"],
  },
  {
    id: "name-change",
    title: "Name change",
    coverage: "checklist",
    summary:
      "Adults and children can usually change a name by petition. A former name is often restored inside a divorce judgment without a second case. Child name changes typically need notice to both parents and a best-interests showing. Criminal-background and publication rules vary.",
    issueTree: [
      { id: "vehicle", label: "Inside a divorce vs. stand-alone petition" },
      { id: "child-nc", label: "Child's name — notice to both parents" },
      { id: "publication", label: "Publication / background checks" },
    ],
    questions: [
      { id: "who-nc", prompt: "Whose name would change?", why: "Adult and child packets differ.", options: ["Mine (adult)", "A child's", "Both"] },
      { id: "divorce-nc", prompt: "Is there an open divorce where a former name can be restored?", why: "That is usually simpler than a new civil case.", options: ["Yes", "No", "Planning to file divorce"] },
      { id: "other-parent", prompt: "If a child: will the other legal parent consent?", why: "Objecting parents trigger a best-interests hearing.", options: ["Consent", "Will object", "Unknown / cannot find"] },
    ],
    documentChecklist: [
      "Petition for change of name (or a restoration paragraph in a divorce judgment)",
      "Certified birth certificate",
      "Fingerprints / background forms if the court requires them",
      "Proposed publication notice if publication is still required locally",
      "Consents for a child's name change",
    ],
    evidenceIdeas: [
      { issue: "Identity", examples: ["Birth certificate", "Current ID"] },
      { issue: "Child's best interests", examples: ["School records already using the name", "Sibling-name consistency", "Safety reasons"] },
    ],
    filingPathway: [
      "If a divorce is pending, ask for restoration of a former name in the proposed judgment.",
      "Otherwise file the civil / family name-change petition the clerk names.",
      "Complete any background or publication step before the hearing.",
      "After the order, use certified copies for SSA, DMV, and passport — Whitestone does not export the order.",
    ],
    honesty: honestyBase,
    keywords: ["name change", "former name", "restoration", "publication"],
  },
];

export const TOPICS: TopicModule[] = [...FAMILY_TOPICS, ...CIVIL_TOPICS, ...CRIMINAL_TOPICS];

export const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<
  MatterType,
  TopicModule
>;
