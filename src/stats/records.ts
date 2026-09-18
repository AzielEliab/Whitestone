import type { StatRecord } from "./types";
import { assertStatRecord } from "./types";

/** Bundled citations only. Every row has a public source URL. Do not invent figures. */
export const STAT_RECORDS: StatRecord[] = [
  {
    id: "census-custodial-parents-2018",
    area: "divorce",
    topic: "custody-household",
    claim:
      "In April 2018, 12.9 million custodial parents lived with 21.9 million children under 21 whose other parent lived elsewhere. About 79.9% of those custodial parents were mothers and 20.1% were fathers.",
    value: "79.9% mothers / 20.1% fathers among 12.9 million custodial parents",
    unit: "share of custodial parents (household living arrangements)",
    year: 2018,
    geography: "United States (national CPS-CSS)",
    sourceTitle: "U.S. Census Bureau, Custodial Mothers and Fathers and Their Child Support: 2017 (P60-269)",
    sourceUrl: "https://www.census.gov/library/publications/2020/demo/p60-269.html",
    notes:
      "This is a household / living-arrangement series, not a count of who 'won' a litigated custody trial. Many families never file a contested custody case. Do not treat the 80/20 split as a court win-rate or as gender advocacy. State courts rarely publish custody outcomes by parent gender.",
  },
  {
    id: "census-support-agreement-2018",
    area: "divorce",
    topic: "support-receipt",
    claim:
      "Among those 12.9 million custodial parents, 49.4% had a court order, award, or other agreement to receive child support. Of the 6.4 million with an agreement, 88.2% said it was a formal legal order.",
    value: "49.4% of custodial parents had a support agreement",
    unit: "percent of custodial parents",
    year: 2018,
    geography: "United States (national CPS-CSS; support dollars are 2017)",
    sourceTitle: "U.S. Census Bureau, Custodial Mothers and Fathers and Their Child Support: 2017 (P60-269)",
    sourceUrl: "https://www.census.gov/content/dam/Census/library/publications/2020/demo/p60-269.pdf",
    notes:
      "Having an agreement is not the same as receiving the full amount. Census reports receipt separately. This is national survey data, not your state's IV-D dashboard.",
  },
  {
    id: "cdc-divorce-rate-2022",
    area: "divorce",
    topic: "divorce-rate",
    claim:
      "For 2022, CDC/NCHS published a provisional national divorce-and-annulment rate of 2.4 per 1,000 population (673,989 divorces and annulments in reporting states) and a marriage rate of 6.2 per 1,000.",
    value: "2.4 divorces/annulments per 1,000 population",
    unit: "crude rate per 1,000 population",
    year: 2022,
    geography: "United States (reporting states; divorce population base excludes some non-reporting states)",
    sourceTitle: "CDC/NCHS, National marriage and divorce rate trends, 2000–2022",
    sourceUrl: "https://www.cdc.gov/nchs/data/dvs/marriage-divorce/national-marriage-divorce-rates-00-22.pdf",
    notes:
      "Crude rates are not the chance your marriage will end. Several states do not report divorces to NCHS in some years. State-specific rates are published separately by CDC.",
  },
  {
    id: "lsc-justice-gap-2022",
    area: "divorce",
    topic: "pro-se",
    claim:
      "Legal Services Corporation's Justice Gap 2022 study reported that 92% of the civil legal problems experienced by low-income Americans in the prior year received inadequate or no legal help.",
    value: "92% of reported civil legal problems of low-income Americans received inadequate or no legal help",
    unit: "percent of problems (survey)",
    year: 2022,
    geography: "United States (low-income households in the LSC study)",
    sourceTitle: "Legal Services Corporation, The Justice Gap 2022",
    sourceUrl: "https://www.lsc.gov/initiatives/justice-gap-report",
    notes:
      "This is unmet civil legal need, not a courtroom pro se rate and not a gender-specific family-court statistic. Many family litigants are self-represented; complete national pro se rates by parent gender are not published in this source.",
  },
  {
    id: "family-prose-methodology",
    area: "divorce",
    topic: "methodology",
    claim:
      "No single national statistic published here is a 'mothers vs fathers win rate' in contested custody. State court statistical reports often omit gender of the self-represented parent. When a state figure is missing, Whitestone shows national or comparable public data and says so.",
    value: "not a custody win-rate",
    unit: "methodology note",
    year: 2020,
    geography: "National / varies by court",
    sourceTitle: "National Center for State Courts — Self-represented litigants (information hub)",
    sourceUrl: "https://www.ncsc.org/information-and-resources/self-represented-litigants",
    notes:
      "Use clerk or state court statistical reports for local SRL counts. Pro se counts are often undercounted (partial representation, later counsel, or unrecorded status).",
  },
  {
    id: "bjs-fdluc09-plea",
    area: "criminal",
    topic: "plea",
    claim:
      "In the BJS State Court Processing Statistics sample of felony cases filed in May 2009 in the 75 largest counties, 66% of cases adjudicated within one year resulted in a conviction. BJS reported that nearly all of those convictions were the result of a guilty plea rather than a trial.",
    value: "66% adjudicated cases convicted; nearly all convictions by guilty plea",
    unit: "percent of adjudicated felony cases (75 largest counties)",
    year: 2009,
    geography: "75 largest U.S. counties (not every state court)",
    sourceTitle: "BJS, Felony Defendants in Large Urban Counties, 2009 — Statistical Tables",
    sourceUrl: "https://bjs.ojp.gov/content/pub/pdf/fdluc09.pdf",
    notes:
      "This is not a prediction that you will be convicted or should plead. Urban-county 2009 data. State and federal systems differ. Talk to a lawyer or public defender about your charge.",
  },
  {
    id: "bjs-fdluc09-pretrial",
    area: "criminal",
    topic: "pretrial",
    claim:
      "In that same 2009 large-urban-county sample, 62% of felony defendants were released prior to case disposition and an estimated 38% were detained until disposition.",
    value: "62% released pretrial / 38% detained until disposition",
    unit: "percent of felony defendants",
    year: 2009,
    geography: "75 largest U.S. counties",
    sourceTitle: "BJS, Felony Defendants in Large Urban Counties, 2009 — Statistical Tables",
    sourceUrl: "https://bjs.ojp.gov/library/publications/felony-defendants-large-urban-counties-2009-statistical-tables",
    notes:
      "Release practices have changed in some states since 2009. This is not your bail hearing. Detention is not a finding of guilt.",
  },
  {
    id: "fbi-ucr-2019-clearance",
    area: "criminal",
    topic: "clearance",
    claim:
      "In Crime in the United States, 2019, the FBI reported nationwide clearance rates of 61.4% for murder and nonnegligent manslaughter, 52.3% for aggravated assault, 32.9% for rape (revised definition), 30.5% for robbery, and 17.2% for property crime.",
    value: "Murder 61.4%; property crime 17.2% cleared (2019 UCR)",
    unit: "percent of reported offenses cleared",
    year: 2019,
    geography: "United States (UCR participating agencies)",
    sourceTitle: "FBI, Crime in the United States 2019 — Clearances",
    sourceUrl: "https://ucr.fbi.gov/crime-in-the-u.s/2019/crime-in-the-u.s.-2019/topic-pages/clearances",
    notes:
      "Clearance is an agency bookkeeping category (arrest or exceptional clearance), not a conviction. The FBI later shifted to NIBRS; later dashboards are not the same series. Not a prediction about any charge.",
  },
  {
    id: "bjs-indigent-defense-2007",
    area: "criminal",
    topic: "indigent-defense",
    claim:
      "BJS documented state-administered public defender programs and their structure in State Public Defender Programs, 2007. Caseloads vary widely; Whitestone does not invent a current national caseload average.",
    value: "state public-defender programs documented (structure, not a 2026 caseload)",
    unit: "program census (2007)",
    year: 2007,
    geography: "U.S. states with state-administered defender programs",
    sourceTitle: "BJS, State Public Defender Programs, 2007",
    sourceUrl: "https://bjs.ojp.gov/library/publications/state-public-defender-programs-2007",
    notes:
      "Use this as context that appointed counsel systems exist and are strained in many places. For a caseload standard (not a measured average), see the ABA Ten Principles of a Public Defense Delivery System — a standard, not BJS fieldwork.",
  },
  {
    id: "expungement-no-national-rate",
    area: "criminal",
    topic: "expungement",
    claim:
      "BJS does not publish a single national 'percent of people eligible for expungement' figure in the bundled set. Eligibility is statute-by-statute. Ask the clerk or counsel which relief exists in this state.",
    value: "no single national eligibility rate in this bundle",
    unit: "methodology note",
    year: 2024,
    geography: "United States (varies by state)",
    sourceTitle: "USA.gov — Criminal records",
    sourceUrl: "https://www.usa.gov/criminal-record",
    notes:
      "Some states publish sealing/expungement counts in annual reports. If your state figure is not listed here, Whitestone will say so rather than invent one.",
  },
  {
    id: "pew-debt-collection-2020",
    area: "civil",
    topic: "debt-collection",
    claim:
      "Pew's 2020 report on debt collection in state courts found that from 1993 to 2013 the number of debt-collection suits more than doubled nationally, and that by 2013 debt collection had become the most common type of civil litigation in the United States.",
    value: "Debt collection most common U.S. civil case type by 2013; volume more than doubled 1993–2013",
    unit: "national civil caseload composition (Pew synthesis of court data)",
    year: 2013,
    geography: "United States (Pew analysis of state-court data)",
    sourceTitle: "Pew Charitable Trusts, How Debt Collectors Are Transforming the Business of State Courts (2020)",
    sourceUrl:
      "https://www.pewtrusts.org/en/research-and-analysis/reports/2020/05/how-debt-collectors-are-transforming-the-business-of-state-courts",
    notes:
      "This is not a prediction you will lose or should default. Many collection cases end in default in some courts — that is a published pattern, not your outcome. Check the answer deadline on the summons.",
  },
  {
    id: "ncsc-civil-landscape-2015",
    area: "civil",
    topic: "small-claims",
    claim:
      "NCSC's Landscape of Civil Litigation in State Courts (2015) studied civil caseloads in selected counties and documented that contract matters (including debt) dominated many general-civil dockets and that trials were rare. It is a selected-court study, not a census of every small-claims court.",
    value: "Contract-heavy civil dockets; trials rare (selected counties)",
    unit: "study finding (not a nationwide rate)",
    year: 2015,
    geography: "Selected U.S. counties in the NCSC study",
    sourceTitle: "NCSC, The Landscape of Civil Litigation in State Courts (2015)",
    sourceUrl: "https://www.ncsc.org/__data/assets/pdf_file/0020/13376/civiljusticereport-2015.pdf",
    notes:
      "Small-claims dollar caps and volumes are local. Ask the clerk for this court's limit and recent filing counts. NCSC's Court Statistics Project publishes later caseload tables by participating states.",
  },
  {
    id: "cfpb-complaints-debt",
    area: "civil",
    topic: "debt-collection",
    claim:
      "The CFPB Consumer Complaint Database is a public, continuously updated set of consumer complaints. Debt collection is consistently among the high-volume products. Whitestone does not freeze a live daily total here.",
    value: "Debt collection is a high-volume CFPB complaint product (live database)",
    unit: "complaint volume (check the live table for the current count)",
    year: 2024,
    geography: "United States (complaints submitted to CFPB)",
    sourceTitle: "CFPB Consumer Complaint Database",
    sourceUrl: "https://www.consumerfinance.gov/data-research/consumer-complaints/",
    notes:
      "Complaints are not adjudicated findings and are not a win/loss rate in court.",
  },
  {
    id: "ncsc-housing-csp",
    area: "civil",
    topic: "housing",
    claim:
      "Landlord-tenant / housing caseloads are published by some states through the NCSC Court Statistics Project. There is no single bundled national eviction-filing total in this table. If your state is not in a cited annual report, Whitestone will say so.",
    value: "state-by-state housing caseloads via CSP (no invented national total)",
    unit: "methodology / landing page",
    year: 2024,
    geography: "Participating state courts",
    sourceTitle: "NCSC Court Statistics Project",
    sourceUrl: "https://www.courtstatistics.org/",
    notes:
      "Eviction notice periods and 'just cause' rules are local. Illegal lockouts are a different issue from filed unlawful-detainer statistics.",
  },
  {
    id: "lsc-justice-gap-civil",
    area: "civil",
    topic: "civil-access",
    claim:
      "The same LSC Justice Gap 2022 finding — 92% of civil legal problems of low-income Americans received inadequate or no legal help — applies to housing, consumer, and family problems in that survey.",
    value: "92% inadequate or no legal help (low-income civil problems)",
    unit: "percent of problems (survey)",
    year: 2022,
    geography: "United States (LSC Justice Gap study)",
    sourceTitle: "Legal Services Corporation, The Justice Gap 2022",
    sourceUrl: "https://justicegap.lsc.gov/",
    notes:
      "This is access-to-counsel context, not a small-claims win rate.",
  },
];

for (const record of STAT_RECORDS) assertStatRecord(record);
