// Plesk Node.js startup file — uses PORT from Plesk and forces production mode.
process.env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");

const buildIdPath = path.join(__dirname, ".next", "BUILD_ID");
if (!fs.existsSync(buildIdPath)) {
  console.error(
    "[dreamy-tales] Missing production build (.next/BUILD_ID).\n" +
      "In Plesk → Node.js → Run script, run: build\n" +
      "Then click Restart Node.js."
  );
  process.exit(1);
}

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

const { nextStart } = require("next/dist/cli/next-start");

nextStart({ port, hostname }).catch((error) => {
  console.error("[dreamy-tales] Failed to start Next.js:", error);
  process.exit(1);
});
