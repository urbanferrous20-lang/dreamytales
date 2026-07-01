import "server-only";
import { prisma } from "@/lib/db";
import { sendAdminAlert } from "@/lib/email";
import { updatePayfastSubscription } from "@/lib/payfast";
import {
  recurringCharge,
  type BillingInterval,
} from "@/lib/pricing";

export async function upgradeSubscriptionToAudio(userId: string): Promise<{
  success: boolean;
  error?: string;
  newAmount?: number;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!subscription) {
    return { success: false, error: "No subscription found." };
  }

  if (!["trial", "active"].includes(subscription.status)) {
    return { success: false, error: "Your subscription is not active." };
  }

  if (subscription.storyPlan === "pdf_audio") {
    return { success: false, error: "You already have the PDF + Audio plan." };
  }

  if (!subscription.payfastToken) {
    return {
      success: false,
      error: "We could not update billing automatically. Please contact support@dreamytales.co.za.",
    };
  }

  const billingInterval = (
    subscription.billingInterval === "annual" ? "annual" : "monthly"
  ) as BillingInterval;

  const newAmount = recurringCharge(
    subscription.childCount,
    billingInterval,
    "pdf_audio"
  );

  const payfast = await updatePayfastSubscription({
    token: subscription.payfastToken,
    recurringAmount: newAmount.toFixed(2),
    billingInterval,
  });

  if (!payfast.ok) {
    console.error("PayFast plan upgrade failed:", payfast.error);
    await sendAdminAlert(
      "PayFast audio upgrade failed",
      `User ${subscription.user.email} (${userId})\n${payfast.error ?? "Unknown error"}`
    );
    return {
      success: false,
      error: "PayFast could not update your billing. Please try again or email support@dreamytales.co.za.",
    };
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      storyPlan: "pdf_audio",
      recurringAmount: newAmount,
    },
  });

  return { success: true, newAmount };
}
