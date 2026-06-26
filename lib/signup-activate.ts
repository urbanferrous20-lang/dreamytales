import "server-only";
import { prisma } from "@/lib/db";
import { ANALYTICS_EVENTS, logAnalyticsEvent } from "@/lib/analytics";
import { addDays } from "@/lib/payfast";
import { recurringCharge, TRIAL_DAYS, type BillingInterval } from "@/lib/pricing";
import { childProfileSchema, type ChildProfileInput } from "@/lib/types/child";
import type { User } from "@prisma/client";

function parseStoredChildren(childrenJson: string): ChildProfileInput[] | null {
  try {
    const raw = JSON.parse(childrenJson) as unknown;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const parsed = raw.map((child) => childProfileSchema.safeParse(child));
    if (parsed.some((result) => !result.success)) return null;
    return parsed.map((result) => result.data as ChildProfileInput);
  } catch {
    return null;
  }
}

export async function activateSignup(
  signupId: string,
  payfastToken?: string
): Promise<User | null> {
  const pending = await prisma.pendingSignup.findUnique({ where: { id: signupId } });
  if (!pending) return null;

  const existing = await prisma.user.findUnique({
    where: { email: pending.email.toLowerCase() },
  });
  if (existing) {
    await prisma.pendingSignup.delete({ where: { id: signupId } }).catch(() => undefined);
    return existing;
  }

  const children = parseStoredChildren(pending.childrenJson);
  if (!children) return null;

  const billingInterval = (
    pending.billingInterval === "annual" ? "annual" : "monthly"
  ) as BillingInterval;

  const user = await prisma.user.create({
    data: {
      email: pending.email.toLowerCase(),
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
        const { generateCharacterBible } = await import("@/lib/story-generator");
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

  return user;
}

export async function activatePendingSignupByEmail(
  email: string,
  payfastToken?: string
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = await prisma.pendingSignup.findFirst({
    where: {
      email: normalizedEmail,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) return null;
  return activateSignup(pending.id, payfastToken);
}
