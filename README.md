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

Whitestone is **one software**. After the Welcome disclaimer you choose a practice area:

1. **Criminal** — bail / arraignment, discovery, plea process overview, sentencing basics, expungement overview, rights education. Hard refuse: help committing crimes, destroying evidence, witness intimidation, evading process. Urge counsel or the public defender for serious charges.
2. **Civil** — small claims, contract-dispute overview, landlord-tenant overview, civil protection orders, name change, debt-collection defense overview. High-level procedural and court self-help research. Not business-formation mill advice.
3. **Divorce** — the existing family / divorce track (custody, support, dissolution, parentage, guardianship, family protection orders, adoption overview, and related filings).

Then the session-only path:

1. Choose a jurisdiction
2. Choose a matter type for that area
3. Enter people and facts
4. Upload evidence (PDF, DOCX, text, images) — **in only**
5. Guided Q&A from a structured knowledge base
6. On-screen filing structure / caption draft
7. **End & erase**

Changing practice area requires a clear reset (or End & erase) so sessions do not mix areas.

The advisor is a **self-contained engine**: jurisdiction notes + topic checklists + retrieval + a deterministic dialogue / state machine that adapts from **this chat only**. On the hosted Worker it may also fetch **allowlisted public court, legal-aid, and government pages** and cite them in-session. No API keys. No third-party LLM. A desktop zip is an optional offline backup and **does not include live research**.

## Use in a browser (no download required)

Phone and desktop use the same live app:

1. Open **https://whitestone.vibelock.workers.dev** in any browser (Safari, Chrome, Firefox, Edge).
2. Accept the disclaimer, pick **Criminal / Civil / Divorce**, and walk the session: jurisdiction → matter → people/facts → evidence (camera, photos, or files) → advisor → filing structure → **End & erase**.
3. Optional on a phone: browser menu → **Add to Home Screen**. That is a shortcut, not an App Store install. Sessions stay ephemeral.

You do **not** need `whitestone-standalone.zip` to use Whitestone. The zip is there for people who want a portable offline copy.

### Coverage honesty

The knowledge layer is a **procedural overview and checklist**, not an annotated code of every statute. Waiting periods, fees, form numbers, and local rules change. Whitestone **does not invent case citations**. Every web-backed claim shows a source title, URL, and retrieved date. Prefer the clerk’s packet over anything on this screen.

### Live public-page research (hosted app)

The live Worker (`POST /api/research`) selects a short allowlist — state judiciary / self-help portals, LawHelp and listed legal-aid sites, Cornell LII, Justia statute browsers (labeled unofficial), and USA.gov / justice.gov / uscourts.gov / CFPB public pages — **seeded by the session’s practice area**. Random blogs and SEO mills are blocked.

Fetched text is ephemeral: session-only in the browser, plus a short Worker cache of the **same public URL** (not your case). End & erase wipes web notes with the rest of the session. Offline zip / `vite` without the Worker fall back to the bundled knowledge layer.

**After merge, redeploy the Worker** so `/api/research` and the three-area UI are live. `npm run dev` can proxy to `wrangler dev` on port 8787.

## What it is not

- **Not a lawyer. Not a law firm. Not legal advice.**
- **Not a replacement for an attorney**, public defender, court clerk, or judge.
- **Not a predictor** of custody, support, civil outcomes, or criminal sentences.
- **Not help committing crimes**, destroying evidence, intimidating witnesses, or evading arrest or court process.
- **Not an export tool.** There is no download, print, or save-as of filings, chat, or evidence packages from the app.
- **Not a third-party LLM client.** No OpenAI, Anthropic, Google Gemini, xAI, Groq, or similar SDKs.

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

No third-party model is invoked. Synthesis stays in the advisor engine.

## License

Apache-2.0. Copyright 2026 Aziel Eliab.

## Author

Aziel Eliab — https://www.azieleliab.com/#aziel
