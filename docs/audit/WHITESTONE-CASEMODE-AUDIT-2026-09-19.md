# Whitestone audit — historical laws + Case Mode scoring

**Date:** 2026-09-19  
**Auditor:** Cursor cloud agent on operator request  
**Product:** Whitestone (`AzielEliab/Whitestone`)  
**Author identity:** Aziel Eliab  
**Tip audited:** PR **#8** still open — `cursor/anti-corruption-honesty-eval-26ab` @ `da20270` (TrajectoryLock triangle), rebased on `main` `c4df84d` (includes historical as-of #7). This note ships on `cursor/audit-historical-casemode-fa79` after safe date/source repairs only.

**Verdict: CLEAR** (after the source-URL repairs listed below).

Whitestone is not a lawyer and this audit is not legal advice. Scores stay labeled. Confidence is not truth.

---

## Scope

Four operator questions, on the #8 tip (or post-merge equivalent):

1. Bundled as-of law records: every citation has `sourceUrl`; dates enact/amend/repeal consistent; no invented statutes.
2. Case Mode scores honesty: confidence never >0.75; UNKNOWN when sources thin; suppression axes not invented.
3. TrajectoryLock: no shooter/intent/guilt claims; video/stereo/docs labeled SLOT where not embeddable.
4. Export: Case Mode only; hash chain present; disclaimer not legal advice.

Scoring formulas were **not** rewritten. Only dead/invented source URLs, one event-type consistency row, one amend citation, export disclaimer copy, and Case Mode export gating were repaired.

---

## 1. Bundled as-of law records — CLEAR (after URL repair)

Source of truth: `src/history/records.ts` (asserted by `assertLawRecord` at module load). Engine: `src/history/evaluate.ts` / `retrieve.ts` / `asof.ts`.

### What held on the #8 tip

| Check | Result |
| --- | --- |
| Every `LawRecord` has non-empty `citation`, `title`, `sourceTitle`, HTTPS `sourceUrl` | Pass (tests reject empty URL) |
| `effective_from` ISO; `effective_to` ISO or null; `to >= from` when set | Pass |
| Event types present: enact / amend / repeal / add / remove | Pass |
| Standing uses month-resolution exclusive end (`isInForceAsOf`) | Pass — 18th standing in 1925-06, ended as of 1933-12 |
| State jurisdictions without rows | UNKNOWN — no invented state code |
| Uncitable “the law said X in 1850” / invented form / invented holding | REFUSE |
| Corpus honesty | Explicit: not a complete digitized U.S. law book since 1776 |

Seeded instruments are real federal milestones (Constitution 1789-03-04; Judiciary Act 1789-09-24; Bill of Rights / Amdts. IV–VIII 1791-12-15; 13th 1865-12-06; CRA 1866-04-09; 14th 1868-07-09; 15th 1870-02-03; Chinese Exclusion 1882-05-06 / Magnuson repeal 1943-12-17; Sherman 1890-07-02; Espionage 1917-06-15; 18th effective 1920-01-16 / 21st 1933-12-05; Volstead enacted 1919-10-28; 19th 1920-08-18; CRA 1964-07-02; VRA 1965-08-06; Fair Housing 1968-04-11; 26th 1971-07-01; FDCPA effective 1978-03-20; PKPA 1980-12-28; ADA 1990-07-26 / ADAAA 2009-01-01; VAWA 1994-09-13). Notes already refuse later doctrine and holdings.

Repeal/remove rows pair to an earlier enact/add of the same citation (18th, Volstead, Chinese Exclusion). Month-resolution honesty is labeled: an end dated mid-month is treated as already ended for that whole as-of month (18th / Chinese Exclusion).

### Source bugs found on the #8 tip (repaired)

Several rows used **guessed** `archives.gov/milestone-documents/…` slugs. Those paths are **not** on the current NARA milestone list (`https://www.archives.gov/milestone-documents/list`) and return **HTTP 404**. That is an invented source URL, not an invented statute.

| Record | Dead URL | Replacement (live official) |
| --- | --- | --- |
| CRA 1866 | `…/milestone-documents/civil-rights-act-1866` | GovInfo 14 Stat. 27 PDF |
| Espionage 1917 | `…/milestone-documents/espionage-act` | NARA Catalog NAID 5721240 |
| 18th Amendment | `…/milestone-documents/18th-amendment` | NARA Amendments 11–27 |
| Volstead | `…/milestone-documents/volstead-act` | NARA education lesson (primary docs) |
| 21st / 18th-repeal / Volstead-remove | `…/milestone-documents/21st-amendment` | NARA Amendments 11–27 |
| Fair Housing 1968 | `…/milestone-documents/fair-housing-act` | DOJ CRT Fair Housing Act page |
| 26th Amendment | `…/milestone-documents/26th-amendment` | NARA Amendments 11–27 |

Bill of Rights IV–VIII pointed at `constitution.congress.gov/constitution/amendment-N/` (real Constitution Annotated pages; automated GET is 403). Rows now cite the same NARA Bill of Rights transcript already used for Amendments I–X so the bundled URL is a public HTML page.

**Event-type consistency:** Amendment XXI was `enact` while every other constitutional amendment row is `add` (repeal of XVIII is a separate `repeal` row). XXI is now `add`.

**Citation consistency:** ADA Amendments row cited Pub. L. 101-336 (the 1990 Act). It now cites Pub. L. 110-325, 122 Stat. 3553. Notes already named 110-325.

Research seeds that repeated the dead 18th/21st milestone slugs were pointed at Amendments 11–27 so allowlisted fetch cannot be seeded at a 404.

Tests now forbid those invented milestone slugs and require repeal/remove pairing plus `add` for non-repeal amendment rows.

### Residual (not a statute invention)

- VAWA `sourceUrl` is the live OVW office page (`justice.gov/ovw/about-office`), not the enrolled 1994 crime-bill PDF. URL exists; it is a weak statute cite. Left as-is (not a 404).
- PKPA cites Cornell LII with an honest “not the official reporter” note.
- Volstead `effective_from` remains the enactment date 1919-10-28; notes now say Title II enforcement tracks 1920-01-16.
- Coverage is federal-seeded PARTIAL. Fifth Amendment is criminal-kind only (due-process civil overlay is not a separate row).

---

## 2. Case Mode scores honesty — CLEAR with labeled residuals

Engine: `src/casemode/evaluate.ts` + `src/honesty/evaluate.ts`. Cap: `src/casemode/cap.ts` (`CASE_CONFIDENCE_CAP = 0.75`). Zion/AZCoherence cap is the same 75% hard cap.

| Score | Thin sources | Cap |
| --- | --- | --- |
| `truth_upheld` | UNKNOWN without `honesty.sufficient` (stated outcome + dated layer + second text) | `capConfidence` |
| `narrative_suppression` | UNKNOWN unless dated independent contradiction (Jaccard < 0.45) | via `labeledOrUnknown` |
| `systemic_suppression` | UNKNOWN unless contradiction **and** an institutional cue | capped |
| `personal_professional_suppression` | UNKNOWN unless sufficient and (contradiction or ≥2 personal cues) | capped |
| Honesty `truth_buried` / `truth_overcame_lie` | UNKNOWN without dated independent uploads that contradict | see residual |
| `honesty_overall` | UNKNOWN unless sufficient; labeled composite `min(mean, 0.75)` | 0.75 |

NO-LIE copy is emitted. Official narrative is not treated as evidence (`spre.official_narrative_is_evidence === false`). Five-W names a person / on-behalf-of only when evidenced; otherwise UNKNOWN.

**Residual (documented, not patched — scoring change out of scope):**

1. Honesty `truth_buried` raw can theoretically reach 1.0 (`clip01Safe`); `truth_overcame_lie` can reach 0.85. Case Mode axes and `honesty_overall` are capped at 0.75. Display paths for Case Mode use `capConfidence` / “cap 75”. Do not treat an uncapped honesty raw as a Case Mode confidence.
2. `personal_professional_suppression` can LABEL from two lexical cues (`career`, `job`, …) when `honesty.sufficient` even if `truth_buried` is UNKNOWN. That is a thin-cue risk, not an invented buried-truth claim. The note says it is not a finding of retaliation.
3. `sufficient` can be true with archival text + as-of date and no upload; buried/suppression still stay UNKNOWN without dated independent contradiction.

---

## 3. TrajectoryLock — CLEAR

Port: `src/casemode/trajectory.ts`. FragGate card (2026-09-19):

- **name:** TrajectoryLock  
- **slug:** `trajectorylock`  
- **status:** live  
- **digest:** `7f536c9d148515d9b4e578c558361255db226cd5e3066daee1eee68209bfe3a7` (fraggate_verify matched)  
- **stub_ops:** `certified`, `shooter`, `intent`, `guilt`, `store_media`, `face`

Whitestone constants match those stub ops. Report fields are typed `solves_shooter: false`, `asserts_guilt: false`, `named_shooter: false`. Live path is GET `/v1/health` only — `posted_user_media: false`, `certified_instrument: false`. Synthetic `/v1/example` is refused as a real case in the limitation string.

Video / stereo / document:

| Layer | Behavior |
| --- | --- |
| No triangle cues | `UNKNOWN` |
| Partial triangle / thin tokens | `SLOT` (no invented line of fire) |
| ≥2 cues + enough tokens | `LABELED` line_fit, still capped at 0.75, still no shooter name |

**Residual:** `document` becomes true when session text tokenizes (not only when a document/PDF is uploaded). A text-only triangle can therefore be `LABELED` rather than `SLOT` even though full video/stereo physics are not embeddable. Limitation copy already says physics are SLOT; the status enum is `LABELED` for the lite line-fit. VibeLock SLOTs without audio. SpectralLock is LIVE GET / SLOT / UNAVAILABLE and does not POST session files.

---

## 4. Export — CLEAR (after disclaimer + gate)

- Schema `whitestone.casemode.export.v1` only. No filing/chat/evidence-package export.
- UI export button is on `CaseModePanel` and now requires `state.caseMode` (operator override stays Case Mode only).
- Hash chain: `lattice.nodes[]` with `sha256` + `prev`; `lattice.tip`; export `receipt.sha256` over the card body. `durable_worker_memory: false`.
- Disclaimer now includes **“Not a lawyer. Not legal advice.”** End & erase still wipes the live session.

---

## Safe fixes shipped on this branch

1. Replace 404 / invented NARA milestone slugs and bot-403 Constitution Annotated amendment URLs with live official pages.
2. Point research seeds at Amendments 11–27 instead of the dead 18th/21st milestone paths.
3. Amendment XXI `event_type`: `enact` → `add`.
4. ADA Amendments citation: Pub. L. 110-325, 122 Stat. 3553.
5. Volstead notes: enactment vs Title II effective date.
6. Case Mode + export disclaimer: not legal advice.
7. Export button gated on Case Mode.
8. Tests: forbid invented milestone slugs; amendment `add`; repeal/remove pairing; export hash chain + disclaimer.

---

## How to re-run

```text
npm test
npm run build
node workers/download-tracker/scripts/verify-discovery-copy.mjs
```

Auditor table (from `docs/AUDIT-HANDOFF.md`) still applies for a live session copy-out before End & erase.

---

## FragGate cite (TrajectoryLock)

`fraggate_describe` + `fraggate_verify` on 2026-09-19: live, digest `7f536c9d148515d9b4e578c558361255db226cd5e3066daee1eee68209bfe3a7`, stub_ops include shooter / intent / guilt. Whitestone does not invent a FragGate mesh inside the SPA; it cites the product Worker GET and the GitHub spec.
