/**
 * Repair subscriptions for paid signups that never activated.
 * Run on Plesk: npm run repair:activations
 */
import { PrismaClient } from "@prisma/client";
import { activateSignup } from "../lib/signup-activate";

const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.pendingSignup.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${pending.length} pending signup(s).`);

  let activated = 0;
  for (const signup of pending) {
    const user = await activateSignup(signup.id);
    if (user) {
      activated += 1;
      console.log(`Activated ${signup.email} (${signup.id})`);
    } else {
      console.log(`Skipped ${signup.email} (${signup.id}) — could not activate`);
    }
  }

  const missingSubscription = await prisma.user.findMany({
    where: { subscription: null },
    select: { id: true, email: true },
  });

  if (missingSubscription.length > 0) {
    console.log("\nAccounts still missing a subscription:");
    for (const user of missingSubscription) {
      console.log(`- ${user.email} (${user.id})`);
    }
  }

  const activeSubscribers = await prisma.subscription.count({
    where: { status: { in: ["trial", "active"] } },
  });

  console.log(`\nDone. Activated ${activated} signup(s). Active subscribers: ${activeSubscribers}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
