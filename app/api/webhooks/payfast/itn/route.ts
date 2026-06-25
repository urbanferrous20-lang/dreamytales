import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { ANALYTICS_EVENTS, logAnalyticsEvent } from "@/lib/analytics";
import { generateCharacterBible } from "@/lib/story-generator";
import { signupSchema, type ChildProfileInput } from "@/lib/types/child";
import { recurringCharge, TRIAL_DAYS, type BillingInterval } from "@/lib/pricing";
import { addDays, validateItnWithPayfast } from "@/lib/payfast";

function parseItnBody(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

function verifyItnSignature(data: Record<string, string>): boolean {
  const received = data.signature;
  if (!received) return false;

  const pfData = { ...data };
  delete pfData.signature;

  const ordered = Object.keys(pfData)
    .filter((k) => pfData[k] !== "")
    .sort();
  const paramString = ordered
    .map((k) => `${k}=${encodeURIComponent(pfData[k]).replace(/%20/g, "+")}`)
    .join("&");
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
  const expected = crypto
    .createHash("md5")
    .update(`${paramString}&passphrase=${passphrase}`)
    .digest("hex");

  return expected === received;
}

async function activateSignup(signupId: string, payfastToken?: string) {
  const pending = await prisma.pendingSignup.findUnique({ where: { id: signupId } });
  if (!pending) return;

  const children = JSON.parse(pending.childrenJson) as ChildProfileInput[];
  const parsed = signupSchema.safeParse({
    name: pending.name,
    email: pending.email,
    password: "placeholder123",
    agreedToTerms: true,
    children,
  });
  if (!parsed.success) return;

  const existing = await prisma.user.findUnique({ where: { email: pending.email } });
  if (existing) return;

  const billingInterval = (pending.billingInterval === "annual" ? "annual" : "monthly") as BillingInterval;

  const user = await prisma.user.create({
    data: {
      email: pending.email,
      name: pending.name,
      passwordHash: pending.passwordHash,
      subscription: {
        create: {
          status: "trial",
          payfastToken: payfastToken ?? null,
          recurringAmount: recurringCharge(children.length, billingInterval),
          childCount: children.length,
          billingInterval,
          trialEndsAt: addDays(new Date(), TRIAL_DAYS),
        },
      },
    },
  });

  for (const child of children) {
    let characterBible: string | null = null;
    try {
      if (process.env.DEEPSEEK_API_KEY) {
        const bible = await generateCharacterBible(child);
        characterBible = JSON.stringify(bible);
      }
    } catch {
      // Character bible can be generated on first story if API unavailable
    }

    await prisma.childProfile.create({
      data: {
        userId: user.id,
        name: child.name,
        age: child.age,
        pronouns: child.pronouns,
        interests: JSON.stringify(child.interests),
        favoriteColors: child.favoriteColors,
        favoriteToy: child.favoriteToy ?? null,
        petInfo: child.petInfo ?? null,
        siblingNames: child.siblingNames ?? null,
        bestFriend: child.bestFriend ?? null,
        favoritePlace: child.favoritePlace ?? null,
        province: child.province,
        cityOrTown: child.cityOrTown,
        customCity: child.customCity ?? null,
        suburb: child.suburb ?? null,
        topicsToAvoid: child.topicsToAvoid ?? null,
        storyMood: child.storyMood,
        moralTheme: child.moralTheme ?? null,
        readAloudBy: child.readAloudBy,
        language: child.language,
        characterBible,
      },
    });
  }

  await prisma.pendingSignup.delete({ where: { id: signupId } });

  await logAnalyticsEvent({
    eventType: ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED,
    sessionId: signupId,
    metadata: { signupId, email: pending.email, childCount: children.length },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const data = parseItnBody(body);

  if (!verifyItnSignature(data)) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const valid = await validateItnWithPayfast(body);
  if (!valid) {
    return new NextResponse("Invalid ITN", { status: 400 });
  }

  const signupId = data.custom_str1 ?? data.m_payment_id;
  const paymentStatus = data.payment_status;
  const token = data.token;

  if (paymentStatus === "COMPLETE") {
    const amount = parseFloat(data.amount_gross ?? "0");

    if (amount === 0 && signupId) {
      await activateSignup(signupId, token);
    } else if (token) {
      const user = await prisma.user.findFirst({
        where: { subscription: { payfastToken: token } },
        include: { subscription: true },
      });

      if (user?.subscription) {
        const interval = user.subscription.billingInterval === "annual" ? "annual" : "monthly";
        const fallbackDays = interval === "annual" ? 365 : 30;
        await prisma.subscription.update({
          where: { id: user.subscription.id },
          data: {
            status: "active",
            payfastToken: token,
            nextBillingDate: data.billing_date
              ? new Date(data.billing_date)
              : addDays(new Date(), fallbackDays),
          },
        });
      }

      if (amount > 0) {
        const payfastPaymentId = data.pf_payment_id ?? data.m_payment_id ?? null;
        if (payfastPaymentId) {
          await prisma.payment.upsert({
            where: { payfastPaymentId },
            create: {
              userId: user?.id ?? null,
              subscriptionId: user?.subscription?.id ?? null,
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
