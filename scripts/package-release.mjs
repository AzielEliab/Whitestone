#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cp } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const release = join(root, "release");
const folder = join(release, "whitestone");
const zip = join(release, "whitestone-standalone.zip");

if (!existsSync(dist)) {
  console.error("Run npm run build first");
  process.exit(1);
}

mkdirSync(release, { recursive: true });
await cp(dist, folder, { recursive: true });
writeFileSync(
  join(folder, "RUN.txt"),
  `Whitestone standalone build
===========================

This folder is the built UI. It does not include your case files.

Serve it locally (do not expect file:// to run module workers in every browser):

  npx --yes serve .
  # or: python3 -m http.server 4173

Then open the printed URL.

Rules:
- Session memory only. End & erase wipes chat, uploads, and any fetched web notes.
- No export / print / save-as of filings or evidence packages.
- Not a lawyer. Not legal advice.
- This offline zip does not include live /api/research. The hosted Worker may fetch allowlisted public court/legal-aid pages; this copy uses the bundled knowledge layer only.

Source: https://github.com/AzielEliab/Whitestone
`,
);
await cp(join(root, "LICENSE"), join(folder, "LICENSE"));
await cp(join(root, "README.md"), join(folder, "README.md")).catch(() => undefined);

try {
  execFileSync("zip", ["-r", "-q", zip, "whitestone"], { cwd: release });
} catch {
  await zipFallback(folder, zip);
}

const buf = readFileSync(zip);
const sha = createHash("sha256").update(buf).digest("hex");
writeFileSync(join(release, "SHA256SUMS.txt"), `${sha}  whitestone-standalone.zip\n`);
console.log(zip);
console.log("sha256", sha);

async function zipFallback(dir, dest) {
  const { createRequire } = await import("node:module");
  try {
    const req = createRequire(import.meta.url);
    const archiver = req("archiver");
    await new Promise((resolve, reject) => {
      const out = createWriteStream(dest);
      const archive = archiver("zip");
      out.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(out);
      archive.directory(dir, "whitestone");
      archive.finalize();
    });
  } catch {
    console.error("Install zip(1) or add archiver to package this release.");
    process.exit(1);
  }
}
