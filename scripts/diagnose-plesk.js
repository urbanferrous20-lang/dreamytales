#!/usr/bin/env node
/**
 * Run on Plesk in Node.js → Run Node.js commands:
 *   node scripts/diagnose-plesk.js
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const lines = [];

function loadEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return false;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
  return true;
}

loadEnvFile();

function ok(msg) {
  lines.push(`OK  ${msg}`);
}

function fail(msg) {
  lines.push(`FAIL ${msg}`);
}

function info(msg) {
  lines.push(`     ${msg}`);
}

ok(`Node ${process.version}`);
info(`cwd: ${root}`);

const buildId = path.join(root, ".next", "BUILD_ID");
if (fs.existsSync(buildId)) {
  ok(`.next/BUILD_ID exists (${fs.readFileSync(buildId, "utf8").trim()})`);
} else {
  fail(".next/BUILD_ID missing — run: npm run build");
}

if (fs.existsSync(path.join(root, "node_modules", "next"))) {
  ok("next is installed");
} else {
  fail("node_modules/next missing — run NPM install in Plesk");
}

if (fs.existsSync(path.join(root, ".env"))) {
  ok(".env file exists (variables loaded for this check)");
} else {
  fail(".env file missing in httpdocs (DATABASE_URL and secrets)");
}

info(`PORT=${process.env.PORT ?? "(not set in this shell — Plesk sets it when the app runs)"}`);
info(`HOSTNAME=${process.env.HOSTNAME ?? "(not set)"}`);
if (process.env.HOSTNAME) {
  info("Do not bind the app to HOSTNAME — start.js ignores it on purpose.");
}

for (const key of ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"]) {
  if (process.env[key]) ok(`${key} is set`);
  else fail(`${key} is not set`);
}

if (process.env.ADMIN_EMAIL?.trim()) ok("ADMIN_EMAIL is set");
else fail("ADMIN_EMAIL is not set");

if (process.env.ADMIN_PASSWORD?.trim()) {
  ok("ADMIN_PASSWORD is set (plain password — OK for Plesk)");
} else if (process.env.ADMIN_PASSWORD_HASH_B64?.trim()) {
  try {
    const decoded = Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64.trim(), "base64")
      .toString("utf8")
      .trim();
    if (decoded.startsWith("$2")) ok("ADMIN_PASSWORD_HASH_B64 decodes to a valid bcrypt hash");
    else {
      fail(
        "ADMIN_PASSWORD_HASH_B64 is not a bcrypt hash — you may have pasted the plain password. Use ADMIN_PASSWORD=... instead"
      );
    }
  } catch {
    fail("ADMIN_PASSWORD_HASH_B64 is not valid base64");
  }
} else {
  fail("Admin password not set — add ADMIN_PASSWORD=your-password to .env");
}

if (isSmtpConfigured()) {
  ok("SMTP is configured (SMTP_HOST, SMTP_USER, SMTP_PASS)");
  info(`SMTP_FROM=${process.env.SMTP_FROM ?? "(default)"}`);
} else {
  fail("SMTP not configured — password reset and story emails will not send");
  info("Add SMTP_HOST, SMTP_USER, SMTP_PASS to .env (see .env.example)");
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const startJs = path.join(root, "start.js");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (fs.existsSync(startJs)) ok("start.js exists");
else fail("start.js missing in httpdocs");
if (fs.existsSync(nextBin)) ok("next CLI binary exists");
else fail("next CLI binary missing — run NPM install");

try {
  require("next/dist/cli/next-start");
  ok("next start module loads");
} catch (error) {
  info(`next/dist/cli/next-start: ${error.message} (start.js uses next CLI binary instead)`);
}

console.log("\nDreamy Tales Plesk diagnostics\n");
for (const line of lines) console.log(line);
console.log("");

const failed = lines.some((line) => line.startsWith("FAIL"));
process.exit(failed ? 1 : 0);
