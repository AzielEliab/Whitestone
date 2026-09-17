import { TOPIC_BY_ID } from "../knowledge";
import type { EvidenceFile, EvidenceMapping, MatterType } from "../types";

const ISSUE_PATTERNS: { issueId: string; label: string; re: RegExp; allegation: string }[] = [
  {
    issueId: "safety",
    label: "Safety / family violence",
    re: /\b(violen|abuse|hit|threat|stalk|restrain|bruise|weapon|afraid|police report)\b/i,
    allegation: "The excerpt may support a safety or protection-related allegation. Verify dates and keep originals.",
  },
  {
    issueId: "income",
    label: "Income / ability to pay",
    re: /\b(paystub|w-?2|1099|salary|wages|income|overtime|bonus|unemployment|tax return)\b/i,
    allegation: "The excerpt may support income for a support worksheet. Use the official guideline, not a guess.",
  },
  {
    issueId: "residency",
    label: "Residency / venue",
    re: /\b(lease|utility|resident|domicile|driver.?s? license|lived in|address)\b/i,
    allegation: "The excerpt may help show residency or venue. Confirm the clerk's time requirement.",
  },
  {
    issueId: "parenting",
    label: "Caregiving / parenting time",
    re: /\b(school|pickup|overnight|visitation|parenting|homework|pediatric|daycare|exchange)\b/i,
    allegation: "The excerpt may support a caregiving or schedule fact. Tie it to a proposed calendar.",
  },
  {
    issueId: "property",
    label: "Property / debt",
    re: /\b(mortgage|deed|title|401k|ira|account ending|loan|credit card|vin )\b/i,
    allegation: "The excerpt may belong on a property-or-debt disclosure. Do not hide accounts from the court.",
  },
  {
    issueId: "parentage",
    label: "Parentage",
    re: /\b(birth certificate|acknowledgment|paternity|genetic|dna|father|mother)\b/i,
    allegation: "The excerpt may relate to legal parentage. Do not sign a new acknowledgment if a test is still needed.",
  },
  {
    issueId: "existing-order",
    label: "Existing order",
    re: /\b(order dated|decree|judgment|case no|docket|cause no)\b/i,
    allegation: "The excerpt may show an existing order. Another court usually cannot rewrite it casually.",
  },
];

export function mapEvidence(files: EvidenceFile[], matter: MatterType | null): EvidenceMapping[] {
  const topic = matter ? TOPIC_BY_ID[matter] : undefined;
  const mappings: EvidenceMapping[] = [];

  for (const file of files) {
    const hay = `${file.name}\n${file.note}\n${file.text}`.slice(0, 20000);
    let matched = false;
    for (const pat of ISSUE_PATTERNS) {
      const m = hay.match(pat.re);
      if (!m) continue;
      matched = true;
      const idx = hay.toLowerCase().indexOf(m[0].toLowerCase());
      const start = Math.max(0, idx - 80);
      const snippet = hay.slice(start, start + 180).replace(/\s+/g, " ").trim();
      mappings.push({
        evidenceId: file.id,
        fileName: file.name,
        snippet,
        issueId: pat.issueId,
        issueLabel: pat.label,
        allegation: pat.allegation,
      });
    }
    if (!matched && topic) {
      mappings.push({
        evidenceId: file.id,
        fileName: file.name,
        snippet: (file.note || file.text || file.name).slice(0, 160),
        issueId: "general",
        issueLabel: `${topic.title} — review`,
        allegation:
          "No automatic keyword match. Add a short note on the file describing what fact it proves.",
      });
    }
  }
  return mappings.slice(0, 40);
}
