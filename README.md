# Whitestone

[![views](https://whitestone.vibelock.workers.dev/count/view)](https://whitestone.vibelock.workers.dev/)
[![downloads](https://whitestone.vibelock.workers.dev/count/download)](https://whitestone.vibelock.workers.dev/download)
[![release](https://img.shields.io/github/v/release/AzielEliab/Whitestone?label=release)](https://github.com/AzielEliab/Whitestone/releases/latest)
[![license](https://img.shields.io/badge/license-Apache--2.0-241f1a)](LICENSE)

**Ephemeral pro se family-law advisor** for all 50 U.S. states and the District of Columbia.

Lamb Lens: **Service → Clarity → Peace**.

**On a phone: open the live Cloudflare URL. That is the full product — no GitHub zip, App Store app, or install.**

**https://whitestone.vibelock.workers.dev**

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

The advisor is a **self-contained engine**: jurisdiction notes + topic checklists + retrieval + a deterministic dialogue / state machine that adapts from **this chat only**. The hosted Worker is enough; no API keys. A desktop zip exists only as an optional offline copy.

## Use on a phone (no download)

1. Open **https://whitestone.vibelock.workers.dev** in Safari, Chrome, or Firefox on the phone.
2. Accept the disclaimer and walk the session: jurisdiction → matter → people/facts → evidence (camera, photos, or files) → advisor → filing structure → **End & erase**.
3. Optional: browser menu → **Add to Home Screen**. That is a shortcut, not an App Store install. Sessions stay ephemeral.

Do **not** download `whitestone-standalone.zip` to use Whitestone on a phone. The zip is for people who want a portable desktop copy.

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

Chat, uploads, and derived case state live in **memory and session storage** for the active session. **End & erase** wipes chat, uploads, metadata, related IndexedDB, and service-worker caches. Closing the tab drops sessionStorage. Backgrounding the phone or opening the camera / file picker does **not** wipe the session (so evidence upload can finish). There is no user account. The Worker must not persist case content. If a browser extract buffer is used for a file, it is discarded with the session.

A light Home Screen / PWA shell may cache **static UI only**. It must not keep case content after End & erase.

**Uploads only.** You bring files in. You do not take a Whitestone “evidence zip” or “filing package” out. (The GitHub Release zip is the **software**, not your case.)

## Optional desktop zip (not the mobile path)

Latest portable **software** build (not your case):

**https://github.com/AzielEliab/Whitestone/releases/latest/download/whitestone-standalone.zip**

On a wide desktop window that is **not** already the Worker host, the UI may show an optional zip link. Phones and the live Worker hide that CTA. **https://whitestone.vibelock.workers.dev/download** still increments the download counter and redirects to the GitHub Release zip.

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

No third-party model is invoked.

## License

Apache-2.0. Copyright 2026 Aziel Eliab.

## Author

Aziel Eliab — https://www.azieleliab.com/#aziel
