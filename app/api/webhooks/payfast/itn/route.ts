import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  addDays,
  parseItnPostBody,
  validateItnWithPayfast,
  verifyPayfastItnSignature,
} from "@/lib/payfast";
import { activateSignup } from "@/lib/signup-activate";

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
  const token = data.token;

  if (paymentStatus === "COMPLETE") {
    if (signupId) {
      const activated = await activateSignup(signupId, token);
      if (!activated) {
        console.error("PayFast ITN: could not activate signup", signupId);
      }
    }

    if (token) {
      const user = await prisma.user.findFirst({
        where: { subscription: { payfastToken: token } },
        include: { subscription: true },
      });

      if (!user && signupId) {
        const byEmail = data.email_address
          ? await prisma.user.findUnique({
              where: { email: data.email_address.toLowerCase() },
              include: { subscription: true },
            })
          : null;
        if (byEmail?.subscription) {
          await prisma.subscription.update({
            where: { id: byEmail.subscription.id },
            data: { payfastToken: token },
          });
        }
      }

      if (user?.subscription) {
        const interval = user.subscription.billingInterval === "annual" ? "annual" : "monthly";
        const fallbackDays = interval === "annual" ? 365 : 30;
        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            status: user.subscription.status === "pending" ? "trial" : user.subscription.status,
            payfastToken: token,
            nextBillingDate: data.billing_date
              ? new Date(data.billing_date)
              : addDays(new Date(), fallbackDays),
          },
        });
      }

      const amount = parseFloat(data.amount_gross ?? data.amount ?? "0");
      if (amount > 0) {
        const payfastPaymentId = data.pf_payment_id ?? data.m_payment_id ?? null;
        const paymentUser =
          user ??
          (data.email_address
            ? await prisma.user.findUnique({
                where: { email: data.email_address.toLowerCase() },
                include: { subscription: true },
              })
            : null);

        if (payfastPaymentId && paymentUser) {
          await prisma.payment.upsert({
            where: { payfastPaymentId },
            create: {
              userId: paymentUser.id,
              subscriptionId: paymentUser.subscription?.id ?? null,
              payfastPaymentId,
              amountGross: amount,
              amountFee: parseFloat(data.amount_fee ?? "0"),
              paymentStatus: "COMPLETE",
              billingDate: data.billing_date ? new Date(data.billing_date) : null,
            },
            update: {
              amountGross: amount,
              amountFee: parseFloat(data.amount_fee ?? "0"),
              paymentStatus: "COMPLETE",
            },
          });
        }
      }
    }
  }

  if (paymentStatus === "CANCELLED" && token) {
    await prisma.subscription.updateMany({
      where: { payfastToken: token },
      data: { status: "cancelled" },
    });
  }

  return new NextResponse("OK", { status: 200 });
}
