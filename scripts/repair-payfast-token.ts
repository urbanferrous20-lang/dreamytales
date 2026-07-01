/**
 * Manually attach a PayFast subscription token when ITN did not store it.
 *
 * Usage:
 *   npx tsx scripts/repair-payfast-token.ts user@example.com <payfast-token-uuid>
 *
 * Get the token from PayFast ITN logs, support, or your server logs when ITN fired.
 */
import { prisma } from "../lib/db";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const token = process.argv[3]?.trim();

  if (!email || !token) {
    console.error("Usage: npx tsx scripts/repair-payfast-token.ts <email> <payfast-token>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });

  if (!user?.subscription) {
    console.error("No subscription found for", email);
    process.exit(1);
  }

  await prisma.subscription.update({
    where: { id: user.subscription.id },
    data: { payfastToken: token },
  });

  console.log("Updated payfastToken for", email);
  console.log("Subscription status:", user.subscription.status);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
