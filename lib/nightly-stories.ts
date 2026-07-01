import "server-only";
import { prisma } from "@/lib/db";
import { sendStoryEmail, sendAdminAlert } from "@/lib/email";
import { buildStoryPdf } from "@/lib/pdf-builder";
import { includesNarration } from "@/lib/pricing";
import { buildAndSaveStoryNarration } from "@/lib/story-narration";
import { getAppUrl } from "@/lib/payfast";
import { getAgeBand, isBirthdayOnDate, getAgeOnDate, parseBirthDate } from "@/lib/child-age";
import {
  generateCharacterBible,
  generateBirthdayStory,
  generateNightlyStory,
  generatePageIllustrations,
  parseChildFromDb,
  type CharacterBible,
} from "@/lib/story-generator";
import { resolveStoryLanguage } from "@/lib/sa-languages";
import type { ChildProfileInput } from "@/lib/types/child";
import {
  getStoryDeliveryWindowBlockReason,
  isWithinStoryDeliveryWindow,
} from "@/lib/story-delivery-window";

export function getStoryDateSast(): Date {
  const now = new Date();
  const sast = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }));
  sast.setHours(0, 0, 0, 0);
  return sast;
}

type ActiveChild = Awaited<ReturnType<typeof fetchActiveChildren>>[number];

async function fetchActiveChildren() {
  return prisma.childProfile.findMany({
    where: {
      user: {
        subscription: {
          status: { in: ["trial", "active", "cancel_pending"] },
          OR: [{ accessEndsAt: null }, { accessEndsAt: { gt: new Date() } }],
        },
      },
    },
    include: {
      user: { include: { subscription: true } },
      stories: { orderBy: { storyDate: "desc" }, take: 14 },
    },
    orderBy: { id: "asc" },
  });
}

/** Sync age from birthDate and refresh character bible when the age band changes. */
async function prepareChildForStory(child: ActiveChild): Promise<{
  childInput: ChildProfileInput;
  characterBible: CharacterBible | null;
}> {
  const childInput = parseChildFromDb(child);
  const previousBand = getAgeBand(child.age);
  const newBand = getAgeBand(childInput.age);

  const data: {
    age?: number;
    birthDate?: Date;
    language?: string;
    characterBible?: string | null;
    styleAnchorUrl?: string | null;
    petAnchorUrl?: string | null;
    petAnchorSource?: string | null;
  } = {};

  if (childInput.age !== child.age) {
    data.age = childInput.age;
  }

  if (!child.birthDate && childInput.birthDate) {
    const parsed = parseBirthDate(childInput.birthDate);
    if (parsed) data.birthDate = parsed;
  }

  const resolvedLanguage = resolveStoryLanguage(child.language);
  if (resolvedLanguage !== child.language) {
    data.language = resolvedLanguage;
    childInput.language = resolvedLanguage;
  }

  if (previousBand !== newBand) {
    data.characterBible = null;
    data.styleAnchorUrl = null;
    data.petAnchorUrl = null;
    data.petAnchorSource = null;
  }

  const storedPetSource = child.petAnchorSource?.trim() ?? "";
  const currentPetInfo = childInput.petInfo?.trim() ?? "";
  if (storedPetSource && storedPetSource !== currentPetInfo) {
    data.petAnchorUrl = null;
    data.petAnchorSource = null;
  }

  if (Object.keys(data).length > 0) {
    await prisma.childProfile.update({
      where: { id: child.id },
      data,
    });
    if (data.characterBible === null) {
      child.characterBible = null;
      child.styleAnchorUrl = null;
      child.petAnchorUrl = null;
      child.petAnchorSource = null;
    } else if (data.petAnchorUrl === null && data.petAnchorSource === null) {
      child.petAnchorUrl = null;
      child.petAnchorSource = null;
    }
  }

  let characterBible: CharacterBible | null = null;
  if (child.characterBible && data.characterBible !== null) {
    characterBible = JSON.parse(child.characterBible) as CharacterBible;
  }

  return { childInput, characterBible };
}

export async function countPendingNightlyStories(storyDate = getStoryDateSast()): Promise<number> {
  const children = await fetchActiveChildren();
  let pending = 0;

  for (const child of children) {
    const existing = await prisma.story.findUnique({
      where: { childId_storyDate: { childId: child.id, storyDate } },
    });
    if (!existing?.sentAt) pending += 1;
  }

  return pending;
}

export async function processNightlyStoryForChild(
  child: ActiveChild,
  storyDate = getStoryDateSast()
): Promise<{ skipped?: boolean; success?: boolean; title?: string; setting?: string; archetype?: string; birthday?: boolean; error?: string }> {
  const existing = await prisma.story.findUnique({
    where: { childId_storyDate: { childId: child.id, storyDate } },
  });
  if (existing?.sentAt) return { skipped: true };

  try {
    const { childInput, characterBible: existingBible } = await prepareChildForStory(child);
    let characterBible = existingBible;

    if (!characterBible) {
      characterBible = await generateCharacterBible(childInput);
      await prisma.childProfile.update({
        where: { id: child.id },
        data: { characterBible: JSON.stringify(characterBible) },
      });
    }

    const storyNumber = child.stories.length + 1;
    const recentStories = child.stories.map((s) => ({
      title: s.title,
      summary: s.summary,
      settingKey: s.settingKey,
      archetypeKey: (s as { archetypeKey?: string | null }).archetypeKey,
      inspirationKey: (s as { inspirationKey?: string | null }).inspirationKey,
    }));
    const recentSettingKeys = child.stories
      .map((s) => s.settingKey)
      .filter((key): key is string => Boolean(key));

    const isBirthday =
      child.birthDate != null &&
      isBirthdayOnDate(child.birthDate, storyDate);

    const turningAge = isBirthday
      ? getAgeOnDate(child.birthDate!, storyDate)
      : childInput.age;

    const childForStory =
      isBirthday && turningAge !== childInput.age
        ? { ...childInput, age: turningAge }
        : childInput;

    let story;
    let setting;
    let archetypeLabel: string | undefined;
    let archetypeKey: string | undefined;
    let inspirationKey: string | undefined;

    if (isBirthday) {
      const birthdayResult = await generateBirthdayStory({
        child: childForStory,
        characterBible,
        storyNumber,
        turningAge,
      });
      story = birthdayResult.story;
      setting = birthdayResult.setting;
    } else {
      const nightlyResult = await generateNightlyStory({
        child: childInput,
        characterBible,
        storyNumber,
        recentStories,
        recentSettingKeys,
      });
      story = nightlyResult.story;
      setting = nightlyResult.setting;
      archetypeKey = nightlyResult.archetype.key;
      archetypeLabel = nightlyResult.archetype.label;
      inspirationKey = nightlyResult.inspiration.key;
    }

    const illustrationResult = await generatePageIllustrations(
      child.id,
      childForStory,
      characterBible,
      story.pages,
      setting,
      child.styleAnchorUrl,
      child.petAnchorUrl,
      child.petAnchorSource
    );

    const anchorUpdates: {
      styleAnchorUrl?: string;
      petAnchorUrl?: string | null;
      petAnchorSource?: string | null;
    } = {};

    if (illustrationResult.styleAnchorPath) {
      anchorUpdates.styleAnchorUrl = illustrationResult.styleAnchorPath;
    }
    if (illustrationResult.petAnchorPath) {
      anchorUpdates.petAnchorUrl = illustrationResult.petAnchorPath;
      anchorUpdates.petAnchorSource = illustrationResult.petAnchorSource ?? null;
    }

    if (Object.keys(anchorUpdates).length > 0) {
      await prisma.childProfile.update({
        where: { id: child.id },
        data: anchorUpdates,
      });
    }

    const pdfPath = await buildStoryPdf({
      childId: child.id,
      title: story.title,
      childName: child.name,
      pages: story.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        imagePath: illustrationResult.imagePaths.get(p.pageNumber),
      })),
    });

    const storyPlan = child.user.subscription?.storyPlan ?? "pdf";
    const withNarration = includesNarration(storyPlan);
    let audioPath: string | null = null;

    if (withNarration) {
      try {
        audioPath = await buildAndSaveStoryNarration(
          child.id,
          story.pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
          { language: resolveStoryLanguage(child.language) }
        );
      } catch (error) {
        console.error(
          `Narration failed for ${child.name}:`,
          error instanceof Error ? error.message : error
        );
        await sendAdminAlert(
          "Story narration failed",
          `Child: ${child.name} (${child.id})\nStory: ${story.title}\n${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const storyRecord = await prisma.story.upsert({
      where: { childId_storyDate: { childId: child.id, storyDate } },
      create: {
        childId: child.id,
        title: story.title,
        summary: story.summary,
        settingKey: setting.key,
        archetypeKey: archetypeKey ?? null,
        inspirationKey: inspirationKey ?? null,
        isBirthdayStory: isBirthday,
        pdfPath,
        audioPath,
        storyDate,
      },
      update: {
        title: story.title,
        summary: story.summary,
        settingKey: setting.key,
        archetypeKey: archetypeKey ?? null,
        inspirationKey: inspirationKey ?? null,
        isBirthdayStory: isBirthday,
        pdfPath,
        audioPath,
      },
    });

    await sendStoryEmail({
      to: child.user.email,
      parentName: child.user.name,
      childName: child.name,
      storyTitle: story.title,
      teaser: story.teaser,
      pdfPath,
      audioPath,
      manageUrl: `${getAppUrl()}/dashboard`,
      isBirthday,
      turningAge: isBirthday ? turningAge : undefined,
      includesNarration: withNarration,
    });

    await prisma.story.update({
      where: { id: storyRecord.id },
      data: { sentAt: new Date() },
    });

    return {
      success: true,
      title: story.title,
      setting: setting.label,
      archetype: archetypeLabel,
      birthday: isBirthday,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await sendAdminAlert(
      "Nightly story failed",
      `Child ${child.name} (${child.id}): ${message}`
    );
    return { error: message };
  }
}

/** Process the next child who has not received tonight's story. One child per call avoids Plesk timeouts. */
export async function processNextNightlyStory(storyDate = getStoryDateSast()) {
  if (!isWithinStoryDeliveryWindow()) {
    const window = getStoryDeliveryWindowBlockReason();
    const pending = await countPendingNightlyStories(storyDate);
    return {
      outsideDeliveryWindow: true,
      pending,
      nowSast: window.nowSast,
      deliveryWindow: window.deliveryWindow,
      message: window.message,
    };
  }

  const children = await fetchActiveChildren();

  for (const child of children) {
    const existing = await prisma.story.findUnique({
      where: { childId_storyDate: { childId: child.id, storyDate } },
    });
    if (existing?.sentAt) continue;

    const result = await processNightlyStoryForChild(child, storyDate);
    const remaining = await countPendingNightlyStories(storyDate);

    return {
      childId: child.id,
      childName: child.name,
      remaining,
      ...result,
    };
  }

  return { done: true, remaining: 0 };
}
