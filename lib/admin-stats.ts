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
  const groups = await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      eventType: ANALYTICS_EVENTS.PAGE_VIEW,
      createdAt: { gte: since },
    },
  });
  return groups.length;
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

async function countPaymentsSince(since: Date): Promise<number> {
  return prisma.payment.count({
    where: {
      paymentStatus: "COMPLETE",
      createdAt: { gte: since },
    },
  });
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

async function uniqueVisitorsBetween(start: Date, end: Date): Promise<number> {
  const groups = await prisma.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      eventType: ANALYTICS_EVENTS.PAGE_VIEW,
      createdAt: { gte: start, lte: end },
    },
  });
  return groups.length;
}

async function countEventsBetween(eventType: string, start: Date, end: Date): Promise<number> {
  return prisma.analyticsEvent.count({
    where: { eventType, createdAt: { gte: start, lte: end } },
  });
}

async function countPaymentsBetween(start: Date, end: Date): Promise<number> {
  return prisma.payment.count({
    where: {
      paymentStatus: "COMPLETE",
      createdAt: { gte: start, lte: end },
    },
  });
}

async function countSubscriptionsBetween(start: Date, end: Date): Promise<number> {
  return prisma.subscription.count({
    where: {
      createdAt: { gte: start, lte: end },
      status: { in: ["trial", "active", "cancel_pending", "cancelled"] },
    },
  });
}

async function countUnsubscribesBetween(start: Date, end: Date): Promise<number> {
  return prisma.subscription.count({
    where: {
      OR: [
        { cancelRequestedAt: { gte: start, lte: end } },
        {
          status: "cancelled",
          updatedAt: { gte: start, lte: end },
          cancelRequestedAt: null,
        },
      ],
    },
  });
}

async function countStoriesSentBetween(start: Date, end: Date): Promise<number> {
  return prisma.story.count({
    where: { sentAt: { gte: start, lte: end } },
  });
}

export type PeriodCount = {
  today: number;
  yesterday: number;
  monthToDate: number;
  total: number;
};

export type AdminDashboardStats = {
  visitors: PeriodCount;
  signupStarts: PeriodCount;
  signupSubmits: PeriodCount;
  abandonedCheckouts: { active: number; today: number; yesterday: number; monthToDate: number; total: number };
  subscriptions: PeriodCount;
  revenue: { today: number; yesterday: number; monthToDate: number; total: number };
  unsubscribes: PeriodCount;
  activeSubscribers: number;
  trialSubscribers: number;
  storiesSentToday: number;
  storiesSentYesterday: number;
  conversionRate: number;
  totalAccounts: number;
  accountsMissingSubscription: number;
  payfastPayments: PeriodCount;
  payfastCheckouts: PeriodCount;
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
    visitorsYesterday,
    visitorsMonth,
    visitorsTotal,
    signupStartsToday,
    signupStartsYesterday,
    signupStartsMonth,
    signupStartsTotal,
    signupSubmitsToday,
    signupSubmitsYesterday,
    signupSubmitsMonth,
    signupSubmitsTotal,
    activationsToday,
    activationsYesterday,
    activationsMonth,
    activationsTotal,
    activePendingSignups,
    expiredPendingSignups,
    subscriptionsToday,
    subscriptionsYesterday,
    subscriptionsMonth,
    subscriptionsTotal,
    revenueToday,
    revenueYesterday,
    revenueMonth,
    revenueTotal,
    unsubscribesToday,
    unsubscribesYesterday,
    unsubscribesMonth,
    unsubscribesTotal,
    activeSubscribers,
    trialSubscribers,
    storiesSentToday,
    storiesSentYesterday,
    siteReviews,
    storyReviews,
    totalAccounts,
    accountsMissingSubscription,
    payfastPaymentsToday,
    payfastPaymentsYesterday,
    payfastPaymentsMonth,
    payfastPaymentsTotal,
    payfastCheckoutsToday,
    payfastCheckoutsYesterday,
    payfastCheckoutsMonth,
    payfastCheckoutsTotal,
  ] = await Promise.all([
    uniqueVisitorsSince(todayStart),
    uniqueVisitorsBetween(yesterdayStart, yesterdayEnd),
    uniqueVisitorsSince(monthStart),
    uniqueVisitorsSince(new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_START, todayStart),
    countEventsBetween(ANALYTICS_EVENTS.SIGNUP_START, yesterdayStart, yesterdayEnd),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_START, monthStart),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_START, new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_SUBMIT, todayStart),
    countEventsBetween(ANALYTICS_EVENTS.SIGNUP_SUBMIT, yesterdayStart, yesterdayEnd),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_SUBMIT, monthStart),
    countEventsSince(ANALYTICS_EVENTS.SIGNUP_SUBMIT, new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, todayStart),
    countEventsBetween(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, yesterdayStart, yesterdayEnd),
    countEventsSince(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, monthStart),
    countEventsSince(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, new Date(0)),
    prisma.pendingSignup.count({ where: { expiresAt: { gt: now } } }),
    prisma.pendingSignup.count({ where: { expiresAt: { lte: now } } }),
    countSubscriptionsSince(todayStart),
    countSubscriptionsBetween(yesterdayStart, yesterdayEnd),
    countSubscriptionsSince(monthStart),
    countSubscriptionsSince(new Date(0)),
    sumRevenueBetween(todayStart, now),
    sumRevenueBetween(yesterdayStart, yesterdayEnd),
    sumRevenueBetween(monthStart, now),
    sumRevenueBetween(new Date(0), now),
    countUnsubscribesSince(todayStart),
    countUnsubscribesBetween(yesterdayStart, yesterdayEnd),
    countUnsubscribesSince(monthStart),
    countUnsubscribesSince(new Date(0)),
    prisma.subscription.count({ where: { status: { in: ["trial", "active"] } } }),
    prisma.subscription.count({ where: { status: "trial" } }),
    prisma.story.count({ where: { sentAt: { gte: todayStart } } }),
    countStoriesSentBetween(yesterdayStart, yesterdayEnd),
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
    prisma.user.count(),
    prisma.user.count({ where: { subscription: null } }),
    countPaymentsSince(todayStart),
    countPaymentsBetween(yesterdayStart, yesterdayEnd),
    countPaymentsSince(monthStart),
    countPaymentsSince(new Date(0)),
    countEventsSince(ANALYTICS_EVENTS.PAYFAST_PAYMENT_COMPLETE, todayStart),
    countEventsBetween(ANALYTICS_EVENTS.PAYFAST_PAYMENT_COMPLETE, yesterdayStart, yesterdayEnd),
    countEventsSince(ANALYTICS_EVENTS.PAYFAST_PAYMENT_COMPLETE, monthStart),
    countEventsSince(ANALYTICS_EVENTS.PAYFAST_PAYMENT_COMPLETE, new Date(0)),
  ]);

  const abandonedToday = Math.max(0, signupSubmitsToday - activationsToday);
  const abandonedYesterday = Math.max(0, signupSubmitsYesterday - activationsYesterday);
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
    visitors: {
      today: visitorsToday,
      yesterday: visitorsYesterday,
      monthToDate: visitorsMonth,
      total: visitorsTotal,
    },
    signupStarts: {
      today: signupStartsToday,
      yesterday: signupStartsYesterday,
      monthToDate: signupStartsMonth,
      total: signupStartsTotal,
    },
    signupSubmits: {
      today: signupSubmitsToday,
      yesterday: signupSubmitsYesterday,
      monthToDate: signupSubmitsMonth,
      total: signupSubmitsTotal,
    },
    abandonedCheckouts: {
      active: activePendingSignups,
      today: abandonedToday,
      yesterday: abandonedYesterday,
      monthToDate: abandonedMonth,
      total: abandonedTotal,
    },
    subscriptions: {
      today: subscriptionsToday,
      yesterday: subscriptionsYesterday,
      monthToDate: subscriptionsMonth,
      total: subscriptionsTotal,
    },
    revenue: {
      today: revenueToday,
      yesterday: revenueYesterday,
      monthToDate: revenueMonth,
      total: revenueTotal,
    },
    unsubscribes: {
      today: unsubscribesToday,
      yesterday: unsubscribesYesterday,
      monthToDate: unsubscribesMonth,
      total: unsubscribesTotal,
    },
    activeSubscribers,
    trialSubscribers,
    storiesSentToday,
    storiesSentYesterday,
    conversionRate,
    totalAccounts,
    accountsMissingSubscription,
    payfastPayments: {
      today: payfastPaymentsToday,
      yesterday: payfastPaymentsYesterday,
      monthToDate: payfastPaymentsMonth,
      total: payfastPaymentsTotal,
    },
    payfastCheckouts: {
      today: payfastCheckoutsToday,
      yesterday: payfastCheckoutsYesterday,
      monthToDate: payfastCheckoutsMonth,
      total: payfastCheckoutsTotal,
    },
    reviews,
    storage,
  };
}

export function formatRevenue(amount: number): string {
  return formatZar(amount);
}
