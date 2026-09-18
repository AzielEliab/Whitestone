import type { TopicModule } from "../types";

const honestyBase = [
  "This is educational procedural structure, not legal advice.",
  "Local rules, dollar limits, and forms control. Confirm with the clerk and, when you can, a licensed attorney.",
  "Whitestone does not invent case citations or predict outcomes.",
];

export const CIVIL_TOPICS: TopicModule[] = [
  {
    id: "small-claims",
    title: "Small claims",
    coverage: "checklist",
    summary:
      "Small claims is a simplified civil docket for money disputes under a state dollar cap. Procedures, whether lawyers may appear, and how you collect a judgment differ by court. It is still a lawsuit: you must name the right party, serve them, and prove the amount.",
    issueTree: [
      { id: "limit", label: "Is the amount within the local small-claims cap?" },
      { id: "party", label: "Correct defendant (person vs. business name)" },
      { id: "service", label: "Service of the claim" },
      { id: "proof", label: "Proof of the debt or damage" },
      { id: "collect", label: "Collecting if you win" },
    ],
    questions: [
      {
        id: "amount",
        prompt: "About how much money is in dispute?",
        why: "Each court has a cap. Over the cap you may need a different civil docket — or to waive the extra.",
      },
      {
        id: "who-owes",
        prompt: "Is the other side a person, a landlord, or a business?",
        why: "You must sue the legal name that owes the money. A store brand is not always the corporation.",
        options: ["Person", "Landlord / property manager", "Business", "Unsure"],
      },
      {
        id: "try-demand",
        prompt: "Have you already sent a written demand or used a required notice?",
        why: "Some courts expect a demand letter. Landlord-tenant and consumer statutes sometimes require a notice first.",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "serve-sc",
        prompt: "Do you know how this court serves small-claims papers?",
        why: "Defective service can dismiss the case. Ask the clerk for the local methods.",
        options: ["Yes", "Not yet"],
      },
    ],
    documentChecklist: [
      "Local small-claims plaintiff's claim / affidavit of claim",
      "Written demand letter and any reply",
      "Contracts, invoices, photos, repair estimates, or account statements",
      "Correct legal name of the defendant (SOS / county records if a business)",
      "Fee-waiver application if you cannot pay the filing fee",
    ],
    evidenceIdeas: [
      { issue: "Amount owed", examples: ["Invoices", "Canceled checks", "Texts agreeing to pay", "Repair estimates"] },
      { issue: "Who to sue", examples: ["Lease", "Business card vs. Secretary of State printout", "Canceled check payee"] },
    ],
    filingPathway: [
      "Confirm the dollar limit and the correct courthouse with the clerk.",
      "Name the legal defendant — not only a trade name.",
      "File the local claim form; pay or waive the fee.",
      "Serve the defendant the way the clerk's packet requires; file proof.",
      "Bring organized exhibits to the hearing. A judgment is not automatic payment.",
      "Ask the clerk about collection tools only after a signed judgment.",
    ],
    honesty: [
      ...honestyBase,
      "Whitestone does not calculate your exact cap or collect a judgment for you.",
    ],
    keywords: ["small claims", "money", "cap", "plaintiff", "claim", "judgment", "collect"],
  },
  {
    id: "contract-dispute",
    title: "Contract dispute (overview)",
    coverage: "procedural-overview",
    summary:
      "A contract dispute asks whether there was an agreement, who broke it, and what the remedy is (money, sometimes cancellation). Many consumer and small business fights belong in small claims if the dollars fit. This is a high-level map — not a brief, and not business-formation or tax advice.",
    issueTree: [
      { id: "agreement", label: "Was there a contract (written, oral, or by conduct)?" },
      { id: "breach", label: "What promise was broken?" },
      { id: "damages", label: "What money loss can you prove?" },
      { id: "forum", label: "Small claims vs. general civil" },
    ],
    questions: [
      {
        id: "writing",
        prompt: "Is there a signed writing, texts that look like a deal, or only a handshake?",
        why: "Some agreements must be in writing. Texts can still matter. The clerk's packet will not decide that for you.",
        options: ["Signed writing", "Texts / email", "Oral only", "Unsure"],
      },
      {
        id: "broke",
        prompt: "In one sentence, what did the other side fail to do?",
        why: "Courts want a concrete broken promise, not a feeling.",
      },
      {
        id: "loss",
        prompt: "What money did you actually lose (paid, unreturned, cost to fix)?",
        why: "Bring numbers and documents. Whitestone will not invent damages.",
      },
      {
        id: "forum-cd",
        prompt: "Do you expect to use small claims or a general civil filing?",
        why: "Dollar limits and lawyer rules differ.",
        options: ["Small claims", "General civil", "Unsure"],
      },
    ],
    documentChecklist: [
      "The contract, invoices, change orders, or message thread that shows the deal",
      "Proof of payment and of the other side's failure",
      "A short timeline of dates",
      "Local complaint or small-claims form — not this screen",
    ],
    evidenceIdeas: [
      { issue: "Agreement", examples: ["Signed pages", "Email acceptances", "Estimates both sides used"] },
      { issue: "Breach and loss", examples: ["Photos of unfinished work", "Bank records", "Replacement bids"] },
    ],
    filingPathway: [
      "Gather the writing and a one-page timeline before you pick a docket.",
      "If the dollars fit, ask the clerk whether small claims is available.",
      "Name the correct legal party and serve them.",
      "Plead facts you can prove. Do not invent legal theories Whitestone did not cite.",
      "This is not advice on forming an LLC, drafting a template mill, or evading taxes.",
    ],
    honesty: [
      ...honestyBase,
      "Not a business-formation service and not a contract-drafting mill.",
    ],
    keywords: ["contract", "agreement", "breach", "invoice", "promise", "damages"],
  },
  {
    id: "landlord-tenant",
    title: "Landlord-tenant (overview)",
    coverage: "procedural-overview",
    summary:
      "Housing cases usually start with a notice (pay or quit, cure, or termination) and, if needed, an eviction / unlawful-detainer case. Lockouts, utility shutoffs, and self-help evictions are often illegal. Notice days and defenses are state- and city-specific — verify locally.",
    issueTree: [
      { id: "notice", label: "What notice was given, and was it the right kind?" },
      { id: "habitability", label: "Repairs / habitability" },
      { id: "court", label: "Eviction court vs. small claims for a deposit" },
      { id: "lockout", label: "Illegal lockout or utility shutoff" },
    ],
    questions: [
      {
        id: "role-lt",
        prompt: "Are you a tenant, a landlord, or helping someone in the household?",
        why: "Packets and defenses differ.",
        options: ["Tenant", "Landlord", "Household member", "Unsure"],
      },
      {
        id: "notice-lt",
        prompt: "Have you received (or served) a written notice? What kind?",
        why: "Pay-or-quit, cure, and no-cause notices are not interchangeable.",
        options: ["Pay or quit / rent", "Cure a lease issue", "Termination / no-cause", "No written notice", "Unsure"],
      },
      {
        id: "court-lt",
        prompt: "Has an eviction case already been filed?",
        why: "Deadlines to answer are short. Ignoring a summons can lead to a default.",
        options: ["Yes — I have papers", "Not yet", "Unsure"],
      },
      {
        id: "repairs",
        prompt: "Are repair or deposit issues the main fight?",
        why: "Some issues belong in the eviction case; a deposit fight may be small claims after move-out.",
        options: ["Repairs / conditions", "Security deposit", "Both", "Neither"],
      },
    ],
    documentChecklist: [
      "Lease and any addenda",
      "The notice and the envelope / proof of how it arrived",
      "Rent ledger or money-order stubs",
      "Photos, repair requests, and inspector or code letters",
      "Summons and complaint if a case is already filed — calendar the answer date",
    ],
    evidenceIdeas: [
      { issue: "Notice and service", examples: ["Photo of the posted notice", "Certified-mail green card", "Text of delivery"] },
      { issue: "Conditions / rent", examples: ["Dated photos", "Work-order emails", "Receipts"] },
    ],
    filingPathway: [
      "Read every deadline on the summons the same day you get it.",
      "Ask the clerk or legal aid which housing / eviction docket this is.",
      "Do not ignore court papers. A default can become a lockout writ.",
      "Illegal lockout or utility shutoff: ask legal aid or the clerk about emergency remedies; call 911 if you are in danger.",
      "Deposit disputes after move-out are often a different case than the eviction.",
    ],
    honesty: [
      ...honestyBase,
      "Whitestone will not tell you how to lock someone out or shut off utilities.",
    ],
    keywords: ["eviction", "landlord", "tenant", "lease", "rent", "habitability", "deposit", "unlawful detainer"],
  },
  {
    id: "civil-protection-order",
    title: "Civil protection / harassment order",
    coverage: "checklist",
    summary:
      "A civil protection, harassment, or stalking order is a court order for no-contact or stay-away when the relationship may not fit a family / household statute. If you are in danger, call 911 first. Emergency orders are short; a return hearing is required. This is not a criminal charge by itself.",
    issueTree: [
      { id: "danger", label: "Immediate safety" },
      { id: "fit", label: "Family order vs. civil harassment / stalking path" },
      { id: "facts", label: "Recent, specific incidents" },
      { id: "hearing", label: "Return hearing" },
    ],
    questions: [
      {
        id: "danger-cpo",
        prompt: "Is anyone in immediate danger right now?",
        why: "If yes, call 911 first. The court process is next, not instead.",
        options: ["Yes — emergency", "Not this moment, but recently", "No"],
      },
      {
        id: "relationship-cpo",
        prompt: "What is the relationship to the other person?",
        why: "Family / household / dating relationships often use a different packet than neighbor, coworker, or stranger harassment.",
      },
      {
        id: "family-fit",
        prompt: "Would a family protection / DV order fit better (spouse, household, dating — state-defined)?",
        why: "If yes, switch this session to Divorce and choose the family protection-order matter — after confirming you want to clear the other area.",
        options: ["Possibly family / household", "Not a family relationship", "Unsure"],
      },
      {
        id: "confidential-cpo",
        prompt: "Do you need your address kept off the papers the other party sees?",
        why: "Many courts have a confidential-address form.",
        options: ["Yes", "No"],
      },
    ],
    documentChecklist: [
      "Local civil harassment / stalking / protection petition",
      "Affidavit of recent incidents with dates, places, and what happened",
      "Request for temporary (ex parte) relief if danger is immediate",
      "Confidential-address form if needed",
      "Copies of messages, photos, or police report numbers you can attach",
    ],
    evidenceIdeas: [
      { issue: "Incidents", examples: ["Dated narrative", "Texts", "Photos", "Police report numbers"] },
      { issue: "Identity / venue", examples: ["How you know the person", "Where the conduct happened"] },
    ],
    filingPathway: [
      "If you are in danger, call 911. National Domestic Violence Hotline: 1-800-799-7233.",
      "Ask the clerk whether this is a family packet or a civil harassment / stalking packet.",
      "Write recent, specific incidents. Courts need facts, not labels.",
      "Serve the other party the way the clerk instructs.",
      "Appear at the return hearing even if a temporary order was granted.",
    ],
    honesty: [
      ...honestyBase,
      "Violating a protection order can be a crime. Whitestone cannot file for you.",
    ],
    keywords: ["civil protection", "harassment", "stalking", "restraining", "no contact", "stay away"],
  },
  {
    id: "debt-collection",
    title: "Debt-collection defense (overview)",
    coverage: "procedural-overview",
    summary:
      "If a collector or debt buyer sues you, the summons has a short answer deadline. Ignoring it can become a default judgment and wage or bank collection. Federal law (including the FDCPA) limits some collector conduct; state exemptions protect some income and property. This is not advice on hiding assets or not paying a valid debt.",
    issueTree: [
      { id: "sued", label: "Is there already a lawsuit?" },
      { id: "who", label: "Original creditor vs. debt buyer" },
      { id: "amount", label: "Is the amount and owner of the debt proven?" },
      { id: "exemptions", label: "Exempt income / property (state-specific)" },
    ],
    questions: [
      {
        id: "papers-dc",
        prompt: "Have you been served with a lawsuit, or only collection letters / calls?",
        why: "A lawsuit has a court deadline. Letters are a different path.",
        options: ["Lawsuit / summons", "Letters or calls only", "Both", "Unsure"],
      },
      {
        id: "recognize",
        prompt: "Do you recognize this debt and the amount?",
        why: "Debt buyers sometimes sue on thin records. Do not admit facts you cannot check.",
        options: ["Yes, I recognize it", "Amount looks wrong", "I do not recognize it", "Unsure"],
      },
      {
        id: "income-dc",
        prompt: "Is your main income something courts often treat as exempt (SSI, some benefits, some wages)?",
        why: "Exemptions are state-specific. Ask legal aid before a garnishment hearing. Do not hide accounts.",
        options: ["Possibly exempt benefits", "Wages", "Mixed", "Unsure"],
      },
      {
        id: "answer-due",
        prompt: "If sued: do you know the deadline to file an answer?",
        why: "Calendar it the same day. Default is how many collection cases are won.",
        options: ["Yes", "Not yet", "No lawsuit"],
      },
    ],
    documentChecklist: [
      "Summons, complaint, and the envelope they arrived in",
      "Account statements or validation letters you already have",
      "Local answer / appearance form — filed on time",
      "Fee-waiver if you cannot pay",
      "Exemption claim forms if a garnishment or levy starts",
    ],
    evidenceIdeas: [
      { issue: "Who owns the debt", examples: ["Complaint exhibits", "Validation letter", "Original contract if you have it"] },
      { issue: "Payments / identity", examples: ["Your own statements", "Police report if you suspect identity theft"] },
    ],
    filingPathway: [
      "If you have a summons, read the answer date today and ask the clerk how to file an answer.",
      "Do not ignore court papers. A default can become a garnishment.",
      "Ask legal aid about validation, ownership of the debt, and exemptions.",
      "Federal collector-conduct rules do not by themselves dismiss a valid lawsuit.",
      "Whitestone will not help you hide assets, lie about income, or evade lawful process.",
    ],
    honesty: [
      ...honestyBase,
      "Not advice to dodge a lawful debt or conceal property from a court.",
    ],
    keywords: ["debt", "collection", "garnish", "fdcpa", "summons", "default", "collector", "debt buyer"],
  },
];
