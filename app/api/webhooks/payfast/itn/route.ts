import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ANALYTICS_EVENTS, logAnalyticsEvent } from "@/lib/analytics";
import {
  addDays,
  parseItnPostBody,
  validateItnWithPayfast,
  verifyPayfastItnSignature,
} from "@/lib/payfast";
import { activateSignup } from "@/lib/signup-activate";
import { recordAffiliateConversionOnPaidPayment } from "@/lib/affiliate";
import {
  alertMissingPayfastToken,
  extractPayfastSubscriptionToken,
  persistPayfastSubscriptionToken,
} from "@/lib/payfast-subscription-token";
import type { Prisma } from "@prisma/client";

type UserWithSubscription = Prisma.UserGetPayload<{ include: { subscription: true } }>;

async function resolvePaymentUser(params: {
  signupId?: string;
  email?: string;
  token?: string;
}): Promise<UserWithSubscription | null> {
  if (params.signupId) {
    const pending = await prisma.pendingSignup.findUnique({ where: { id: params.signupId } });
    if (pending) {
      const byEmail = await prisma.user.findUnique({
        where: { email: pending.email.toLowerCase() },
        include: { subscription: true },
      });
      if (byEmail) return byEmail;
    }
  }

  if (params.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: params.email.toLowerCase() },
      include: { subscription: true },
    });
    if (byEmail) return byEmail;
  }

  if (params.token) {
    return prisma.user.findFirst({
      where: { subscription: { payfastToken: params.token } },
      include: { subscription: true },
    });
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const { data, keyOrder } = parseItnPostBody(body);

  if (!verifyPayfastItnSignature(data, keyOrder)) {
    console.error("PayFast ITN: invalid signature");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const valid = await validateItnWithPayfast(body);
  if (!valid) {
    console.error("PayFast ITN: validation failed");
    return new NextResponse("Invalid ITN", { status: 400 });
  }

  const signupId = data.custom_str1 ?? data.m_payment_id;
  const paymentStatus = data.payment_status;
  const token = extractPayfastSubscriptionToken(data);
  const email = data.email_address?.trim().toLowerCase();
  const isSubscriptionItn = data.subscription_type === "1" || data.subscription_type === "2";

  if (paymentStatus === "COMPLETE") {
    let user: UserWithSubscription | null = null;

    if (signupId) {
      const activated = await activateSignup(signupId, token ?? undefined);
      if (!activated) {
        const pendingStill = await prisma.pendingSignup.findUnique({ where: { id: signupId } });
        if (pendingStill) {
          console.error("PayFast ITN: could not activate signup", signupId);
          return new NextResponse("Activation failed", { status: 500 });
        }
      } else {
        user = await prisma.user.findUnique({
          where: { id: activated.id },
          include: { subscription: true },
        });
      }
    }

    if (!user) {
      user = await resolvePaymentUser({ signupId, email, token: token ?? undefined });
    }

    if (user?.subscription) {
      const interval = user.subscription.billingInterval === "annual" ? "annual" : "monthly";
      const fallbackDays = interval === "annual" ? 365 : 30;
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: user.subscription.status === "pending" ? "trial" : user.subscription.status,
          ...(token ? { payfastToken: token } : {}),
          nextBillingDate: data.billing_date
            ? new Date(data.billing_date)
            : addDays(new Date(), fallbackDays),
        },
      });
    } else if (token) {
      await persistPayfastSubscriptionToken({ token, signupId, email });
    }

    if (isSubscriptionItn && !token) {
      await alertMissingPayfastToken({ signupId, email, paymentStatus });
    }

    const amount = parseFloat(data.amount_gross ?? data.amount ?? "0");
    const payfastPaymentId = data.pf_payment_id ?? data.m_payment_id ?? null;

    let paymentRecordId: string | null = null;

    if (payfastPaymentId && user) {
      const payment = await prisma.payment.upsert({
        where: { payfastPaymentId },
        create: {
          userId: user.id,
          subscriptionId: user.subscription?.id ?? null,
          payfastPaymentId,
          signupId: signupId ?? null,
          amountGross: amount,
          amountFee: parseFloat(data.amount_fee ?? "0"),
          paymentStatus: "COMPLETE",
          billingDate: data.billing_date ? new Date(data.billing_date) : null,
        },
        update: {
          userId: user.id,
          subscriptionId: user.subscription?.id ?? null,
          signupId: signupId ?? null,
          amountGross: amount,
          amountFee: parseFloat(data.amount_fee ?? "0"),
          paymentStatus: "COMPLETE",
        },
      });
      paymentRecordId = payment.id;
    }

    if (paymentRecordId && user && amount > 0) {
      await recordAffiliateConversionOnPaidPayment({
        userId: user.id,
        subscriptionId: user.subscription?.id,
        paymentId: paymentRecordId,
        amountGross: amount,
      });
    }

    await logAnalyticsEvent({
      eventType: ANALYTICS_EVENTS.PAYFAST_PAYMENT_COMPLETE,
      sessionId: signupId ?? payfastPaymentId ?? email ?? "unknown",
      metadata: {
        signupId,
        email,
        amount,
        payfastPaymentId,
        activated: Boolean(user),
      },
    });
  }

  if (paymentStatus === "CANCELLED" && token) {
    await prisma.subscription.updateMany({
      where: { payfastToken: token },
      data: { status: "cancelled" },
    });
  }

  return new NextResponse("OK", { status: 200 });
}
