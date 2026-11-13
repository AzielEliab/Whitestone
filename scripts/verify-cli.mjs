import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const bin = join(process.cwd(), "bin", "whitestone.mjs");

function run(args, env) {
  try {
    const stdout = execFileSync(process.execPath, [bin, ...args], {
      encoding: "utf8",
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    return {
      code: error.status ?? 1,
      stdout: String(error.stdout ?? ""),
      stderr: String(error.stderr ?? ""),
    };
  }
}

test("prints git-style help", () => {
  const help = run(["--help"]);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /Usage:/);
  assert.match(help.stdout, /ui/);
  assert.match(help.stdout, /doctor/);
  assert.match(help.stdout, /Examples:/);
  assert.doesNotMatch(help.stdout, /## \d+\.\d+/);
  assert.equal(run(["-h"]).code, 0);
});

test("welcomes a person and names the next command", () => {
  const welcome = run([]);
  assert.equal(welcome.code, 0);
  assert.match(welcome.stdout, /Criminal, Civil, or Divorce/);
  assert.match(welcome.stdout, /Aziel Eliab/);
  assert.match(welcome.stdout, /Service → Clarity → Peace/);
  assert.match(welcome.stdout, /ui/);
  assert.equal(welcome.stdout.trim().startsWith("{"), false);
});

test("explains a bad command with a next step", () => {
  const bad = run(["bogus"]);
  assert.notEqual(bad.code, 0);
  const text = `${bad.stderr}${bad.stdout}`;
  assert.match(text, /Unknown command "bogus"/);
  assert.match(text, /--help/);
  assert.doesNotMatch(text, /at file:/);
});

test("explains a bad option and a bad port", () => {
  const option = run(["--nope"]);
  assert.notEqual(option.code, 0);
  assert.match(option.stderr, /Unknown option "--nope"/);
  const port = run(["ui", "--port", "nope"]);
  assert.notEqual(port.code, 0);
  assert.match(port.stderr, /not a whole number/);
  assert.match(port.stderr, /--port 4173/);
});

test("prints JSON when asked", () => {
  const status = run(["--json"]);
  assert.equal(status.code, 0);
  const body = JSON.parse(status.stdout);
  assert.equal(body.ok, true);
  assert.equal(body.product, "whitestone");
  assert.equal(body.author, "Aziel Eliab");
  assert.equal(body.next.some((line) => line.includes("ui")), true);

  const help = JSON.parse(run(["--json", "--help"]).stdout);
  assert.equal(help.command, "help");
  assert.ok(help.commands.length > 0);
});

test("doctor reports pass or a plain next step", () => {
  const doctor = run(["doctor"]);
  assert.match(doctor.stdout, /Whitestone doctor/);
  assert.match(doctor.stdout, /node/);
  assert.match(doctor.stdout, /pass|fail/);
  if (doctor.code !== 0) assert.match(`${doctor.stdout}${doctor.stderr}`, /Next:/);
  const json = JSON.parse(run(["doctor", "--json"]).stdout);
  assert.equal(json.command, "doctor");
  assert.deepEqual(
    json.checks.map((check) => check.name),
    ["node", "app", "loopback"],
  );
});

test("ui serves the app on loopback and prints one link", async () => {
  const dir = mkdtempSync(join(tmpdir(), "whitestone-ui-"));
  writeFileSync(join(dir, "index.html"), "<!doctype html><title>Whitestone</title><p>Choose a practice area</p>");
  const child = spawn(process.execPath, [bin, "ui", "--port", "0"], {
    env: { ...process.env, WHITESTONE_APP_ROOT: dir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  try {
    const line = await new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("ui did not print a link"));
      }, 8000);
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
        const match = stdout.match(/Open (http:\/\/127\.0\.0\.1:\d+\/)/);
        if (match && !settled) {
          settled = true;
          clearTimeout(timer);
          resolve(match[1]);
        }
      });
      child.on("exit", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(`ui exited ${code}: ${stdout}`));
      });
    });
    const res = await fetch(line);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /practice area/);
    const missing = await fetch(`${line}missing-file`, { headers: { Accept: "application/json" } });
    assert.equal(missing.status, 404);
    const body = await missing.json();
    assert.equal(body.ok, false);
    assert.ok(body.next.length > 0);
  } finally {
    child.kill("SIGTERM");
    rmSync(dir, { recursive: true, force: true });
  }
});
