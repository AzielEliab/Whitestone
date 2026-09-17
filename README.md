# Whitestone

[![views](https://whitestone.azieleliab.workers.dev/count/view)](https://whitestone.azieleliab.workers.dev/)
[![downloads](https://whitestone.azieleliab.workers.dev/count/download)](https://whitestone.azieleliab.workers.dev/download)
[![release](https://img.shields.io/github/v/release/AzielEliab/Whitestone?label=release)](https://github.com/AzielEliab/Whitestone/releases/latest)
[![license](https://img.shields.io/badge/license-Apache--2.0-241f1a)](LICENSE)

**Ephemeral pro se family-law advisor** for all 50 U.S. states and the District of Columbia.

Lamb Lens: **Service → Clarity → Peace**.

Human UI first. A small `GET /v1/software` catalog exists for agent discovery. There is **no** MCP LLM backdoor and **no** third-party LLM glue.

## What it is

Whitestone walks a person through a **session-only** path:

1. Accept a plain-language disclaimer
2. Choose a jurisdiction
3. Choose a matter type
4. Enter people and facts
5. Upload evidence (PDF, DOCX, text, images) — **in only**
6. Guided Q&A from a structured knowledge base
7. On-screen filing structure / caption draft
8. **End & erase**

The advisor is a **self-contained engine**: jurisdiction notes + topic checklists + retrieval + a deterministic dialogue / state machine that adapts from **this chat only**. A downloaded copy runs without API keys.

### Matter types

Custody, parenting time, child support, spousal support / alimony, divorce / dissolution, legal separation, parentage / paternity, guardianship, family protection / restraining orders, adoption overview, and name change.

### Coverage honesty

The knowledge layer is a **procedural overview and checklist**, not an annotated code of every statute. Waiting periods, fees, form numbers, and local rules change. Whitestone **does not invent case citations**. Prefer the clerk’s packet over anything on this screen.

## What it is not

- **Not a lawyer. Not a law firm. Not legal advice.**
- **Not a replacement for an attorney**, court clerk, or judge.
- **Not a predictor** of custody, support, or property outcomes.
- **Not an export tool.** There is no download, print, or save-as of filings, chat, or evidence packages from the app.
- **Not a third-party LLM client.** No OpenAI, Anthropic, Google Gemini, xAI, Groq, or similar SDKs.

If you are in danger: **911**. National Domestic Violence Hotline: **1-800-799-7233**. Suicide & Crisis Lifeline: **988**.

## Ephemeral model

Chat, uploads, and derived case state live in **memory and session storage** for the active session. On window unload or **End & erase**, Whitestone wipes chat, uploads, metadata, related IndexedDB, and service-worker caches. There is no user account. The Worker must not persist case content. If a browser extract buffer is used for a file, it is discarded with the session.

**Uploads only.** You bring files in. You do not take a Whitestone “evidence zip” or “filing package” out. (The GitHub Release zip is the **software**, not your case.)

## One-click software download

Latest portable build:

**https://github.com/AzielEliab/Whitestone/releases/latest/download/whitestone-standalone.zip**

On the hosted Worker, **https://whitestone.azieleliab.workers.dev/download** increments the download counter and redirects to that zip.

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

```bash
npx wrangler login
npm run deploy
```

Details, counter paths, and sitemap notes: [DEPLOY.md](DEPLOY.md).

After the first deploy, if your `workers.dev` subdomain is not `azieleliab`, update the badge and sitemap URLs in this README, `public/robots.txt`, and `public/sitemap.xml`.

## Agent catalog

- `GET /v1/software` — live catalog card (Worker)
- `/catalog.json` — same description as static JSON

No third-party model is invoked.

## License

Apache-2.0. Copyright 2026 Aziel Eliab.

## Author

Aziel Eliab — https://www.azieleliab.com/#aziel
