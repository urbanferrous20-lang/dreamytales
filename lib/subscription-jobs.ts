import "server-only";
import { prisma } from "@/lib/db";
import { sendAdminAlert } from "@/lib/email";
import { cancelPayfastSubscription } from "@/lib/payfast";

export async function processDueCancellations(): Promise<{ processed: number; errors: string[] }> {
  const due = await prisma.subscription.findMany({
    where: {
      status: "cancel_pending",
      accessEndsAt: { lte: new Date() },
      payfastToken: { not: null },
    },
  });

  const errors: string[] = [];
  let processed = 0;

  for (const subscription of due) {
    const token = subscription.payfastToken!;
    const cancelled = await cancelPayfastSubscription(token);

    if (!cancelled) {
      errors.push(`PayFast cancellation failed for subscription ${subscription.id}`);
      await sendAdminAlert(
        "PayFast cancellation failed",
        `Subscription ${subscription.id} — manual intervention needed`
      );
      continue;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "cancelled" },
    });
    processed += 1;
  }

  return { processed, errors };
}
