/**
 * why / who / what / how / when + independent vs on-behalf-of.
 * UNKNOWN when not evidenced. Does not invent names. Author: Aziel Eliab.
 */
import { extractDatesFromText } from "../honesty/dates";
import { join } from "../honesty/tokens";

export interface ActorSlot {
  name: string | null;
  role: "independent" | "on_behalf_of" | "UNKNOWN";
  behalfOf: string | null;
  source: string | null;
  note: string;
}

export interface FiveW {
  why: string;
  who: ActorSlot[];
  what: string;
  how: string;
  when: string | null;
  independent_or_behalf: ActorSlot;
}

const BEHALF_RE =
  /\b(?:on behalf of|acting for|agent of|employee of|officer of|attorney for|spokesman for|spokeswoman for)\s+([A-Z][\w.'-]{1,40}(?:\s+[A-Z][\w.'-]{1,40}){0,3})/i;
const INDEPENDENT_RE = /\b(independent|civilian witness|unaffiliated|private citizen)\b/i;
const NAME_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\b/;

export function extractFiveW(opts: {
  official?: string;
  stated?: string;
  archival?: string;
  uploadsText?: string;
  asOfIso?: string | null;
}): FiveW {
  const blob = join([opts.official, opts.stated, opts.archival, opts.uploadsText]);
  const dates = extractDatesFromText(blob);
  const when = opts.asOfIso ?? dates[0]?.iso ?? null;

  const behalf = blob.match(BEHALF_RE);
  const independent = INDEPENDENT_RE.test(blob);
  let name: string | null = null;
  const named = blob.match(NAME_RE);
  if (named && named[1] && named[1].length > 3 && !/^(Official|Independent|January|September)/.test(named[1])) {
    name = named[1];
  }

  const actor: ActorSlot = behalf
    ? {
        name,
        role: "on_behalf_of",
        behalfOf: behalf[1] ?? null,
        source: "session-text",
        note: name
          ? `${name} appears to act on behalf of ${behalf[1]}. Labeled from session text — not a finding of agency.`
          : `A party is described as acting on behalf of ${behalf[1]}. Name UNKNOWN.`,
      }
    : independent && name
      ? {
          name,
          role: "independent",
          behalfOf: null,
          source: "session-text",
          note: `${name} is labeled independent from session wording. Not a court finding.`,
        }
      : {
          name,
          role: "UNKNOWN",
          behalfOf: null,
          source: null,
          note: "UNKNOWN — will not invent who acted or on whose behalf without session text.",
        };

  return {
    why: blob.trim()
      ? "Compare stated outcomes to hashchained uploads and allowlisted public pages. Educational / archival."
      : "UNKNOWN — no stated case facts yet.",
    who: actor.name || actor.behalfOf ? [actor] : [],
    what: (opts.stated || opts.official || "").trim().slice(0, 280) || "UNKNOWN — no stated outcome.",
    how: "Labeled scores from session materials + optional allowlisted fetches. No third-party LLM. Confidence cap 0.75.",
    when,
    independent_or_behalf: actor,
  };
}
