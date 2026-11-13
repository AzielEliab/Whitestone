#!/usr/bin/env node
import { createHash } from "node:crypto";
import { chmodSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
await cp(join(root, "pack", "RUN.txt"), join(folder, "RUN.txt"));
await cp(join(root, "pack", "README.md"), join(folder, "README.md"));
await cp(join(root, "bin", "whitestone.mjs"), join(folder, "whitestone.mjs"));
chmodSync(join(folder, "whitestone.mjs"), 0o755);
await cp(join(root, "LICENSE"), join(folder, "LICENSE"));

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
