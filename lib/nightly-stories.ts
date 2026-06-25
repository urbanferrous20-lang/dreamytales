import "server-only";
import { prisma } from "@/lib/db";
import { sendStoryEmail, sendAdminAlert } from "@/lib/email";
import { buildStoryPdf } from "@/lib/pdf-builder";
import { getAppUrl } from "@/lib/payfast";
import {
  generateCharacterBible,
  generateNightlyStory,
  generatePageIllustrations,
  parseChildFromDb,
  type CharacterBible,
} from "@/lib/story-generator";

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
): Promise<{ skipped?: boolean; success?: boolean; title?: string; error?: string }> {
  const existing = await prisma.story.findUnique({
    where: { childId_storyDate: { childId: child.id, storyDate } },
  });
  if (existing?.sentAt) return { skipped: true };

  try {
    const childInput = parseChildFromDb(child);
    let characterBible: CharacterBible;

    if (child.characterBible) {
      characterBible = JSON.parse(child.characterBible) as CharacterBible;
    } else {
      characterBible = await generateCharacterBible(childInput);
      await prisma.childProfile.update({
        where: { id: child.id },
        data: { characterBible: JSON.stringify(characterBible) },
      });
    }

    const storyNumber = child.stories.length + 1;
    const recentSummaries = child.stories.map((s) => s.summary);

    const story = await generateNightlyStory({
      child: childInput,
      characterBible,
      storyNumber,
      recentSummaries,
    });

    const imagePaths = await generatePageIllustrations(
      child.id,
      childInput,
      characterBible,
      story.pages
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
        pdfPath,
        storyDate,
      },
      update: { title: story.title, summary: story.summary, pdfPath },
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

    return { success: true, title: story.title };
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
