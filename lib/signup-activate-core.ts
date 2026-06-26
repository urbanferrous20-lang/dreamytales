import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { addDays } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { recurringCharge, TRIAL_DAYS, type BillingInterval } from "@/lib/pricing";
import { childProfileSchema, type ChildProfileInput } from "@/lib/types/child";
import type { User } from "@prisma/client";

function parseStoredChildren(childrenJson: string): ChildProfileInput[] | null {
  const trimmed = childrenJson.trim();
  if (!trimmed) {
    console.error("activateSignup: childrenJson is empty");
    return null;
  }

  try {
    const raw = JSON.parse(trimmed) as unknown;
    if (!Array.isArray(raw) || raw.length === 0) {
      console.error(
        "activateSignup: childrenJson is not a non-empty array",
        `(length ${trimmed.length}, preview: ${trimmed.slice(0, 160)}${trimmed.length > 160 ? "…" : ""})`
      );
      return null;
    }

    const parsed = raw.map((child) => childProfileSchema.safeParse(child));
    if (parsed.every((result) => result.success)) {
      return parsed.map((result) => result.data as ChildProfileInput);
    }

    console.warn(
      "activateSignup: relaxing stored child validation",
      parsed
        .filter((result) => !result.success)
        .map((result) => result.error.flatten())
    );

    return raw.map((entry) => {
      const child = entry as Record<string, unknown>;
      return {
        name: String(child.name ?? "Child"),
        age: Number(child.age ?? 5),
        pronouns: (child.pronouns as ChildProfileInput["pronouns"]) ?? "they/them",
        interests: Array.isArray(child.interests)
          ? child.interests.map(String)
          : ["nature"],
        favoriteColors: String(child.favoriteColors ?? "Blue"),
        favoriteToy: child.favoriteToy ? String(child.favoriteToy) : undefined,
        petInfo: child.petInfo ? String(child.petInfo) : undefined,
        siblingNames: child.siblingNames ? String(child.siblingNames) : undefined,
        bestFriend: child.bestFriend ? String(child.bestFriend) : undefined,
        favoritePlace: child.favoritePlace ? String(child.favoritePlace) : undefined,
        province: (child.province as ChildProfileInput["province"]) ?? "Gauteng",
        cityOrTown: String(child.cityOrTown ?? "Johannesburg"),
        customCity: child.customCity ? String(child.customCity) : undefined,
        suburb: child.suburb ? String(child.suburb) : undefined,
        topicsToAvoid: child.topicsToAvoid ? String(child.topicsToAvoid) : undefined,
        storyMood: (child.storyMood as ChildProfileInput["storyMood"]) ?? "gentle",
        moralTheme: child.moralTheme ? String(child.moralTheme) : undefined,
        readAloudBy: (child.readAloudBy as ChildProfileInput["readAloudBy"]) ?? "parent",
        language: (child.language as ChildProfileInput["language"]) ?? "english",
      };
    });
  } catch (error) {
    console.error(
      "activateSignup: invalid childrenJson",
      error instanceof Error ? error.message : error,
      `(length ${trimmed.length}, preview: ${trimmed.slice(0, 160)}${trimmed.length > 160 ? "…" : ""})`
    );
    return null;
  }
}

async function createChildProfiles(userId: string, children: ChildProfileInput[]): Promise<void> {
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
        userId,
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
}

async function logSubscriptionActivated(
  signupId: string,
  email: string,
  childCount: number
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED,
        sessionId: signupId,
        metadata: JSON.stringify({ signupId, email, childCount }),
      },
    });
  } catch {
    // Analytics must not break activation
  }
}

async function upsertSubscriptionFromPending(params: {
  userId: string;
  children: ChildProfileInput[];
  billingInterval: BillingInterval;
  payfastToken?: string;
  existingTrialEndsAt?: Date | null;
  existingStatus?: string | null;
}): Promise<void> {
  const recurringAmount = recurringCharge(params.children.length, params.billingInterval);
  const trialEndsAt = params.existingTrialEndsAt ?? addDays(new Date(), TRIAL_DAYS);
  const shouldStartTrial =
    !params.existingStatus || params.existingStatus === "pending" || params.existingStatus === "cancelled";

  await prisma.subscription.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      status: "trial",
      payfastToken: params.payfastToken ?? null,
      recurringAmount,
      childCount: params.children.length,
      billingInterval: params.billingInterval,
      trialEndsAt,
    },
    update: {
      ...(params.payfastToken ? { payfastToken: params.payfastToken } : {}),
      recurringAmount,
      childCount: params.children.length,
      billingInterval: params.billingInterval,
      ...(shouldStartTrial ? { status: "trial" } : {}),
      ...(params.existingTrialEndsAt ? {} : { trialEndsAt }),
    },
  });
}

export async function activateSignup(
  signupId: string,
  payfastToken?: string
): Promise<User | null> {
  try {
    const pending = await prisma.pendingSignup.findUnique({ where: { id: signupId } });
    if (!pending) {
      console.error("activateSignup: pending signup not found", signupId);
      return null;
    }

    const children = parseStoredChildren(pending.childrenJson);
    if (!children) {
      console.error(
        "activateSignup: could not parse children for",
        signupId,
        `(stored length: ${pending.childrenJson.length})`
      );
      return null;
    }

    const billingInterval = (
      pending.billingInterval === "annual" ? "annual" : "monthly"
    ) as BillingInterval;

    const existing = await prisma.user.findUnique({
      where: { email: pending.email.toLowerCase() },
      include: {
        subscription: true,
        children: { select: { id: true } },
      },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: pending.name,
          passwordHash: pending.passwordHash,
          signupRef: signupId,
        },
      });

      await upsertSubscriptionFromPending({
        userId: existing.id,
        children,
        billingInterval,
        payfastToken,
        existingTrialEndsAt: existing.subscription?.trialEndsAt,
        existingStatus: existing.subscription?.status,
      });

      if (existing.children.length === 0) {
        await createChildProfiles(existing.id, children);
      }

      await prisma.pendingSignup.delete({ where: { id: signupId } });
      await logSubscriptionActivated(signupId, pending.email, children.length);

      return prisma.user.findUnique({ where: { id: existing.id } });
    }

    const user = await prisma.user.create({
      data: {
        email: pending.email.toLowerCase(),
        name: pending.name,
        passwordHash: pending.passwordHash,
        signupRef: signupId,
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

    await createChildProfiles(user.id, children);
    await prisma.pendingSignup.delete({ where: { id: signupId } });
    await logSubscriptionActivated(signupId, pending.email, children.length);

    return user;
  } catch (error) {
    console.error(
      "activateSignup failed:",
      signupId,
      error instanceof Error ? error.stack ?? error.message : error
    );
    return null;
  }
}

export async function activatePendingSignupByEmail(
  email: string,
  payfastToken?: string,
  options?: { allowExpired?: boolean }
): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = await prisma.pendingSignup.findFirst({
    where: {
      email: normalizedEmail,
      ...(options?.allowExpired ? {} : { expiresAt: { gt: new Date() } }),
    },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) return null;
  return activateSignup(pending.id, payfastToken);
}

export async function findLatestPendingSignup(email: string) {
  return prisma.pendingSignup.findFirst({
    where: { email: email.trim().toLowerCase() },
    orderBy: { createdAt: "desc" },
  });
}
