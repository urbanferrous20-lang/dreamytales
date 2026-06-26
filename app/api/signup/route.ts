import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/types/child";
import { hashPassword } from "@/lib/auth";
import { ANALYTICS_EVENTS, logAnalyticsEventFromRequest } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { recurringCharge, TRIAL_DAYS, type BillingInterval } from "@/lib/pricing";
import {
  addDays,
  buildPayfastRedirectHtml,
  buildSubscriptionFormData,
  formatBillingDate,
  getPayfastProcessUrl,
} from "@/lib/payfast";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid signup data" },
        { status: 400 }
      );
    }

    const { name, email, password, children, billingInterval } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const signupId = crypto.randomUUID();
    const billingDate = formatBillingDate(addDays(new Date(), TRIAL_DAYS));
    const recurringAmount = recurringCharge(children.length, billingInterval);
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] ?? name;
    const lastName = nameParts.slice(1).join(" ") || firstName;

    await prisma.pendingSignup.create({
      data: {
        id: signupId,
        email: normalizedEmail,
        name,
        passwordHash,
        childrenJson: JSON.stringify(children),
        billingInterval,
        agreedToTerms: true,
        expiresAt: addDays(new Date(), 7),
      },
    });

    await logAnalyticsEventFromRequest(request, {
      eventType: ANALYTICS_EVENTS.SIGNUP_SUBMIT,
      sessionId: signupId,
      path: "/signup",
      metadata: { signupId, email: normalizedEmail, childCount: children.length, billingInterval },
    });

    const formData = buildSubscriptionFormData({
      mPaymentId: signupId,
      amount: "0.00",
      recurringAmount: recurringAmount.toFixed(2),
      billingInterval,
      itemName: "Dreamy Tales Subscription",
      itemDescription: `${children.length} child(ren) - ${billingInterval === "annual" ? "annual" : "monthly"} bedtime short stories`,
      emailAddress: normalizedEmail,
      nameFirst: firstName,
      nameLast: lastName,
      billingDate,
    });

    const actionUrl = getPayfastProcessUrl();
    return new NextResponse(
      buildPayfastRedirectHtml(formData, actionUrl, { signupId, email: normalizedEmail }),
      {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("PayFast")
        ? error.message
        : "Signup failed. Please try again.";
    console.error("Signup error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
