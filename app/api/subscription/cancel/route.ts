import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ANALYTICS_EVENTS, logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { sendCancellationEmail } from "@/lib/email";
import { cancelPayfastSubscription } from "@/lib/payfast";
import { getCancellationTerms } from "@/lib/subscription-cancellation";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });

  if (!subscription || ["cancelled", "cancel_pending"].includes(subscription.status)) {
    return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
  }

  const terms = getCancellationTerms(subscription);
  const { accessEndsAt } = terms;

  if (subscription.payfastToken) {
    await cancelPayfastSubscription(subscription.payfastToken);
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "cancel_pending",
      cancelRequestedAt: new Date(),
      accessEndsAt,
    },
  });

  await logAnalyticsEvent({
    eventType: ANALYTICS_EVENTS.SUBSCRIPTION_CANCELLED,
    sessionId: subscription.id,
    metadata: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      isTrial: terms.isTrial,
    },
  });

  try {
    await sendCancellationEmail({
      to: subscription.user.email,
      parentName: subscription.user.name,
      accessEndsAt,
    });
  } catch {
    // Email failure should not block cancellation
  }

  return NextResponse.json({ success: true, accessEndsAt: accessEndsAt.toISOString() });
}
