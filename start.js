// Plesk Node.js startup file — uses PORT from Plesk and forces production mode.
process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = __dirname;
const buildIdPath = path.join(root, ".next", "BUILD_ID");

if (!fs.existsSync(buildIdPath)) {
  console.error(
    "[dreamy-tales] Missing production build (.next/BUILD_ID).\n" +
      "In Plesk → Node.js → Run script, run: build\n" +
      "Then click Restart Node.js."
  );
  process.exit(1);
}

const port = parseInt(process.env.PORT || "3000", 10);
if (Number.isNaN(port)) {
  console.error("[dreamy-tales] Invalid PORT:", process.env.PORT);
  process.exit(1);
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error("[dreamy-tales] Next.js binary missing — run NPM install in Plesk.");
  process.exit(1);
}

// Bind 0.0.0.0 so Plesk's reverse proxy can reach the app (never use HOSTNAME).
console.log(`[dreamy-tales] Starting Next.js on 0.0.0.0:${port} (build ${fs.readFileSync(buildIdPath, "utf8").trim()})`);

const child = spawn(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("error", (error) => {
  console.error("[dreamy-tales] Failed to spawn Next.js:", error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[dreamy-tales] Next.js killed by signal ${signal}`);
  } else if (code !== 0) {
    console.error(`[dreamy-tales] Next.js exited with code ${code}`);
  }
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
