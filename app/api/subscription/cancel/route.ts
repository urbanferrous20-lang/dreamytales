import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ANALYTICS_EVENTS, logAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { sendAdminAlert, sendCancellationEmail } from "@/lib/email";
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

  let payfastCancelled = false;
  if (!subscription.payfastToken) {
    console.error(
      "Subscription cancel: no payfastToken stored",
      subscription.id,
      subscription.user.email
    );
    await sendAdminAlert(
      "PayFast cancel skipped — no subscription token",
      [
        "A parent cancelled in Dreamy Tales but we have no PayFast token on file.",
        "Billing was NOT stopped via API — cancel manually in PayFast → Customer Subscriptions.",
        "",
        `Email: ${subscription.user.email}`,
        `Subscription ID: ${subscription.id}`,
        `Status: ${subscription.status} → cancel_pending`,
        `Access ends: ${accessEndsAt.toISOString()}`,
      ].join("\n")
    ).catch(() => {});
  } else {
    const payfast = await cancelPayfastSubscription(subscription.payfastToken);
    payfastCancelled = payfast.ok;
    if (!payfast.ok) {
      console.error(
        "PayFast cancel API failed",
        subscription.id,
        subscription.user.email,
        payfast.error
      );
      await sendAdminAlert(
        "PayFast cancel API failed",
        [
          "A parent cancelled in Dreamy Tales but the PayFast API call failed.",
          "Cancel manually in PayFast → Customer Subscriptions if it still shows active.",
          "",
          `Email: ${subscription.user.email}`,
          `Subscription ID: ${subscription.id}`,
          `PayFast token: ${subscription.payfastToken}`,
          payfast.error ? `Error: ${payfast.error}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      ).catch(() => {});
    }
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

  return NextResponse.json({
    success: true,
    accessEndsAt: accessEndsAt.toISOString(),
    payfastCancelled,
    payfastTokenStored: Boolean(subscription.payfastToken),
  });
}
