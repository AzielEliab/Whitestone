import type { TopicModule } from "../types";

const honestyBase = [
  "This is educational procedural structure, not legal advice and not a defense strategy.",
  "For any charge that could mean jail, a record, immigration harm, or a lost license, talk to a licensed lawyer or the public defender.",
  "Whitestone will not help commit a crime, destroy evidence, intimidate a witness, or evade arrest or court process.",
];

export const CRIMINAL_TOPICS: TopicModule[] = [
  {
    id: "bail-arraignment",
    title: "Bail / arraignment",
    coverage: "checklist",
    summary:
      "Arraignment is usually the first court appearance: charges are read, counsel is addressed, and the court may set release conditions or bail. Bail is a promise to return — not a fine. Missing court can add a warrant. This is process education, not a plan to beat a case.",
    issueTree: [
      { id: "counsel", label: "Lawyer or public defender" },
      { id: "release", label: "Release, conditions, or money bail" },
      { id: "charges", label: "What you are accused of (as written)" },
      { id: "next", label: "Next date and conditions" },
    ],
    questions: [
      {
        id: "lawyer-ba",
        prompt: "Do you already have a lawyer or a public-defender application pending?",
        why: "Ask for counsel at the first appearance if you cannot afford a lawyer. Do not discuss facts on this screen as if it were counsel.",
        options: ["Private lawyer", "Public defender / appointed", "Not yet", "Unsure"],
      },
      {
        id: "in-custody",
        prompt: "Are you (or the person you are helping) in custody, or already released?",
        why: "Custody changes how quickly arraignment and bail review happen.",
        options: ["In custody", "Released", "Not yet arrested", "Unsure"],
      },
      {
        id: "date-ba",
        prompt: "Do you have a court date written on papers or a website printout?",
        why: "Appear. If you cannot, contact the lawyer or the clerk before the date — do not just stay away.",
        options: ["Yes", "No", "Missed a date"],
      },
      {
        id: "conditions",
        prompt: "Were release conditions set (no-contact, testing, stay-away, travel)?",
        why: "Breaking conditions can mean re-arrest. Read the order.",
        options: ["Yes", "No", "Unsure"],
      },
    ],
    documentChecklist: [
      "Complaint, citation, or information if you have it",
      "Bail / release order and any no-contact conditions",
      "Public-defender application or lawyer contact",
      "Next court date in writing",
    ],
    evidenceIdeas: [
      { issue: "Identity and dates", examples: ["Citation", "Jail property sheet", "Court reminder text from the clerk"] },
      { issue: "Ties for release", examples: ["Proof of address or work you can show your lawyer — not a script to argue alone"] },
    ],
    filingPathway: [
      "If you cannot afford a lawyer, say so and ask for the public defender.",
      "Go to arraignment. Missing court can produce a warrant.",
      "Do not discuss the facts of the charge with anyone but your lawyer.",
      "Read every release condition the same day.",
      "Bail bonds and pretrial services are not Whitestone. Ask your lawyer what the local options are.",
      "Whitestone does not file appearances for you and does not negotiate bail.",
    ],
    honesty: [
      ...honestyBase,
      "If you missed court, contact counsel or the clerk promptly. Do not hide.",
    ],
    keywords: ["bail", "bond", "arraignment", "first appearance", "release", "pretrial", "warrant"],
  },
  {
    id: "discovery",
    title: "Discovery (criminal)",
    coverage: "procedural-overview",
    summary:
      "Discovery is how the defense learns what the prosecution may use: reports, videos, lab results, witness names in many systems. Rules and timing are local. You generally ask through counsel. This is not a guide to hide, alter, or destroy anything.",
    issueTree: [
      { id: "what", label: "What the state must disclose" },
      { id: "how", label: "How a pro se defendant requests it" },
      { id: "brady", label: "Favorable / impeachment information (overview)" },
      { id: "protect", label: "Protective orders and victim privacy" },
    ],
    questions: [
      {
        id: "counsel-d",
        prompt: "Is a lawyer handling discovery, or are you trying to request it yourself?",
        why: "Appointed counsel usually runs discovery. Pro se requests still go through the court's rules — not through Whitestone.",
        options: ["Lawyer is handling it", "I am pro se", "Unsure"],
      },
      {
        id: "have-reports",
        prompt: "Have you already received police reports, body-cam notices, or a discovery disk?",
        why: "Bring what you have to counsel. Do not post it online.",
        options: ["Yes", "Some", "Nothing yet"],
      },
      {
        id: "missing",
        prompt: "Is there a specific item you think exists (video, 911, lab)?",
        why: "Your lawyer can ask. Naming an item here does not obtain it.",
      },
    ],
    documentChecklist: [
      "Any discovery already served",
      "Local pro se discovery request form if the clerk publishes one",
      "Protective-order terms if the court issued them",
      "A list of questions for your lawyer — not a public post",
    ],
    evidenceIdeas: [
      { issue: "What you already have", examples: ["Discovery receipt", "Cover letter from the prosecutor"] },
    ],
    filingPathway: [
      "Ask counsel what has been received and what is still due.",
      "If you are truly pro se, ask the clerk whether there is a local discovery request packet.",
      "Do not contact witnesses to pressure them. That can be a new crime.",
      "Do not destroy phones, videos, or papers. Preserve what you have and give it to counsel.",
      "Brady / favorable-evidence ideas are for your lawyer to raise, not for a script on this screen.",
    ],
    honesty: honestyBase,
    keywords: ["discovery", "brady", "police report", "body cam", "disclosure", "evidence"],
  },
  {
    id: "plea",
    title: "Plea process (overview)",
    coverage: "procedural-overview",
    summary:
      "A plea is a formal answer to a charge: not guilty, guilty, or in some courts nolo / no contest or an Alford-style plea where allowed. A plea bargain trades a possible result for a known one — with immigration, license, and later-record consequences a screen cannot list. Urge counsel before you plead.",
    issueTree: [
      { id: "types", label: "Types of plea" },
      { id: "colloquy", label: "The judge's questions (knowing, voluntary)" },
      { id: "deal", label: "Offers vs. going to trial" },
      { id: "consequences", label: "Collateral consequences (overview)" },
    ],
    questions: [
      {
        id: "offered",
        prompt: "Has the prosecutor made a written or spoken offer?",
        why: "Only your lawyer should evaluate an offer against the evidence.",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "citizen",
        prompt: "Could immigration, a professional license, or a firearm right be at stake?",
        why: "These are reasons to get counsel even on a 'small' charge.",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "understand",
        prompt: "Do you understand that a guilty or no-contest plea is usually a conviction?",
        why: "Judges ask whether the plea is knowing and voluntary. Whitestone cannot stand beside you.",
        options: ["Yes", "I need this explained in court", "Unsure"],
      },
    ],
    documentChecklist: [
      "Written plea offer if one exists",
      "Charge document (complaint / information / indictment)",
      "Any immigration or license questions written down for counsel",
      "Do not sign a plea form because this app listed steps",
    ],
    evidenceIdeas: [
      { issue: "What was offered", examples: ["Email or paper offer from the prosecutor given to your lawyer"] },
    ],
    filingPathway: [
      "Talk to a lawyer or public defender before you accept or reject an offer.",
      "Ask what the plea will be on your record and what rights you give up.",
      "If you are not a U.S. citizen, say so to counsel before any plea.",
      "A plea in court is on the record. This screen is not a plea.",
      "Whitestone will not coach you to hide facts from the judge.",
    ],
    honesty: honestyBase,
    keywords: ["plea", "guilty", "bargain", "nolo", "no contest", "offer", "colloquy"],
  },
  {
    id: "sentencing",
    title: "Sentencing basics",
    coverage: "procedural-overview",
    summary:
      "Sentencing happens after a plea or a guilty verdict. Courts look at the charge, any guideline or statute range, prior record, and arguments from both sides. Victim statements may be allowed. This is not a prediction of your sentence and not a mitigation mill.",
    issueTree: [
      { id: "range", label: "Statutory or guideline range (local)" },
      { id: "priors", label: "Prior record" },
      { id: "allocution", label: "Your chance to speak (with counsel)" },
      { id: "after", label: "Probation, fines, restitution, appeal clock" },
    ],
    questions: [
      {
        id: "stage-s",
        prompt: "Has there already been a plea or verdict, or is sentencing still ahead?",
        why: "Pre-sentence reports and dates are local.",
        options: ["Sentencing is set", "Plea or trial not done", "Unsure"],
      },
      {
        id: "psr",
        prompt: "Has a pre-sentence report or similar packet been mentioned?",
        why: "Your lawyer usually reviews it for errors. Do not treat an online summary as the report.",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "goals-s",
        prompt: "What do you need explained (probation, fines, jail, restitution, appeal time)?",
        why: "Whitestone can name topics. Only counsel and the judgment control the result.",
      },
    ],
    documentChecklist: [
      "Judgment and sentence when issued",
      "Probation or supervised-release conditions",
      "Restitution order if any",
      "Notice of appeal deadline — ask counsel the same day",
    ],
    evidenceIdeas: [
      { issue: "Mitigation for counsel", examples: ["Treatment letters", "Work history — given to your lawyer, not invented here"] },
    ],
    filingPathway: [
      "Review any pre-sentence report with counsel.",
      "Ask what the maximum and any mandatory minimums are — from counsel, not from this app.",
      "If you will speak, plan it with your lawyer. Do not admit new crimes on the record without advice.",
      "Calendar probation conditions and any appeal deadline the day of sentencing.",
    ],
    honesty: [
      ...honestyBase,
      "Whitestone does not score a guidelines range or promise probation.",
    ],
    keywords: ["sentencing", "probation", "guidelines", "restitution", "allocution", "prison"],
  },
  {
    id: "expungement",
    title: "Expungement / record relief (overview)",
    coverage: "procedural-overview",
    summary:
      "Expungement, sealing, or set-aside is a later civil-style petition to limit who can see a record. Eligibility, waiting periods, and which charges qualify are state-specific. Many convictions and pending cases do not qualify. This is an overview — not a guarantee and not a pardon mill.",
    issueTree: [
      { id: "what-record", label: "Arrest only vs. conviction vs. dismissal" },
      { id: "wait", label: "Waiting period and remaining conditions" },
      { id: "packet", label: "Local petition and fingerprints" },
      { id: "effect", label: "What 'expunged' still shows to some employers / licenses / immigration" },
    ],
    questions: [
      {
        id: "outcome-ex",
        prompt: "What happened in the case (dismissal, diversion complete, conviction, still open)?",
        why: "Open cases and many convictions are not eligible. Do not guess.",
        options: ["Dismissed / acquitted", "Diversion completed", "Conviction / plea", "Still open", "Unsure"],
      },
      {
        id: "when-ex",
        prompt: "About how long since the case ended?",
        why: "Waiting periods are local. Whitestone will not invent yours.",
      },
      {
        id: "goal-ex",
        prompt: "Is the goal housing, a job, a license, or immigration paperwork?",
        why: "Some audiences can still see sealed records. Ask counsel or the clinic that files these petitions.",
        options: ["Job / housing", "License", "Immigration", "Personal", "Unsure"],
      },
    ],
    documentChecklist: [
      "Certified disposition or docket printout from the clerk",
      "Local expungement / sealing packet",
      "Fingerprint or background forms if required",
      "Proof that fines, restitution, or probation are complete if the statute requires it",
    ],
    evidenceIdeas: [
      { issue: "Identity of the case", examples: ["Case number", "Disposition", "RAP sheet you lawfully have"] },
    ],
    filingPathway: [
      "Get the official disposition from the clerk before you write a petition.",
      "Ask whether this court uses 'expungement,' 'sealing,' or 'set-aside' — the words are not the same.",
      "Read the waiting-period and eligible-offense lists on the official packet.",
      "Immigration and some licenses may still see the record. Ask a lawyer if that is your goal.",
      "Whitestone does not file the petition or certify eligibility.",
    ],
    honesty: honestyBase,
    keywords: ["expungement", "expunge", "seal", "set aside", "record relief", "rap sheet"],
  },
  {
    id: "rights-education",
    title: "Rights education",
    coverage: "procedural-overview",
    summary:
      "People facing the government generally have the right to remain silent, the right to a lawyer, and the right to a public trial on many charges. You can ask for a lawyer and stop answering questions. This is civic education — not a script for an interrogation and not permission to resist a lawful arrest.",
    issueTree: [
      { id: "silence", label: "Silence and counsel" },
      { id: "search", label: "Searches and warrants (overview)" },
      { id: "court", label: "Appearances and appointed counsel" },
      { id: "refuse", label: "What Whitestone will not do" },
    ],
    questions: [
      {
        id: "stage-r",
        prompt: "Are you dealing with police contact, a pending case, or general education?",
        why: "If officers want to question you about a crime, ask for a lawyer and wait.",
        options: ["Police contact now or recent", "Pending case", "General education"],
      },
      {
        id: "talked",
        prompt: "Have you already given a statement?",
        why: "Tell your lawyer what was said. Do not try to 'fix' it through this app.",
        options: ["Yes", "No", "Unsure"],
      },
      {
        id: "serious",
        prompt: "Could this involve jail, a felony, or immigration risk?",
        why: "Urge appointed or hired counsel. Do not rely on a website.",
        options: ["Yes", "Possibly", "I think not", "Unsure"],
      },
    ],
    documentChecklist: [
      "Lawyer or public-defender contact",
      "Any citation or charging paper",
      "A written note of dates and badge / case numbers — for counsel, not social media",
    ],
    evidenceIdeas: [
      { issue: "What happened", examples: ["Your own dated notes for your lawyer"] },
    ],
    filingPathway: [
      "You may say you want a lawyer and that you will remain silent.",
      "Do not physically resist a lawful arrest. That can be a new charge.",
      "Do not destroy phones or papers. Do not contact witnesses to scare them.",
      "Appear in court. Ask for counsel if you cannot afford one.",
      "Social media is not confidential. Talk to a lawyer, not a comment thread.",
    ],
    honesty: honestyBase,
    keywords: ["rights", "miranda", "silent", "lawyer", "counsel", "fifth", "sixth", "search"],
  },
];
