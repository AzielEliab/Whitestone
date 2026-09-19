# Audit handoff — historical law dates + honesty scores

Author: **Aziel Eliab**. Product: Whitestone. Spec: `whitestone.honesty.v1` + `src/history/`.

This note is for a human auditor (or GitBaby CLEAR) taking over a session or reviewing a PR. Whitestone is **not a lawyer** and **not legal advice**. Scores are labeled. **Confidence is not truth.**

## What to copy out of a session (manually)

Whitestone does **not** export case files, chat, or evidence packages. If an auditor needs a handoff, they retype or screenshot from the live session **before End & erase**.

Collect:

1. Practice area, jurisdiction, matter
2. As-of year/month (`YYYY-MM`)
3. Stated outcome / official narrative (user-supplied)
4. Archival case or ruling facts (user-supplied)
5. Upload inventory: kind (`filing` | `evidence` | `historical_report` | `news_clipping`), filename, optional `sourceDate`, and whether text extracted
6. Honesty panel numbers (or UNKNOWN)
7. Seeded law bullets actually shown (citation + `effective_from` + source URL)
8. Advisor grounding verdict + session receipt SHA-256 (ephemeral)

## Historical law dates

Source of truth in the repo: `src/history/records.ts`.

Every `LawRecord` must have:

| Field | Rule |
| --- | --- |
| `jurisdiction` | Federal or a state hook |
| `kind` | `civil` or `criminal` |
| `citation` | Non-empty |
| `title` | Non-empty |
| `effective_from` | ISO date on or after 1776-07 |
| `effective_to` | Nullable end date |
| `event_type` | `enact` \| `amend` \| `repeal` \| `add` \| `remove` |
| `sourceTitle` + `sourceUrl` | HTTPS URL required; empty URL rejected in tests |
| `notes` | Honesty / coverage note |

Evaluation: `evaluateHistorical()` in `src/history/evaluate.ts`.

- Standing = in force as of the chosen month
- Later events are labeled **not yet in force**
- Missing state statute → **UNKNOWN**
- Invented form numbers / uncitable “the law said X in 1850” → **REFUSE**
- Corpus honesty: Whitestone does **not** ship a complete digitized U.S. law book since 1776

## Honesty scores

Evaluation: `evaluateHonesty()` / `honestyFromSession()` in `src/honesty/evaluate.ts`.

| Score | Meaning | When UNKNOWN |
| --- | --- | --- |
| `truth_buried` | Labeled divergence of dated independent uploads from the stated official outcome | No dated independent source, or no contradiction |
| `truth_overcame_lie` | Labeled later-dated independent upload that diverges from an earlier official line | No later-dated independent source |
| `honesty_overall` | Composite capped at 0.75 (ZionPattern / AZCoherence cap) | Insufficient dated sources + stated outcome + second layer |

**NO-LIE:** never invent a buried-truth claim without dated sources/uploads in the session.

Engine cites (ported, not invented):

- AZ-CLCE — https://github.com/AzielEliab/az-clce
- SPRE — https://github.com/AzielEliab/az-clce/blob/main/docs/spre.md
- PhysLing home — https://github.com/AzielEliab/aziel-corpus (lite slot only)
- Triad — https://github.com/AzielEliab/az-clce/blob/main/docs/triad.md (`aziel.triad.v0.3`)
- Triadscore — AKM-TRIAD-1.0 (posterior ≠ truth; no durable memory)
- ZionPattern — https://github.com/AzielEliab/zion-pattern-solver (75% cap)
- Lattice — ChainLock CL-WP-0.4 cite only; ephemeral session hashes; wipe with End & erase

## Suggested auditor table

```text
as_of            :
jurisdiction     :
stated_outcome   :
dated_uploads    : n=
truth_buried     : UNKNOWN | labeled 0–1
truth_overcame   : UNKNOWN | labeled 0–1
honesty_overall  : UNKNOWN | labeled 0–0.75
clce_triple      :
spre_pc          :
physling         : unverified | labeled
triad_final      : null unless all three verified
triadscore_3of4  : yes/no  posterior=
zion_display     : 0–75
lattice_tip      :
seeded_citations :
```

## Wipe

End & erase clears chat, uploads, web notes, as-of fields, archival notes, honesty lattice, and session receipts. The Worker must not persist case content.
