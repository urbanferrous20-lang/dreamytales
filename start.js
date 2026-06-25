// Plesk Node.js startup file — uses PORT from Plesk and forces production mode.
process.env.NODE_ENV = "production";

const nextStart = require("next/dist/cli/next-start");

nextStart.nextStart({
  port: process.env.PORT || 3000,
});
