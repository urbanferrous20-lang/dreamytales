import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLanguageLabel } from "@/lib/sa-languages";
import { getEffectiveAge } from "@/lib/child-age";
import { isAudioStored, isPdfStored } from "@/lib/storage-config";
import {
  billingCadenceLabel,
  billingIntervalLabel,
  formatZar,
  includesNarration,
  monthlyTotal,
  recurringCharge,
  storyPlanLabel,
  type StoryPlan,
  type BillingInterval,
} from "@/lib/pricing";
import { SiteReviewForm } from "@/components/SiteReviewForm";
import { StoryReviewForm } from "@/components/StoryReviewForm";
import { PlanUpgradePanel } from "@/components/PlanUpgradePanel";
import { getCancellationStatusLabel } from "@/lib/subscription-cancellation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      subscription: true,
      siteReview: true,
      storyReviews: true,
      children: {
        include: {
          stories: {
            orderBy: { storyDate: "desc" },
            take: 5,
            include: { reviews: { where: { userId: session.userId } } },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const sub = user.subscription;
  const isActive = sub && ["trial", "active", "cancel_pending"].includes(sub.status);
  const storyPlan = ((sub?.storyPlan as StoryPlan) ?? "pdf") as StoryPlan;
  const cancelLabel = sub ? getCancellationStatusLabel(sub) : undefined;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-display text-3xl text-navy">Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="text-navy/60 mt-1">Your bedtime short story command centre.</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="text-sm text-navy/50 hover:text-navy">
            Sign out
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy/5">
          <h2 className="font-medium text-navy mb-4">Subscription</h2>
          {sub ? (
            <div className="space-y-2 text-sm">
              <p>
                Status:{" "}
                <span className="font-medium capitalize">
                  {sub.status === "cancel_pending" ? cancelLabel : sub.status}
                </span>
              </p>
              <p>
                Plan: {billingIntervalLabel(sub.billingInterval as "monthly" | "annual")} ·{" "}
                {storyPlanLabel(storyPlan)} ·{" "}
                {formatZar(sub.recurringAmount)}/{billingCadenceLabel(sub.billingInterval as "monthly" | "annual")} (
                {sub.childCount} {sub.childCount === 1 ? "child" : "children"})
              </p>
              {sub.trialEndsAt && sub.status === "trial" && (
                <p className="text-navy/60">Trial ends: {sub.trialEndsAt.toLocaleDateString("en-ZA")}</p>
              )}
              {sub.nextBillingDate && sub.status === "active" && (
                <p className="text-navy/60">Next billing: {sub.nextBillingDate.toLocaleDateString("en-ZA")}</p>
              )}
              {sub.accessEndsAt && sub.status === "cancel_pending" && (
                <p className="text-amber-700">Stories continue until: {sub.accessEndsAt.toLocaleDateString("en-ZA")}</p>
              )}
            </div>
          ) : (
            <p className="text-navy/60 text-sm">No active subscription.</p>
          )}
          {isActive && sub?.status !== "cancel_pending" && (
            <Link
              href="/dashboard/cancel"
              className="inline-block mt-4 text-sm text-red-600 hover:underline"
            >
              Cancel subscription
            </Link>
          )}
        </div>

        <div className="bg-moon rounded-2xl p-6">
          <h2 className="font-medium text-navy mb-2">Delivery schedule</h2>
          <p className="text-sm text-navy/70">
            A new illustrated PDF story arrives in your inbox every night at{" "}
            <strong>6:00 PM South African time</strong>
            {sub && includesNarration(sub.storyPlan) ? (
              <>
                . On the PDF + Audio plan, <strong>one email</strong> includes both the PDF and MP3 narration.
              </>
            ) : (
              "."
            )}
          </p>
          <p className="text-sm text-navy/50 mt-2">
            {sub?.billingInterval === "annual" ? (
              <>
                Annual plan: {formatZar(recurringCharge(user.children.length, "annual", storyPlan))}/year · Monthly equivalent{" "}
                {formatZar(monthlyTotal(user.children.length, storyPlan))}/mo
              </>
            ) : (
              <>Monthly total: {formatZar(monthlyTotal(user.children.length, storyPlan))}</>
            )}
          </p>
        </div>
      </div>

      {isActive &&
        sub &&
        sub.status !== "cancel_pending" &&
        !includesNarration(sub.storyPlan) && (
          <PlanUpgradePanel
            childCount={sub.childCount}
            billingInterval={(sub.billingInterval === "annual" ? "annual" : "monthly") as BillingInterval}
            currentRecurringAmount={sub.recurringAmount}
          />
        )}

      <div className="mb-10">
        <SiteReviewForm
          initialRating={user.siteReview?.rating}
          initialComment={user.siteReview?.comment}
        />
      </div>

      <h2 className="font-display text-xl text-navy mb-4">Your children</h2>
      <div className="space-y-6">
        {user.children.map((child) => {
          const displayAge = getEffectiveAge({
            birthDate: child.birthDate,
            storedAge: child.age,
            profileCreatedAt: child.createdAt,
          });
          return (
          <div key={child.id} className="bg-white rounded-2xl p-6 shadow-sm border border-navy/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-lg text-navy">{child.name}</h3>
              <span className="text-sm text-navy/50">Age {displayAge}</span>
            </div>
            <p className="text-sm text-navy/60 mb-4">
              Loves: {JSON.parse(child.interests).join(", ")}
            </p>
            <p className="text-sm text-navy/60 mb-4">
              Home base:{" "}
              {child.customCity && child.cityOrTown === "Other"
                ? `${child.customCity}, ${child.province}`
                : `${child.cityOrTown}, ${child.province}`}
              {child.suburb ? ` (${child.suburb})` : ""}
              <span className="text-navy/40"> · adventures vary each night</span>
            </p>
            <p className="text-sm text-navy/60 mb-4">
              Story language: {getLanguageLabel(child.language)}
            </p>
            {child.stories.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-navy mb-2">Recent stories</p>
                <ul className="space-y-4">
                  {child.stories.map((story) => {
                    const review = story.reviews[0];
                    return (
                      <li key={story.id} className="text-sm">
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <span className="text-navy">{story.title}</span>
                          <div className="flex gap-3 shrink-0">
                            {isPdfStored(story.pdfPath) ? (
                              <a
                                href={`/api/stories/${story.id}/download`}
                                className="text-gold hover:underline"
                              >
                                PDF
                              </a>
                            ) : (
                              <span className="text-navy/40 text-xs">PDF in email</span>
                            )}
                            {isAudioStored(story.audioPath) ? (
                              <a
                                href={`/api/stories/${story.id}/audio`}
                                className="text-purple hover:underline"
                              >
                                Audio
                              </a>
                            ) : sub && includesNarration(sub.storyPlan) ? (
                              <span className="text-navy/40 text-xs">Audio in email</span>
                            ) : null}
                          </div>
                        </div>
                        <StoryReviewForm
                          storyId={story.id}
                          storyTitle={story.title}
                          initialRating={review?.rating}
                          initialComment={review?.comment}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-navy/50 italic">First story coming tonight at 6pm!</p>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
