import "server-only";
import { hashPassword } from "@/lib/auth";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import {
  activatePendingSignupByEmail,
  activateSignup,
  findLatestPendingSignup,
} from "@/lib/signup-activate";
import type { User } from "@prisma/client";

export async function findEmailForSignupId(signupId: string): Promise<string | null> {
  const pending = await prisma.pendingSignup.findUnique({
    where: { id: signupId },
    select: { email: true },
  });
  if (pending?.email) return pending.email.toLowerCase();

  const event = await prisma.analyticsEvent.findFirst({
    where: {
      eventType: ANALYTICS_EVENTS.SIGNUP_SUBMIT,
      OR: [{ sessionId: signupId }, { metadata: { contains: signupId } }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!event?.metadata) return null;

  try {
    const meta = JSON.parse(event.metadata) as { email?: string };
    return meta.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
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
    user = await activateSignup(params.signupId);
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
  } else if (!user && email && params.password && params.signupId) {
    const pending = await findLatestPendingSignup(email);
    if (pending?.id === params.signupId) {
      user = await activateSignup(pending.id);
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(params.password) },
        });
      }
    }
  }

  return user;
}
