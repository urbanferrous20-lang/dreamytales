/**
 * Test PayFast REST API auth (ping) and optionally cancel a subscription token.
 *
 * Usage:
 *   npx tsx scripts/test-payfast-api.ts
 *   npx tsx scripts/test-payfast-api.ts --cancel <payfast-token>
 *
 * Requires PAYFAST_MERCHANT_ID, PAYFAST_PASSPHRASE in .env / .env.local
 * Live: PAYFAST_SANDBOX=false
 *
 * If ping fails with 401, check PayFast dashboard → Settings → Integration:
 * whitelist your server's outbound IP for API access.
 */
import "dotenv/config";
import { cancelPayfastSubscription, fetchPayfastSubscription, pingPayfastApi } from "../lib/payfast-subscription-api";

async function main() {
  console.log("PayFast sandbox:", process.env.PAYFAST_SANDBOX !== "false" ? "yes" : "no (live)");

  console.log("\n1. Ping API…");
  const ping = await pingPayfastApi();
  console.log(ping.ok ? "   OK" : `   FAILED: ${ping.error}`);

  const cancelIdx = process.argv.indexOf("--cancel");
  const token = cancelIdx >= 0 ? process.argv[cancelIdx + 1]?.trim() : undefined;

  if (token) {
    console.log("\n2. Fetch subscription…");
    const fetchResult = await fetchPayfastSubscription(token);
    console.log(fetchResult.ok ? "   OK" : `   FAILED: ${fetchResult.error}`);

    console.log("\n3. Cancel subscription…");
    const cancel = await cancelPayfastSubscription(token);
    console.log(cancel.ok ? "   OK — check PayFast dashboard" : `   FAILED: ${cancel.error}`);
  } else {
    console.log("\nTo test cancel: npx tsx scripts/test-payfast-api.ts --cancel <token>");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
