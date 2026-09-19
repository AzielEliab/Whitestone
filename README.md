# Whitestone

[![views](https://whitestone.vibelock.workers.dev/count/view)](https://whitestone.vibelock.workers.dev/)
[![release](https://img.shields.io/github/v/release/AzielEliab/Whitestone?label=release)](https://github.com/AzielEliab/Whitestone/releases/latest)
[![license](https://img.shields.io/badge/license-Apache--2.0-241f1a)](LICENSE)

**One ephemeral pro se advisor** with three practice areas — **Criminal**, **Civil**, and **Divorce** — for all 50 U.S. states and the District of Columbia.

Lamb Lens: **Service → Clarity → Peace**.

**Use it in the browser:** open the live Cloudflare URL on a phone or desktop. That is the full product. **You can also download** an optional GitHub Release zip if you want an offline copy. Neither path is required to the exclusion of the other.

**https://whitestone.vibelock.workers.dev**

Human UI first. A small `GET /v1/software` catalog exists for agent discovery. There is **no** MCP LLM backdoor and **no** third-party LLM glue.

## What it is

Whitestone is **one software**. Welcome puts **Criminal / Civil / Divorce** first; long legal copy sits under **Important notices** (still present, not deleted). Then you choose a practice area:

1. **Criminal** — bail / arraignment, discovery, plea process overview, sentencing basics, expungement overview, rights education. Hard refuse: help committing crimes, destroying evidence, witness intimidation, evading process. Urge counsel or the public defender for serious charges.
2. **Civil** — small claims, contract-dispute overview, landlord-tenant overview, civil protection orders, name change, debt-collection defense overview. High-level procedural and court self-help research.
3. **Divorce** — the existing family / divorce track (custody, support, dissolution, parentage, guardianship, family protection orders, adoption overview, and related filings).

Then the session-only path:

1. Choose a jurisdiction
2. Choose a matter type for that area
3. Enter people and facts
4. Upload evidence (PDF, DOCX, text, images) — **in only**. Historical as-of path adds labeled buttons for **case filings, evidence, historical reports, and news clippings**.
5. Guided Q&A from a structured knowledge base
6. On-screen filing structure / caption draft
7. **End & erase**

Changing practice area requires a clear reset (or End & erase) so sessions do not mix areas.

After jurisdiction + matter + minimal facts you may **Skip to advisor** (other steps remain). Each screen has a “what’s next” one-liner. The advisor names your parties and answered facts, offers one-tap follow-ups, and can open **Math** and **Statistics** panels on a phone keyboard.

The advisor is a **self-contained engine**: jurisdiction notes + topic checklists + retrieval + a deterministic dialogue / state machine that adapts from **this chat only**, plus labeled math, cited public statistics, optional **historical as-of** evaluation, IRAC-style reasoning, and an **AZCoherence-inspired anti-hallucination last pass** (ported logic, not the full Aziel runtime). On the hosted Worker it may also fetch **allowlisted public court, legal-aid, government, and statistical landing pages** and cite them in-session. No API keys. No third-party LLM. Default path works without Workers AI. A desktop zip is an optional offline backup and **does not include live research**.

### Custom answers (no third-party LLM)

`advise()` routes intent (deadlines, forms, venue, evidence, safety, math, stats, process, next steps), builds a session working plan, maps upload notes to issues, and writes Issue → Rule/source → Application to **your** facts → Next step outlines. Templates vary by intent so replies are not the same checklist dump. When research returns pages, it weaves 1–3 takeaways with title, URL, and retrieved date.

### Math (honesty labels)

`src/math/` is pure TypeScript: calendar / business-day offsets (holidays **not** fully modeled — labeled), simple and compound interest, percent / pro-rata / bond cash-%, a child-support estimator, and claim totaling. Natural-language asks such as “what’s 10% of $5000 bail” or “30 days from March 1” parse inside the advisor.

**HEURISTIC / ILLUSTRATIVE** unless a specific public formula is cited with a source URL (Texas Family Code § 154.125 and Wisconsin DCF 150 schedules). Never treat a figure as an official worksheet or an order. Verify dates with the clerk.

### Cited statistics (no invented numbers)

`src/stats/` stores typed records `{ id, area, topic, claim, value, unit, year, geography, sourceTitle, sourceUrl, notes }`. Empty `sourceUrl` is rejected in tests. National vs state is labeled. Methodology limits are stated (pro se counts are often undercounted; Census custodial-parent shares are **household living arrangements**, not litigated custody win-rates; many states do not publish outcomes by parent gender). Ask “what do the numbers say?” or use the Statistics panel.

Sources in the bundle include Census P60-269, CDC/NCHS marriage-divorce rates, BJS large-urban-county felony tables, FBI UCR 2019 clearances, LSC Justice Gap 2022, NCSC / CSP landing pages, CFPB complaint data, and Pew’s 2020 debt-collection court report. If a state figure is missing, Whitestone says so.

### AZCoherence-inspired anti-hallucination (ported logic, not full runtime)

Whitestone stays a standalone SPA + Worker. It does **not** embed FragGate, mesh/QNM, AKM memory, AZPIPE, or the Softwares catalog.

Local modules (Apache-2.0, author Aziel Eliab):

1. **`src/guard/coherence.ts`** — inspired by [AZCoherence](https://github.com/AzielEliab/AZCoherence) (AZC-0.1) `coherence_check` / `neutralize_hallucination`. Motto: **Confidence is not truth. Never invent evidence.** After a primary draft, an alternate safer phrasing is built from session facts + allowlisted excerpts + bundled knowledge + labeled stats/math. Verdict **PASS | FLAG | NEUTRALIZE | REFUSE**. FLAG/NEUTRALIZE strip unsupported claim tokens (invented form numbers, uncited stats, absolute mandates, outcome predictions). Advisor bubbles show a **Grounding** badge and optional evidence list.
2. **`src/guard/decisiongate.ts`** — DecisionGATE-lite: Definition → Evidence → Impact → Integrity → Responsibility. Evidence fails without a source or session fact. Integrity fails on session contradictions or criminal refuse rules. Responsibility always names that **you + clerk/counsel** own the decision.
3. **NO-LIE-NO-REWRITE-1.0** (cite only) — claims that still hash to their sources; no rewrite of user facts; never lie to be helpful; prefer refuse/unknown over fabrication.
4. **Session receipt** — ephemeral `content_sha256` over reply text + source URLs + stat ids. Wiped with End & erase. **Not** durable ChainLock / LOCKSET.

A light R/D/P inconsistency *hint* may appear when answers clash.

### Anti-corruption honesty eval (ported engines, labeled scores)

On the historical path, Whitestone can compare **stated outcomes / reports / results** to session uploads. Scores:

- `truth_buried`
- `truth_overcame_lie`
- `honesty_overall`

Each is **LABELED** or **UNKNOWN**. UNKNOWN when dated independent sources/uploads are insufficient. **NO-LIE:** Whitestone never invents a buried-truth claim without dated sources or uploads.

Ported logic (cite the specs; Confidence is not truth):

1. **AZ-CLCE** — Jaccard R/D/P triple ([az-clce](https://github.com/AzielEliab/az-clce)). Detects inconsistency, not intent. Type D is a label only.
2. **SPRE** — structural similarity `{P1..P5, E, C, T, D}`; `PC = SSI × E`. Official narrative is never evidence.
3. **PhysLing** — home is [aziel-corpus](https://github.com/AzielEliab/aziel-corpus). Whitestone fills a lite slot only when dated independent physical language is present; otherwise unverified.
4. **Triad** — `aziel.triad.v0.3` mean of SPRE+CLCE+PhysLing only when all three verified.
5. **Triadscore** — AKM-TRIAD-1.0 style 3-of-4 + Beta posterior. Posterior is a labeled score. Confidence is not truth. No durable AKM memory.
6. **ZionPattern** — nine ontology nodes, hard 75% cap ([zion-pattern-solver](https://github.com/AzielEliab/zion-pattern-solver)). Does not solve cases.

**Hashchain lattice:** content hashes of session materials vs prior in-session nodes and bundled pattern pins. Ephemeral. Cite-only of ChainLock CL-WP-0.4 — not durable Worker memory. Similar events only with labeled similarity + sources. Wipe with End & erase.

### Case Mode (current and/or historical)

Optional **Case Mode** evaluates a current or historical case on the same session path. Labeled scores (hard cap 75%; UNKNOWN without dated hashchained sources):

- `truth_upheld`
- `narrative_suppression`
- `systemic_suppression`
- `personal_professional_suppression`

plus the honesty axes above. Always emit **why / who / what / how / when** and whether a named actor was independent or acting on behalf of another party (UNKNOWN when not evidenced).

Case Mode ingest adds certificates, findings, articles, police reports, phone, images, paintings, documents, video, and audio alongside filings / evidence / reports / clippings. Video and audio extract metadata only — no invented frames or transcripts.

**Export** (Case Mode only): a hash-chain score card JSON for educational / archival use. End & erase still wipes the live session.

Ported or cited slots: TrajectoryLock (victim × impact direction × location; does not name a shooter), VibeLock, SpectralLock allowlist GET (`https://spectrallock-download-tracker.vibelock.workers.dev` `/v1/unredact` revision graph, `/v1/recover` universal recover, `/v1/handwriting` heuristics — leftover-bytes, not a lab; session files stay in-browser). Online verify uses the same allowlisted public-page fetches. Confidence is not truth.

Audit handoff of historical law dates + honesty + Case Mode scores: [docs/AUDIT-HANDOFF.md](docs/AUDIT-HANDOFF.md).

Whitestone stays a standalone SPA + Worker. It does **not** invent a full FragGate mesh.

## Use in a browser (no download required)

Phone and desktop use the same live app:

1. Open **https://whitestone.vibelock.workers.dev** in any browser (Safari, Chrome, Firefox, Edge).
2. Accept the disclaimer, pick **Criminal / Civil / Divorce**, and walk the session: jurisdiction → matter → people/facts → evidence (camera, photos, or files) → advisor → filing structure → **End & erase**.
3. Optional on a phone: browser menu → **Add to Home Screen**. That is a shortcut, not an App Store install. Sessions stay ephemeral.

You do **not** need `whitestone-standalone.zip` to use Whitestone. The zip is there for people who want a portable offline copy.

### Coverage honesty

The knowledge layer is a **procedural overview and checklist**, not an annotated code of every statute. Waiting periods, fees, form numbers, and local rules change. Whitestone **does not invent case citations**. Every web-backed claim shows a source title, URL, and retrieved date. Prefer the clerk’s packet over anything on this screen.

**Historical as-of evaluation** (optional, same product — not a fourth practice area) lets you pick a **year and month** since the founding era (July 1776 onward) and compare user-supplied archival case or ruling facts, plus allowlisted public pages, to standing law **as of that month**.

Whitestone does **not** claim a complete digitized corpus of every U.S. law since 1776. What ships:

1. An as-of evaluation engine and date algebra for enact / amend / repeal / add / remove timelines (`effective_from`, nullable `effective_to`).
2. A seeded / bundled set of **federal constitutional and major-statute milestones** with `sourceTitle` and `sourceUrl` (empty URLs are rejected in tests, same pattern as `src/stats/`).
3. Jurisdiction hooks that return **UNKNOWN** when no dated record exists for that state or locality. Federal coverage is labeled **PARTIAL**.
4. The same allowlisted public primary-source fetches Whitestone already uses for research (including National Archives and Constitution Annotated hosts).

Every law record has: jurisdiction, civil|criminal, citation, title, effective_from, effective_to, event_type, sourceTitle, sourceUrl, notes. The engine will **REFUSE** invented form numbers and uncitable “the law said X in 1850” claims that lack a dated record. It does not invent holdings. Session-only; End & erase wipes as-of dates, archival notes, honesty lattice, and uploads with the rest of the session. No third-party LLM. Lamb Lens: Service → Clarity → Peace.

### Live public-page research (hosted app)

The live Worker (`POST /api/research`) selects a short allowlist — state judiciary / self-help portals, LawHelp and listed legal-aid sites, Cornell LII, Justia statute browsers (labeled unofficial), and USA.gov / justice.gov / uscourts.gov / CFPB public pages — **seeded by the session’s practice area**.

Fetched text is ephemeral: session-only in the browser, plus a short Worker cache of the **same public URL** (not your case). End & erase wipes web notes with the rest of the session. Offline zip / `vite` without the Worker fall back to the bundled knowledge layer.

**After merge, redeploy the Worker** so `/api/research` and the three-area UI are live. `npm run dev` can proxy to `wrangler dev` on port 8787.

## Safety

If you are in danger: **911**. National Domestic Violence Hotline: **1-800-799-7233**. Suicide & Crisis Lifeline: **988**.

## Ephemeral model

Chat, uploads, and derived case state live in **memory and session storage** for the active session. **End & erase** wipes chat, uploads, metadata, related IndexedDB, and service-worker caches. Closing the tab drops sessionStorage. Backgrounding the phone or opening the camera / file picker does **not** wipe the session (so evidence upload can finish). There is no user account. The Worker must not persist case content. If a browser extract buffer is used for a file, it is discarded with the session.

A light Home Screen / PWA shell may cache **static UI only**. It must not keep case content after End & erase.

**Uploads only.** You bring files in. You do not take a Whitestone “evidence zip” or “filing package” out. (The GitHub Release zip is the **software**, not your case.)

## Optional software download (never required)

Latest portable **software** build (not your case):

**https://github.com/AzielEliab/Whitestone/releases/latest/download/whitestone-standalone.zip**

The hosted UI shows a quiet **Download software** action (header, Welcome, and footer) on desktop and mobile. It points at the counted redirect **https://whitestone.vibelock.workers.dev/download**. The live site still works without installing.

[![downloads](https://whitestone.vibelock.workers.dev/count/download)](https://whitestone.vibelock.workers.dev/download)

Unzip and serve the `whitestone/` folder (`npx serve .` or `python3 -m http.server`). Read `RUN.txt`.

Counted zip (HTTP 200, isolated KV, no 302): **https://whitestone-download-tracker.vibelock.workers.dev/download**

Tracker homepage (Views / Downloads): **https://whitestone-download-tracker.vibelock.workers.dev/**

The live app Worker at `whitestone.vibelock.workers.dev` is unchanged. Its `/download` may still 302 to GitHub. The tracker is the sibling counter — same pattern as `ark-download-tracker.vibelock.workers.dev`.

## Run locally

```bash
npm install
npm test
npm run build
npm run dev
```

Open http://127.0.0.1:5173

## Cloudflare deploy

Project name: **whitestone**.

Live: **https://whitestone.vibelock.workers.dev**

```bash
npx wrangler login
npm run deploy
```

Details, counter paths, and sitemap notes: [DEPLOY.md](DEPLOY.md).

## Agent catalog

- `GET /v1/software` — live catalog card (Worker)
- `/catalog.json` — same description as static JSON
- `GET /api/research` — research capability + allowlist summary
- `POST /api/research` — allowlisted public-page lookup (`{ sources, notes }`)
- Historical as-of evaluation is in-app (`src/history/`) — no extra LLM door

No third-party model is invoked. Synthesis stays in the advisor engine.

## License

Apache-2.0. Copyright 2026 Aziel Eliab.

## Author

Aziel Eliab — https://www.azieleliab.com/#aziel
