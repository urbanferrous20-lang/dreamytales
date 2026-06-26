#!/usr/bin/env node
/**
 * Run on Plesk in Node.js → Run Node.js commands:
 *   node scripts/diagnose-plesk.js
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const lines = [];

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
  ok(".env file exists");
} else {
  fail(".env file missing in httpdocs (DATABASE_URL and secrets)");
}

info(`PORT=${process.env.PORT ?? "(not set — start.js defaults to 3000)"}`);
info(`HOSTNAME=${process.env.HOSTNAME ?? "(not set)"}`);
if (process.env.HOSTNAME) {
  info("Do not bind the app to HOSTNAME — start.js ignores it on purpose.");
}

for (const key of ["DATABASE_URL", "AUTH_SECRET", "NEXT_PUBLIC_APP_URL"]) {
  if (process.env[key]) ok(`${key} is set`);
  else fail(`${key} is not set`);
}

try {
  require("next/dist/cli/next-start");
  ok("next/dist/cli/next-start loads");
} catch (error) {
  fail(`next start module: ${error.message}`);
}

console.log("\nDreamy Tales Plesk diagnostics\n");
for (const line of lines) console.log(line);
console.log("");

const failed = lines.some((line) => line.startsWith("FAIL"));
process.exit(failed ? 1 : 0);
