#!/usr/bin/env node
/**
 * Whitestone local launcher.
 * Human text by default. Pass --json for machines.
 * Listens on 127.0.0.1 only.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PRODUCT = "whitestone";
const AUTHOR = "Aziel Eliab";
const LENS = ["Service", "Clarity", "Peace"];
const DEFAULT_PORT = 4173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".map": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
};

function commandName() {
  const base = basenameArg(process.argv[1] || "");
  if (base === "whitestone") return "whitestone";
  return "node whitestone.mjs";
}

function basenameArg(value) {
  const parts = String(value).split(/[/\\]/);
  return parts[parts.length - 1] || "";
}

function emit(jsonMode, payload, { error = false, code = 0 } = {}) {
  if (jsonMode) {
    const { text: _text, ...machine } = payload;
    process.stdout.write(`${JSON.stringify(machine)}\n`);
  } else if (error) {
    process.stderr.write(`${payload.text}\n`);
  } else {
    process.stdout.write(payload.text.endsWith("\n") ? payload.text : `${payload.text}\n`);
  }
  if (code) process.exitCode = code;
}

function fail(jsonMode, message, next) {
  emit(
    jsonMode,
    {
      ok: false,
      product: PRODUCT,
      author: AUTHOR,
      error: message,
      next,
      text: `${message}\nNext: ${next}`,
    },
    { error: true, code: 1 },
  );
  process.exit(1);
}

function parseArgs(argv) {
  const cmd = commandName();
  const flags = { json: false, help: false, port: null };
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
      continue;
    }
    if (arg === "--port" || arg.startsWith("--port=")) {
      const value = arg === "--port" ? argv[++i] : arg.slice("--port=".length);
      if (value == null || value.startsWith("-")) {
        return { error: `Missing port number.`, next: `${cmd} ui --port ${DEFAULT_PORT}` };
      }
      flags.port = value;
      continue;
    }
    if (arg.startsWith("-")) {
      return { error: `Unknown option "${arg}".`, next: `${cmd} --help` };
    }
    positionals.push(arg);
  }
  return { flags, positionals };
}

function parsePort(raw) {
  const cmd = commandName();
  if (raw == null) return { port: DEFAULT_PORT };
  if (!/^\d+$/.test(String(raw))) {
    return { error: `Port "${raw}" is not a whole number.`, next: `${cmd} ui --port ${DEFAULT_PORT}` };
  }
  const port = Number(raw);
  if (port > 65535) {
    return { error: `Port ${port} is out of range (0–65535).`, next: `${cmd} ui --port ${DEFAULT_PORT}` };
  }
  return { port };
}

function findAppRoot() {
  if (process.env.WHITESTONE_APP_ROOT) {
    const forced = resolve(process.env.WHITESTONE_APP_ROOT);
    return existsSync(join(forced, "index.html")) ? forced : null;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [here, resolve(here, "..", "dist")];
  for (const dir of candidates) {
    if (existsSync(join(dir, "index.html"))) return dir;
  }
  return null;
}

function helpText() {
  const cmd = commandName();
  return `Whitestone — private session for Criminal, Civil, or Divorce procedure

Author: ${AUTHOR}
Lamb Lens: ${LENS.join(" → ")}

Usage:
  ${cmd}                 Welcome and next steps
  ${cmd} ui              Open the local app (127.0.0.1 only)
  ${cmd} doctor          Check this copy
  ${cmd} --help          Show this help

Options:
  --json                 Print JSON for scripts and agents
  --port <n>             Port for ui (default ${DEFAULT_PORT})
  -h, --help             Show this help

Examples:
  ${cmd}
  ${cmd} ui
  ${cmd} ui --port ${DEFAULT_PORT}
  ${cmd} doctor --json

The ui command serves this folder on 127.0.0.1 and prints one link.

Environment:
  WHITESTONE_APP_ROOT    Folder that contains index.html
`;
}

function helpPayload() {
  const cmd = commandName();
  return {
    ok: true,
    product: PRODUCT,
    author: AUTHOR,
    lens: LENS,
    command: "help",
    commands: [
      { name: "(default)", summary: "Welcome and next steps" },
      { name: "ui", summary: "Open the local app on 127.0.0.1" },
      { name: "doctor", summary: "Check this copy" },
    ],
    options: ["--json", "--port", "--help"],
    examples: [`${cmd}`, `${cmd} ui`, `${cmd} doctor --json`],
  };
}

function welcomeText() {
  const cmd = commandName();
  return `Whitestone
A private session for Criminal, Civil, or Divorce procedure in any U.S. state or D.C.

Author: ${AUTHOR}
Lamb Lens: ${LENS.join(" → ")}

Next: start the local app, then pick a practice area.

  ${cmd} ui

Also:
  ${cmd} doctor
  ${cmd} --help
`;
}

function welcomePayload() {
  const cmd = commandName();
  return {
    ok: true,
    product: PRODUCT,
    author: AUTHOR,
    lens: LENS,
    command: "status",
    summary: "A private session for Criminal, Civil, or Divorce procedure.",
    next: [`${cmd} ui`, `${cmd} doctor`, `${cmd} --help`],
  };
}

function nodeCheck() {
  const major = Number(process.versions.node.split(".")[0]);
  const ok = Number.isFinite(major) && major >= 20;
  return {
    name: "node",
    ok,
    detail: `v${process.versions.node}`,
    next: ok ? null : "Install Node.js 20 or newer, then run this command again.",
  };
}

function appCheck() {
  const root = findAppRoot();
  if (root) return { name: "app", ok: true, detail: root, next: null };
  const cmd = commandName();
  return {
    name: "app",
    ok: false,
    detail: "index.html was not found beside this command or in dist/",
    next: `npm run build    or    unzip the standalone zip and run ${cmd} ui inside that folder`,
  };
}

function bindCheck() {
  return new Promise((resolveBind) => {
    const probe = createServer();
    probe.once("error", (err) => {
      resolveBind({
        name: "loopback",
        ok: false,
        detail: err.message,
        next: "Free a local port, then run this command again.",
      });
    });
    probe.listen(0, "127.0.0.1", () => {
      probe.close(() => {
        resolveBind({ name: "loopback", ok: true, detail: "127.0.0.1", next: null });
      });
    });
  });
}

function formatDoctor(checks) {
  const cmd = commandName();
  const lines = ["Whitestone doctor", ""];
  for (const check of checks) {
    lines.push(`  ${check.ok ? "pass" : "fail"}  ${check.name}  ${check.detail}`);
    if (!check.ok && check.next) lines.push(`        Next: ${check.next}`);
  }
  lines.push("");
  const ready = checks.every((check) => check.ok);
  lines.push(ready ? `Ready. Next: ${cmd} ui` : "Not ready. Fix the fail lines above, then run doctor again.");
  return lines.join("\n");
}

async function doctor(jsonMode) {
  const checks = [nodeCheck(), appCheck(), await bindCheck()];
  const ok = checks.every((check) => check.ok);
  const cmd = commandName();
  emit(
    jsonMode,
    {
      ok,
      product: PRODUCT,
      author: AUTHOR,
      command: "doctor",
      checks: checks.map(({ name, ok: passed, detail }) => ({ name, ok: passed, detail })),
      next: ok ? `${cmd} ui` : checks.find((check) => !check.ok)?.next,
      text: formatDoctor(checks),
    },
    { code: ok ? 0 : 1 },
  );
}

function contentType(file) {
  return MIME[extname(file).toLowerCase()] || "application/octet-stream";
}

function wantsJson(req) {
  const accept = String(req.headers.accept || "");
  return accept.includes("application/json");
}

function send(req, res, status, body, type) {
  const payload = req.method === "HEAD" ? Buffer.alloc(0) : body;
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(payload);
}

function safeFile(root, urlPath) {
  let decoded = "/";
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  } catch {
    return { status: 400, message: "That address could not be read." };
  }
  if (decoded.includes("\0")) return { status: 400, message: "That address could not be read." };
  const rel = decoded.replace(/^\/+/, "");
  const rootReal = realpathSync(root);
  let abs = resolve(rootReal, rel);
  if (abs !== rootReal && !abs.startsWith(rootReal + sep)) {
    return { status: 403, message: "That path is outside this app folder." };
  }
  if (!existsSync(abs)) return { status: 404, message: "That file is not in this copy." };
  let stat = statSync(abs);
  if (stat.isDirectory()) {
    abs = join(abs, "index.html");
    if (!existsSync(abs)) return { status: 404, message: "That folder has no index page." };
    stat = statSync(abs);
  }
  if (!stat.isFile()) return { status: 404, message: "That file is not in this copy." };
  const fileReal = realpathSync(abs);
  if (fileReal !== rootReal && !fileReal.startsWith(rootReal + sep)) {
    return { status: 403, message: "That path is outside this app folder." };
  }
  return { file: fileReal };
}

function startUi(jsonMode, port) {
  const cmd = commandName();
  const root = findAppRoot();
  if (!root) {
    fail(
      jsonMode,
      "index.html was not found, so the local app cannot start.",
      `npm run build    or    unzip the standalone zip and run ${cmd} ui inside that folder`,
    );
    return;
  }

  const server = createServer((req, res) => {
    const method = req.method || "GET";
    if (method !== "GET" && method !== "HEAD") {
      const message = "This local app accepts GET only.";
      const next = "Open the printed link in a browser.";
      if (wantsJson(req)) {
        send(req, res, 405, JSON.stringify({ ok: false, error: message, next }), "application/json; charset=utf-8");
      } else {
        send(req, res, 405, `${message}\nNext: ${next}\n`, "text/plain; charset=utf-8");
      }
      return;
    }
    const found = safeFile(root, req.url || "/");
    if (!found.file) {
      const next = "Open / for the Whitestone screen.";
      if (wantsJson(req)) {
        send(
          req,
          res,
          found.status,
          JSON.stringify({ ok: false, error: found.message, next }),
          "application/json; charset=utf-8",
        );
      } else {
        send(req, res, found.status, `${found.message}\nNext: ${next}\n`, "text/plain; charset=utf-8");
      }
      return;
    }
    res.writeHead(200, {
      "Content-Type": contentType(found.file),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(found.file).pipe(res);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const hint = port === 0 ? `${cmd} ui --port ${DEFAULT_PORT}` : `${cmd} ui --port ${port + 1}`;
      fail(jsonMode, `Port ${port} is already in use.`, hint);
      return;
    }
    fail(jsonMode, `Could not listen on 127.0.0.1:${port}. ${err.message}`, `${cmd} doctor`);
  });

  server.listen(port, "127.0.0.1", () => {
    const address = server.address();
    const actual = address && typeof address === "object" ? address.port : port;
    const url = `http://127.0.0.1:${actual}/`;
    emit(jsonMode, {
      ok: true,
      product: PRODUCT,
      author: AUTHOR,
      command: "ui",
      url,
      host: "127.0.0.1",
      port: actual,
      text: `Open ${url}`,
    });
  });
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const jsonMode = Boolean(parsed.flags?.json);
  if (parsed.error) {
    fail(jsonMode, parsed.error, parsed.next);
    return;
  }
  if (parsed.flags.help || parsed.positionals[0] === "help") {
    emit(jsonMode, { ...helpPayload(), text: helpText() });
    return;
  }
  const [command, extra] = parsed.positionals;
  if (extra) {
    fail(jsonMode, `Unknown command "${extra}".`, `${commandName()} --help`);
    return;
  }
  if (!command) {
    emit(jsonMode, { ...welcomePayload(), text: welcomeText() });
    return;
  }
  if (command === "doctor") {
    await doctor(jsonMode);
    return;
  }
  if (command === "ui") {
    const port = parsePort(parsed.flags.port);
    if (port.error) {
      fail(jsonMode, port.error, port.next);
      return;
    }
    startUi(jsonMode, port.port);
    return;
  }
  fail(jsonMode, `Unknown command "${command}".`, `${commandName()} ui    or    ${commandName()} --help`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : "Unexpected error";
  fail(false, `Whitestone stopped: ${message}`, `${commandName()} doctor`);
});
