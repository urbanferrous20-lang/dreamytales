import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendSmtpMail } from "@/lib/smtp";
import { upgradeSubscriptionToAudio } from "@/lib/subscription-upgrade";
import { prisma } from "@/lib/db";
import {
  billingCadenceLabel,
  billingIntervalLabel,
  formatPlanSummary,
  formatZar,
  type BillingInterval,
} from "@/lib/pricing";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await upgradeSubscriptionToAudio(session.userId);
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Upgrade failed" }, { status: 400 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });

  if (subscription) {
    const interval = (subscription.billingInterval === "annual"
      ? "annual"
      : "monthly") as BillingInterval;

    try {
      await sendSmtpMail({
        to: subscription.user.email,
        subject: "Your Dreamy Tales plan now includes audio narration",
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; color: #1e293b;">
            <p>Hi ${subscription.user.name.split(" ")[0]},</p>
            <p>Your subscription is now <strong>PDF + Audio</strong>. From tonight&apos;s story onward you&apos;ll receive
            <strong>one email</strong> with both the illustrated PDF and the MP3 narration attached.</p>
            <p>New billing: ${formatPlanSummary(subscription.childCount, interval, "pdf_audio")}
            (${billingIntervalLabel(interval)} · ${formatZar(result.newAmount!)}/${billingCadenceLabel(interval)} via PayFast)</p>
            <p style="color: #64748b; font-size: 14px;">Sweet dreams from Dreamy Tales.</p>
          </div>
        `,
      });
    } catch {
      // Upgrade succeeded — email failure is non-fatal
    }
  }

  return NextResponse.json({
    success: true,
    newAmount: result.newAmount,
    storyPlan: "pdf_audio",
  });
}
