import "server-only";
import { prisma } from "@/lib/db";
import { sendAdminAlert } from "@/lib/email";
import { findUserBySignupId } from "@/lib/signup-complete";

/** PayFast sends the subscription token as `token` on COMPLETE ITNs. */
export function extractPayfastSubscriptionToken(
  data: Record<string, string>
): string | null {
  const raw = data.token?.trim() || data.subscription_token?.trim();
  return raw || null;
}

export async function findUserForPayfastItn(params: {
  signupId?: string;
  email?: string;
}): Promise<{ id: string; email: string; subscriptionId: string | null } | null> {
  const signupId = params.signupId?.trim();
  const email = params.email?.trim().toLowerCase();

  if (signupId) {
    const bySignup = await findUserBySignupId(signupId);
    if (bySignup) {
      const sub = await prisma.subscription.findUnique({
        where: { userId: bySignup.id },
        select: { id: true },
      });
      return { id: bySignup.id, email: bySignup.email, subscriptionId: sub?.id ?? null };
    }
  }

  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      include: { subscription: { select: { id: true } } },
    });
    if (byEmail) {
      return {
        id: byEmail.id,
        email: byEmail.email,
        subscriptionId: byEmail.subscription?.id ?? null,
      };
    }
  }

  return null;
}

/** Attach subscription token from ITN — runs even if signup was activated earlier without a token. */
export async function persistPayfastSubscriptionToken(params: {
  token: string;
  signupId?: string;
  email?: string;
}): Promise<boolean> {
  const user = await findUserForPayfastItn(params);
  if (!user?.subscriptionId) return false;

  await prisma.subscription.update({
    where: { id: user.subscriptionId },
    data: { payfastToken: params.token },
  });
  return true;
}

export async function alertMissingPayfastToken(params: {
  signupId?: string;
  email?: string;
  paymentStatus: string;
}): Promise<void> {
  console.error(
    "PayFast ITN: COMPLETE subscription payment without token",
    JSON.stringify({ signupId: params.signupId, email: params.email })
  );
  await sendAdminAlert(
    "PayFast ITN missing subscription token",
    [
      "A PayFast payment completed but no subscription token was received.",
      "Automatic cancel/upgrade via API will not work until the token is stored.",
      "",
      `Email: ${params.email ?? "unknown"}`,
      `Signup ID: ${params.signupId ?? "unknown"}`,
      "",
      "Check PayFast ITN logs and cancel any test subscriptions manually in PayFast if needed.",
    ].join("\n")
  ).catch(() => {});
}
