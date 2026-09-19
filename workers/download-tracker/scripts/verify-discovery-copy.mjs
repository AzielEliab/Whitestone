/**
 * Whitestone discovery-surface copy: keep positive definitions,
 * refuse SEO not-catalogs and blocked-from / Zenodo-ban lines.
 * Author: Aziel Eliab. Apache-2.0.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LIMITATION } from "../src/engine.js";
import worker from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const DISCOVERY_FILES = [
  "index.html",
  "public/catalog.json",
  "public/manifest.webmanifest",
  "worker/index.ts",
  "worker/research.ts",
  "workers/download-tracker/src/index.js",
  "workers/download-tracker/src/engine.js",
  "workers/download-tracker/README.md",
  "README.md",
  "scripts/package-release.mjs",
  ".github/workflows/release.yml",
];

const FORBIDDEN = [
  /THIS IS NOT/i,
  /What this is not/i,
  /What it is not/i,
  /does not really/i,
  /what not to say/i,
  /≠/,
  /not a lawyer/i,
  /not legal advice/i,
  /blocked from/i,
  /blockedExamples/,
  /SEO mills are blocked/i,
  /CNS-ZENODO/i,
  /zenodo[- ]?ban/i,
  /IP-BAN/i,
  /Zenodo refused/i,
];

const REQUIRED = [
  /ephemeral pro se/i,
  /Criminal/,
  /Civil/,
  /Divorce/,
  /whitestone\.vibelock\.workers\.dev/,
  /Aziel Eliab/,
];

const joined = DISCOVERY_FILES.map((rel) => {
  const text = readFileSync(join(root, rel), "utf8");
  return { rel, text };
});

for (const { rel, text } of joined) {
  for (const re of FORBIDDEN) {
    assert.equal(re.test(text), false, `${rel} still has SEO not-phrase / ban-catalog: ${re}`);
  }
}

const all = joined.map((f) => f.text).join("\n");
for (const re of REQUIRED) {
  assert.equal(re.test(all), true, `discovery surfaces lost defining copy: ${re}`);
}

assert.match(LIMITATION, /ephemeral pro se advisor/i);
assert.match(LIMITATION, /Criminal, Civil, and Divorce/);
assert.match(LIMITATION, /whitestone\.vibelock\.workers\.dev/);
assert.doesNotMatch(LIMITATION, /not a lawyer/i);
assert.doesNotMatch(LIMITATION, /THIS IS NOT/i);

function memoryKv() {
  return {
    async get() {
      return "0";
    },
    async put() {},
    async list() {
      return { keys: [], list_complete: true };
    },
  };
}

const env = { DOWNLOADS: memoryKv() };
const skill = await worker.fetch(
  new Request("https://whitestone-download-tracker.vibelock.workers.dev/v1/skill", {
    headers: { "User-Agent": "Mozilla/5.0" },
  }),
  env,
);
const skillText = await skill.text();
assert.equal(skill.status, 200);
assert.match(skillText, /ephemeral pro se advisor/i);
assert.match(skillText, /Criminal, Civil, and Divorce/);
assert.match(skillText, /https:\/\/whitestone\.vibelock\.workers\.dev\//);
assert.doesNotMatch(skillText, /THIS IS NOT/);
assert.doesNotMatch(skillText, /not a lawyer/i);

const llms = await worker.fetch(
  new Request("https://whitestone-download-tracker.vibelock.workers.dev/llms.txt", {
    headers: { "User-Agent": "Mozilla/5.0" },
  }),
  env,
);
const llmsText = await llms.text();
assert.equal(llms.status, 200);
assert.match(llmsText, /ephemeral pro se advisor/i);
assert.match(llmsText, /https:\/\/whitestone\.vibelock\.workers\.dev\//);
assert.doesNotMatch(llmsText, /not a lawyer/i);
assert.doesNotMatch(llmsText, /blocked from/i);

const cite = await worker.fetch(
  new Request("https://whitestone-download-tracker.vibelock.workers.dev/cite.json", {
    headers: { "User-Agent": "Mozilla/5.0" },
  }),
  env,
);
const citeJson = await cite.json();
assert.equal(cite.status, 200);
assert.equal(citeJson.author, "Aziel Eliab");
assert.equal(citeJson.live_app, "https://whitestone.vibelock.workers.dev/");
assert.doesNotMatch(JSON.stringify(citeJson), /not a lawyer/i);

const home = await worker.fetch(
  new Request("https://whitestone-download-tracker.vibelock.workers.dev/", {
    headers: { "User-Agent": "Mozilla/5.0" },
  }),
  env,
);
const homeText = await home.text();
assert.equal(home.status, 200);
assert.match(homeText, /ephemeral pro se advisor/i);
assert.doesNotMatch(homeText, /not a lawyer/i);
assert.doesNotMatch(homeText, /THIS IS NOT/);

console.log("verify-discovery-copy: SEO/llms/ai/cite keep definitions; not-catalogs and ban-lines gone");
