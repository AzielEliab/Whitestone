import { getJurisdiction } from "../knowledge";
import type { MatterType } from "../types";
import { classifyUrl, isAllowedUrl } from "./allowlist";
import { STATUTE_HINT } from "./should-fetch";
import { MAX_SOURCES, type ResearchInput, type ResearchSeed } from "./types";

interface ExtraSeed {
  url: string;
  title: string;
  matters?: MatterType[];
  keywords?: string[];
}

/** Curated extras — official or legal-aid family pages. Prefer clerk packets over these. */
const STATE_EXTRAS: Partial<Record<string, ExtraSeed[]>> = {
  CA: [
    { url: "https://selfhelp.courts.ca.gov/divorce", title: "California Courts Self-Help — Divorce or separation", matters: ["divorce", "legal-separation"] },
    { url: "https://selfhelp.courts.ca.gov/child-custody", title: "California Courts Self-Help — Child custody", matters: ["custody", "parenting-time"] },
    { url: "https://selfhelp.courts.ca.gov/child-support", title: "California Courts Self-Help — Child support", matters: ["child-support"] },
    { url: "https://selfhelp.courts.ca.gov/domestic-violence", title: "California Courts Self-Help — Domestic violence", matters: ["protection-order"] },
    { url: "https://selfhelp.courts.ca.gov/parentage", title: "California Courts Self-Help — Parentage", matters: ["paternity"] },
    { url: "https://selfhelp.courts.ca.gov/guardianship", title: "California Courts Self-Help — Guardianship", matters: ["guardianship"] },
    { url: "https://selfhelp.courts.ca.gov/adoption", title: "California Courts Self-Help — Adoption", matters: ["adoption"] },
    { url: "https://selfhelp.courts.ca.gov/name-change", title: "California Courts Self-Help — Change your name", matters: ["name-change"] },
  ],
  NY: [
    { url: "https://www.nycourts.gov/courthelp/Family/index.shtml", title: "NY CourtHelp — Family" },
    { url: "https://www.nycourts.gov/courthelp/Family/divorce.shtml", title: "NY CourtHelp — Divorce", matters: ["divorce"] },
    { url: "https://www.nycourts.gov/courthelp/Family/custody.shtml", title: "NY CourtHelp — Custody", matters: ["custody", "parenting-time"] },
    { url: "https://www.nycourts.gov/courthelp/Family/support.shtml", title: "NY CourtHelp — Child support", matters: ["child-support"] },
  ],
  TX: [{ url: "https://texaslawhelp.org/family-divorce-children", title: "Texas Law Help — Family, divorce & children" }],
  IL: [{ url: "https://www.illinoislegalaid.org/", title: "Illinois Legal Aid Online" }],
  MA: [{ url: "https://www.masslegalhelp.org/", title: "Massachusetts Legal Help" }],
  WA: [{ url: "https://www.washingtonlawhelp.org/", title: "Washington Law Help" }],
  OR: [{ url: "https://oregonlawhelp.org/", title: "Oregon Law Help" }],
  MD: [{ url: "https://www.peoples-law.org/", title: "Maryland People's Law Library" }],
};

const FEDERAL_SEEDS: ExtraSeed[] = [
  { url: "https://www.lawhelp.org/", title: "LawHelp — find legal aid and public guides" },
  {
    url: "https://www.usa.gov/child-support",
    title: "USA.gov — Child support",
    matters: ["child-support"],
    keywords: ["child support", "iv-d"],
  },
  {
    url: "https://www.acf.hhs.gov/css",
    title: "HHS/ACF — Office of Child Support Services",
    matters: ["child-support"],
    keywords: ["child support", "iv-d"],
  },
  {
    url: "https://www.justice.gov/ovw",
    title: "DOJ Office on Violence Against Women",
    matters: ["protection-order"],
    keywords: ["protect", "restrain", "violence", "safety"],
  },
  {
    url: "https://www.childwelfare.gov/",
    title: "Child Welfare Information Gateway",
    matters: ["adoption", "guardianship"],
    keywords: ["adoption", "icpc", "foster"],
  },
  {
    url: "https://www.law.cornell.edu/wex/family_law",
    title: "Cornell LII Wex — Family law",
    keywords: ["family law", "overview"],
  },
  { url: "https://www.law.cornell.edu/wex/divorce", title: "Cornell LII Wex — Divorce", matters: ["divorce"] },
  { url: "https://www.law.cornell.edu/wex/child_custody", title: "Cornell LII Wex — Child custody", matters: ["custody", "parenting-time"] },
  { url: "https://www.law.cornell.edu/wex/child_support", title: "Cornell LII Wex — Child support", matters: ["child-support"] },
  { url: "https://www.law.cornell.edu/wex/alimony", title: "Cornell LII Wex — Alimony", matters: ["spousal-support"] },
  { url: "https://www.law.cornell.edu/wex/paternity", title: "Cornell LII Wex — Paternity", matters: ["paternity"] },
  { url: "https://www.law.cornell.edu/wex/adoption", title: "Cornell LII Wex — Adoption", matters: ["adoption"] },
  { url: "https://www.law.cornell.edu/wex/guardianship", title: "Cornell LII Wex — Guardianship", matters: ["guardianship"] },
  {
    url: "https://www.law.cornell.edu/wex/restraining_order",
    title: "Cornell LII Wex — Restraining order",
    matters: ["protection-order"],
  },
  {
    url: "https://www.law.cornell.edu/wex/uniform_child-custody_jurisdiction_and_enforcement_act",
    title: "Cornell LII Wex — UCCJEA",
    matters: ["custody", "parenting-time"],
    keywords: ["uccjea", "home state", "interstate"],
  },
];

function justiaStateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
}

function toSeed(url: string, title: string): ResearchSeed | null {
  const match = classifyUrl(url);
  if (!match || !isAllowedUrl(url)) return null;
  return { url, title, kind: match.kind, label: match.label };
}

function extraMatches(extra: ExtraSeed, input: ResearchInput): boolean {
  const q = input.query.toLowerCase();
  if (extra.matters?.length) {
    if (input.matter && extra.matters.includes(input.matter)) return true;
    if (extra.keywords?.some((k) => q.includes(k.toLowerCase()))) return true;
    return false;
  }
  if (extra.keywords?.length) return extra.keywords.some((k) => q.includes(k.toLowerCase()));
  return true;
}

export function selectSeeds(input: ResearchInput, limit = MAX_SOURCES): ResearchSeed[] {
  const scored: { seed: ResearchSeed; score: number }[] = [];
  const q = input.query.toLowerCase();
  const j = getJurisdiction(input.jurisdiction);

  const push = (url: string, title: string, score: number) => {
    const seed = toSeed(url, title);
    if (!seed) return;
    scored.push({ seed, score });
  };

  if (j) {
    push(j.selfHelpUrl, `${j.name} court / self-help portal`, 24);
    for (const extra of STATE_EXTRAS[j.code] ?? []) {
      if (extraMatches(extra, input)) push(extra.url, extra.title, 20);
    }
  }

  for (const fed of FEDERAL_SEEDS) {
    if (!extraMatches(fed, input) && fed.matters) continue;
    if (fed.matters && !input.matter && !fed.keywords?.some((k) => q.includes(k.toLowerCase()))) {
      if (fed.url !== "https://www.lawhelp.org/") continue;
    }
    let score = 8;
    if (input.matter && fed.matters?.includes(input.matter)) score += 6;
    if (fed.keywords?.some((k) => q.includes(k.toLowerCase()))) score += 3;
    push(fed.url, fed.title, score);
  }

  if (STATUTE_HINT.test(input.query) && j) {
    push(
      `https://law.justia.com/codes/${justiaStateSlug(j.name)}/`,
      `Justia unofficial ${j.name} codes index`,
      10,
    );
  }

  const seen = new Set<string>();
  return scored
    .sort((a, b) => b.score - a.score)
    .map((row) => row.seed)
    .filter((seed) => {
      const key = seed.url.replace(/\/+$/, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
