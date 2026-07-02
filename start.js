// Plesk Node.js startup file — uses PORT from Plesk and forces production mode.
process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");

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

// Plesk sets HOSTNAME to the server hostname — never bind to that.
delete process.env.HOSTNAME;

console.log(
  `[dreamy-tales] Starting Next.js on 0.0.0.0:${port} (build ${fs.readFileSync(buildIdPath, "utf8").trim()})`
);

// Run Next in THIS process. Passenger/Plesk waits for the startup file to listen on PORT;
// spawning "next start" as a child causes "timeout while spawning" after crashes.
require("next/dist/server/require-hook");
const { nextStart } = require("next/dist/cli/next-start");

nextStart({ port, hostname: "0.0.0.0" }, root).catch((error) => {
  console.error("[dreamy-tales] Failed to start Next.js:", error);
  process.exit(1);
});
