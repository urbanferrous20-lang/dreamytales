import { NextRequest, NextResponse } from "next/server";
import { signupSchema } from "@/lib/types/child";
import { hashPassword } from "@/lib/auth";
import { ANALYTICS_EVENTS, logAnalyticsEventFromRequest } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { recurringCharge, TRIAL_DAYS, type BillingInterval } from "@/lib/pricing";
import {
  addDays,
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

    const existing = await prisma.user.findUnique({ where: { email } });
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
        email,
        name,
        passwordHash,
        childrenJson: JSON.stringify(children),
        billingInterval,
        agreedToTerms: true,
        expiresAt: addDays(new Date(), 1),
      },
    });

    await logAnalyticsEventFromRequest(request, {
      eventType: ANALYTICS_EVENTS.SIGNUP_SUBMIT,
      path: "/signup",
      metadata: { signupId, childCount: children.length, billingInterval },
    });

    const formData = buildSubscriptionFormData({
      mPaymentId: signupId,
      amount: "0.00",
      recurringAmount: recurringAmount.toFixed(2),
      billingInterval,
      itemName: "Dreamy Tales Subscription",
      itemDescription: `${children.length} child(ren) - ${billingInterval === "annual" ? "annual" : "monthly"} bedtime short stories`,
      emailAddress: email,
      nameFirst: firstName,
      nameLast: lastName,
      billingDate,
    });

    return NextResponse.json({
      checkoutForm: {
        ...formData,
        _action: getPayfastProcessUrl(),
      },
    });
  } catch (error) {
    console.error("Signup error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Signup failed. Please try again." }, { status: 500 });
  }
}
