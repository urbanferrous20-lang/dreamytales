import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { sendStoryEmail, sendAdminAlert } from "@/lib/email";
import { buildStoryPdf } from "@/lib/pdf-builder";
import {
  generateCharacterBible,
  generateNightlyStory,
  generatePageIllustrations,
  parseChildFromDb,
  type CharacterBible,
} from "@/lib/story-generator";
import { getAppUrl, cancelPayfastSubscription } from "@/lib/payfast";

function getStoryDateSast(): Date {
  const now = new Date();
  const sast = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Johannesburg" }));
  sast.setHours(0, 0, 0, 0);
  return sast;
}

export const sendNightlyStories = inngest.createFunction(
  { id: "send-nightly-stories", retries: 2, triggers: [{ cron: "0 16 * * *" }] },
  async ({ step }) => {
    const storyDate = getStoryDateSast();

    const activeChildren = await step.run("fetch-active-children", async () => {
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
      });
    });

    for (const child of activeChildren) {
      await step.run(`story-${child.id}`, async () => {
        const existing = await prisma.story.findUnique({
          where: {
            childId_storyDate: { childId: child.id, storyDate },
          },
        });
        if (existing?.sentAt) return { skipped: true };

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
      });
    }

    return { processed: activeChildren.length };
  }
);

export const processScheduledCancellation = inngest.createFunction(
  { id: "process-scheduled-cancellation", triggers: [{ event: "subscription/cancel.scheduled" }] },
  async ({ event, step }) => {
    const { subscriptionId, payfastToken, accessEndsAt } = event.data as {
      subscriptionId: string;
      payfastToken: string;
      accessEndsAt: string;
    };

    await step.sleepUntil("wait-until-access-end", new Date(accessEndsAt));

    await step.run("cancel-payfast", async () => {
      const cancelled = await cancelPayfastSubscription(payfastToken);
      if (!cancelled) {
        await sendAdminAlert(
          "PayFast cancellation failed",
          `Subscription ${subscriptionId} — manual intervention needed`
        );
      }
    });

    await step.run("update-status", async () => {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: "cancelled" },
      });
    });
  }
);

export const inngestFunctions = [sendNightlyStories, processScheduledCancellation];
