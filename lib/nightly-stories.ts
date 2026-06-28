import "server-only";
import { prisma } from "@/lib/db";
import { sendStoryEmail, sendAdminAlert } from "@/lib/email";
import { buildStoryPdf } from "@/lib/pdf-builder";
import { getAppUrl } from "@/lib/payfast";
import { getAgeBand, parseBirthDate } from "@/lib/child-age";
import {
  generateCharacterBible,
  generateNightlyStory,
  generatePageIllustrations,
  parseChildFromDb,
  type CharacterBible,
} from "@/lib/story-generator";
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
      stories: { orderBy: { storyDate: "desc" }, take: 7 },
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
    characterBible?: string | null;
  } = {};

  if (childInput.age !== child.age) {
    data.age = childInput.age;
  }

  if (!child.birthDate && childInput.birthDate) {
    const parsed = parseBirthDate(childInput.birthDate);
    if (parsed) data.birthDate = parsed;
  }

  if (previousBand !== newBand) {
    data.characterBible = null;
  }

  if (Object.keys(data).length > 0) {
    await prisma.childProfile.update({
      where: { id: child.id },
      data,
    });
    if (data.characterBible === null) {
      child.characterBible = null;
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
): Promise<{ skipped?: boolean; success?: boolean; title?: string; setting?: string; error?: string }> {
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
    const recentSummaries = child.stories.map((s) => s.summary);
    const recentSettingKeys = child.stories
      .map((s) => s.settingKey)
      .filter((key): key is string => Boolean(key));

    const { story, setting } = await generateNightlyStory({
      child: childInput,
      characterBible,
      storyNumber,
      recentSummaries,
      recentSettingKeys,
    });

    const imagePaths = await generatePageIllustrations(
      child.id,
      childInput,
      characterBible,
      story.pages,
      setting
    );

    const pdfPath = await buildStoryPdf({
      childId: child.id,
      title: story.title,
      childName: child.name,
      pages: story.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        imagePath: imagePaths.get(p.pageNumber),
      })),
    });

    const storyRecord = await prisma.story.upsert({
      where: { childId_storyDate: { childId: child.id, storyDate } },
      create: {
        childId: child.id,
        title: story.title,
        summary: story.summary,
        settingKey: setting.key,
        pdfPath,
        storyDate,
      },
      update: {
        title: story.title,
        summary: story.summary,
        settingKey: setting.key,
        pdfPath,
      },
    });

    await sendStoryEmail({
      to: child.user.email,
      parentName: child.user.name,
      childName: child.name,
      storyTitle: story.title,
      teaser: story.teaser,
      pdfPath,
      manageUrl: `${getAppUrl()}/dashboard`,
    });

    await prisma.story.update({
      where: { id: storyRecord.id },
      data: { sentAt: new Date() },
    });

    return { success: true, title: story.title, setting: setting.label };
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
