import "server-only";
import { hashPassword } from "@/lib/auth";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import {
  activatePendingSignupByEmail,
  activateSignup,
  describePendingSignupIssue,
  findLatestPendingSignup,
} from "@/lib/signup-activate-core";
import type { User } from "@prisma/client";

function parseMetadataEmail(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const meta = JSON.parse(metadata) as { email?: string };
    return meta.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function findEmailForSignupId(signupId: string): Promise<string | null> {
  const pending = await prisma.pendingSignup.findUnique({
    where: { id: signupId },
    select: { email: true },
  });
  if (pending?.email) return pending.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { signupRef: signupId },
    select: { email: true },
  });
  if (user?.email) return user.email.toLowerCase();

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ signupId }, { payfastPaymentId: signupId }],
    },
    include: { user: { select: { email: true } } },
  });
  if (payment?.user?.email) return payment.user.email.toLowerCase();

  const eventTypes = [
    ANALYTICS_EVENTS.SIGNUP_SUBMIT,
    ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED,
    ANALYTICS_EVENTS.PAYFAST_PAYMENT_COMPLETE,
  ];

  for (const eventType of eventTypes) {
    const event = await prisma.analyticsEvent.findFirst({
      where: {
        eventType,
        OR: [{ sessionId: signupId }, { metadata: { contains: signupId } }],
      },
      orderBy: { createdAt: "desc" },
    });
    const email = parseMetadataEmail(event?.metadata ?? null);
    if (email) return email;
  }

  return null;
}

export async function findUserBySignupId(signupId: string): Promise<User | null> {
  const byRef = await prisma.user.findUnique({ where: { signupRef: signupId } });
  if (byRef) return byRef;

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ signupId }, { payfastPaymentId: signupId }],
    },
    include: { user: true },
  });
  if (payment?.user) return payment.user;

  const email = await findEmailForSignupId(signupId);
  if (email) {
    return prisma.user.findUnique({ where: { email } });
  }

  return null;
}

export async function resolveUserAfterPayment(params: {
  signupId?: string;
  email?: string;
  password?: string;
}): Promise<User | null> {
  let email = params.email?.trim().toLowerCase();

  if (!email && params.signupId) {
    email = (await findEmailForSignupId(params.signupId)) ?? undefined;
  }

  let user: User | null = null;

  if (params.signupId) {
    user = await findUserBySignupId(params.signupId);
  }

  if (!user && params.signupId) {
    user = await activateSignup(params.signupId);
  }

  if (!user && email) {
    const latestPending = await findLatestPendingSignup(email);
    if (latestPending) {
      user = await activateSignup(latestPending.id);
    }
  }

  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email } });
  }

  if (!user && email) {
    user = await activatePendingSignupByEmail(email, undefined, { allowExpired: true });
  }

  if (user && params.password) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(params.password) },
    });
  }

  return user;
}

export type SignupRecoveryStatus = {
  signupId?: string;
  email?: string;
  pendingFound: boolean;
  userFound: boolean;
  paymentFound: boolean;
};

export async function getSignupRecoveryStatus(params: {
  signupId?: string;
  email?: string;
}): Promise<SignupRecoveryStatus> {
  const signupId = params.signupId?.trim();
  let email = params.email?.trim().toLowerCase();

  if (!email && signupId) {
    email = (await findEmailForSignupId(signupId)) ?? undefined;
  }

  const [pending, user, payment] = await Promise.all([
    signupId
      ? prisma.pendingSignup.findUnique({ where: { id: signupId } })
      : email
        ? findLatestPendingSignup(email)
        : null,
    email
      ? prisma.user.findUnique({ where: { email } })
      : signupId
        ? findUserBySignupId(signupId)
        : null,
    signupId
      ? prisma.payment.findFirst({
          where: { OR: [{ signupId }, { payfastPaymentId: signupId }] },
        })
      : null,
  ]);

  return {
    signupId,
    email,
    pendingFound: Boolean(pending),
    userFound: Boolean(user),
    paymentFound: Boolean(payment),
  };
}
