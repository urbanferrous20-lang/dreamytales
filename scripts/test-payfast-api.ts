/**
 * Test PayFast REST API auth (ping) and optionally cancel a subscription token.
 *
 * Usage (local or Plesk):
 *   npm run payfast:ping
 *   npm run payfast:cancel -- <payfast-token>
 *
 * Requires PAYFAST_MERCHANT_ID, PAYFAST_PASSPHRASE in .env (Plesk) or .env.local (dev).
 * Live: PAYFAST_SANDBOX=false
 *
 * If ping fails with 401, check PayFast dashboard → Settings → Integration:
 * whitelist your server's outbound IP for API access.
 */
import "dotenv/config";
import { cancelPayfastSubscription, fetchPayfastSubscription, pingPayfastApi } from "../lib/payfast-subscription-api";

function normalizeToken(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/^<|>$/g, "").trim();
}

async function main() {
  console.log("PayFast sandbox:", process.env.PAYFAST_SANDBOX !== "false" ? "yes" : "no (live)");

  console.log("\n1. Ping API…");
  const ping = await pingPayfastApi();
  console.log(ping.ok ? "   OK" : `   FAILED: ${ping.error}`);

  const cancelIdx = process.argv.indexOf("--cancel");
  const token = normalizeToken(cancelIdx >= 0 ? process.argv[cancelIdx + 1] : undefined);

  if (token) {
    console.log("\n2. Fetch subscription…");
    const fetchResult = await fetchPayfastSubscription(token);
    console.log(fetchResult.ok ? "   OK" : `   FAILED: ${fetchResult.error}`);

    console.log("\n3. Cancel subscription…");
    const cancel = await cancelPayfastSubscription(token);
    console.log(cancel.ok ? "   OK — check PayFast dashboard" : `   FAILED: ${cancel.error}`);
  } else {
    console.log("\nTo test cancel: npm run payfast:cancel -- 50e1e8e1-2493-4085-afc2-da0a65972474");
    console.log("(no angle brackets around the token)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
