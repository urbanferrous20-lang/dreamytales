#!/usr/bin/env node
/**
 * Run on the server before npm install:
 *   node scripts/verify-deploy-files.js
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const errors = [];
const ok = [];

function checkFile(relativePath, mustContain) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    errors.push(`MISSING: ${relativePath}`);
    return;
  }
  const content = fs.readFileSync(full, "utf8");
  for (const snippet of mustContain) {
    if (!content.includes(snippet)) {
      const preview = content.split("\n").slice(0, 3).join(" | ");
      errors.push(
        `WRONG CONTENT in ${relativePath} — expected "${snippet}". First lines: ${preview}`
      );
      return;
    }
  }
  ok.push(`OK: ${relativePath}`);
}

function checkFileMustNotContain(relativePath, forbidden) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) {
    errors.push(`MISSING: ${relativePath}`);
    return;
  }
  const content = fs.readFileSync(full, "utf8");
  for (const snippet of forbidden) {
    if (content.includes(snippet)) {
      errors.push(
        `CORRUPT: ${relativePath} contains "${snippet}" — this looks like the wrong file was uploaded. Re-upload from GitHub ZIP.`
      );
      return;
    }
  }
  ok.push(`OK (not corrupt): ${relativePath}`);
}

checkFile("prisma/schema.prisma", ["generator client", "datasource db", "model User"]);
checkFileMustNotContain("prisma/schema.prisma", ["JsonLdProps", "application/ld+json"]);
checkFile("components/JsonLd.tsx", ["export function JsonLd"]);
checkFile("start.js", [
  "next/dist/cli/next-start",
  "0.0.0.0",
  "[dreamy-tales] Starting Next.js",
]);
checkFile("package.json", ['"name": "dreamy-tales"']);

console.log("\nDreamy Tales deploy file check");
console.log(`Working directory: ${root}\n`);
for (const line of ok) console.log("  ✓", line);
for (const line of errors) console.error("  ✗", line);

if (errors.length > 0) {
  console.error("\nFix the files above BEFORE running npm install.");
  console.error("Common causes:");
  console.error("  1. ZIP extracted into httpdocs/dreamytales-main/ instead of httpdocs/ itself");
  console.error("  2. Old broken files not deleted before re-upload");
  console.error("  3. Node.js Application root is not /httpdocs");
  console.error("\nFix: delete ALL files in httpdocs, upload dreamytales-deploy.zip, extract in place.");
  console.error("GitHub ZIP: https://github.com/urbanferrous20-lang/dreamytales/archive/refs/heads/main.zip");
  process.exit(1);
}

console.log("\nAll checks passed. Safe to run: npm install\n");
process.exit(0);
