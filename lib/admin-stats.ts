import "server-only";
import { prisma } from "@/lib/db";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { formatZar } from "@/lib/pricing";
import { getStorageStats, type StorageStats } from "@/lib/storage-stats";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

function startOfYesterday(): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - 1);
  return d;
}

function endOfYesterday(): Date {
  const d = startOfDay(new Date());
  d.setMilliseconds(-1);
  return d;
}

async function uniqueVisitorsSince(since: Date): Promise<number> {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      eventType: ANALYTICS_EVENTS.PAGE_VIEW,
      createdAt: { gte: since },
    },
    select: { sessionId: true },
    distinct: ["sessionId"],
  });
  return events.length;
}

async function countEventsSince(eventType: string, since: Date): Promise<number> {
  return prisma.analyticsEvent.count({
    where: { eventType, createdAt: { gte: since } },
  });
}

async function sumRevenueBetween(start: Date, end: Date): Promise<number> {
  const result = await prisma.payment.aggregate({
    where: {
      paymentStatus: "COMPLETE",
      amountGross: { gt: 0 },
      createdAt: { gte: start, lte: end },
    },
    _sum: { amountGross: true },
  });
  return result._sum.amountGross ?? 0;
}

async function countSubscriptionsSince(since: Date): Promise<number> {
  return prisma.subscription.count({
    where: {
      createdAt: { gte: since },
      status: { in: ["trial", "active", "cancel_pending", "cancelled"] },
    },
  });
}

async function countUnsubscribesSince(since: Date): Promise<number> {
  return prisma.subscription.count({
    where: {
      OR: [
        { cancelRequestedAt: { gte: since } },
        {
          status: "cancelled",
          updatedAt: { gte: since },
          cancelRequestedAt: null,
        },
      ],
    },
  });
}

export type AdminDashboardStats = {
  visitors: { today: number; monthToDate: number; total: number };
  signupStarts: { today: number; monthToDate: number; total: number };
  signupSubmits: { today: number; monthToDate: number; total: number };
  abandonedCheckouts: { active: number; today: number; monthToDate: number; total: number };
  subscriptions: { today: number; monthToDate: number; total: number };
  revenue: { yesterday: number; monthToDate: number; total: number };
  unsubscribes: { today: number; monthToDate: number; total: number };
  activeSubscribers: number;
  trialSubscribers: number;
  storiesSentToday: number;
  conversionRate: number;
  reviews: AdminReviewRow[];
  storage: StorageStats;
};

export type AdminReviewRow = {
  id: string;
  type: "site" | "story";
  rating: number;
  comment: string | null;
  parentName: string;
  parentEmail: string;
  storyTitle?: string;
  childName?: string;
  createdAt: Date;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const yesterdayStart = startOfYesterday();
  const yesterdayEnd = endOfYesterday();

  const [
    visitorsToday,
    visitorsMonth,
    visitorsTotal,
    signupStartsToday,
    signupStartsMonth,
    signupStartsTotal,
    signupSubmitsToday,
    signupSubmitsMonth,
    signupSubmitsTotal,
    activationsToday,
    activationsMonth,
    activationsTotal,
    activePendingSignups,
    expiredPendingSignups,
    subscriptionsToday,
    subscriptionsMonth,
    subscriptionsTotal,
    revenueYesterday,
    revenueMonth,
    revenueTotal,
    unsubscribesToday,
    unsubscribesMonth,
    unsubscribesTotal,
    activeSubscribers,
    trialSubscribers,
    storiesSentToday,
    siteReviews,
    storyReviews,
  ] = await Promise.all([
    uniqueVisitorsSince(todayStart),
    uniqueVisitorsSince(monthStart),
    uniqueVisitorsSince(new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_START, todayStart),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_START, monthStart),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_START, new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_SUBMIT, todayStart),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_SUBMIT, monthStart),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_SUBMIT, new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, todayStart),
    countEventsSince(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, monthStart),
    countEventsSince(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, new Date(0)),
    prisma.pendingSignup.count({ where: { expiresAt: { gt: now } } }),
    prisma.pendingSignup.count({ where: { expiresAt: { lte: now } } }),
    countSubscriptionsSince(todayStart),
    countSubscriptionsSince(monthStart),
    countSubscriptionsSince(new Date(0)),
    sumRevenueBetween(yesterdayStart, yesterdayEnd),
    sumRevenueBetween(monthStart, now),
    sumRevenueBetween(new Date(0), now),
    countUnsubscribesSince(todayStart),
    countUnsubscribesSince(monthStart),
    countUnsubscribesSince(new Date(0)),
    prisma.subscription.count({ where: { status: { in: ["trial", "active"] } } }),
    prisma.subscription.count({ where: { status: "trial" } }),
    prisma.story.count({ where: { sentAt: { gte: todayStart } } }),
    prisma.siteReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.storyReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
        story: {
          select: {
            title: true,
            child: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const abandonedToday = Math.max(0, signupSubmitsToday - activationsToday);
  const abandonedMonth = Math.max(0, signupSubmitsMonth - activationsMonth);
  const abandonedTotal = Math.max(0, signupSubmitsTotal - activationsTotal) + expiredPendingSignups;

  const conversionRate =
    signupStartsTotal > 0 ? Math.round((activationsTotal / signupStartsTotal) * 1000) / 10 : 0;

  const reviews: AdminReviewRow[] = [
    ...siteReviews.map((r) => ({
      id: r.id,
      type: "site" as const,
      rating: r.rating,
      comment: r.comment,
      parentName: r.user.name,
      parentEmail: r.user.email,
      createdAt: r.createdAt,
    })),
    ...storyReviews.map((r) => ({
      id: r.id,
      type: "story" as const,
      rating: r.rating,
      comment: r.comment,
      parentName: r.user.name,
      parentEmail: r.user.email,
      storyTitle: r.story.title,
      childName: r.story.child.name,
      createdAt: r.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const storage = await getStorageStats();

  return {
    visitors: { today: visitorsToday, monthToDate: visitorsMonth, total: visitorsTotal },
    signupStarts: {
      today: signupStartsToday,
      monthToDate: signupStartsMonth,
      total: signupStartsTotal,
    },
    signupSubmits: {
      today: signupSubmitsToday,
      monthToDate: signupSubmitsMonth,
      total: signupSubmitsTotal,
    },
    abandonedCheckouts: {
      active: activePendingSignups,
      today: abandonedToday,
      monthToDate: abandonedMonth,
      total: abandonedTotal,
    },
    subscriptions: {
      today: subscriptionsToday,
      monthToDate: subscriptionsMonth,
      total: subscriptionsTotal,
    },
    revenue: {
      yesterday: revenueYesterday,
      monthToDate: revenueMonth,
      total: revenueTotal,
    },
    unsubscribes: {
      today: unsubscribesToday,
      monthToDate: unsubscribesMonth,
      total: unsubscribesTotal,
    },
    activeSubscribers,
    trialSubscribers,
    storiesSentToday,
    conversionRate,
    reviews,
    storage,
  };
}

export function formatRevenue(amount: number): string {
  return formatZar(amount);
}
