import { prisma } from "@/lib/db";
import { getPublicDisplayName } from "@/lib/reviews";

export async function getPublicReviewStats() {
  try {
    const [siteStats, siteReviews, storyStats, storyReviews] = await Promise.all([
      prisma.siteReview.aggregate({ _avg: { rating: true }, _count: true }),
      prisma.siteReview.findMany({
        where: { rating: { gte: 4 }, comment: { not: null } },
        include: { user: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
      prisma.storyReview.aggregate({ _avg: { rating: true }, _count: true }),
      prisma.storyReview.findMany({
        where: { rating: { gte: 4 }, comment: { not: null } },
        include: {
          user: { select: { name: true } },
          story: { select: { title: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
      }),
    ]);

    const testimonials = [
      ...siteReviews.map((r) => ({
        type: "site" as const,
        rating: r.rating,
        comment: r.comment!,
        author: getPublicDisplayName(r.user.name),
        context: "Dreamy Tales subscriber",
      })),
      ...storyReviews.map((r) => ({
        type: "story" as const,
        rating: r.rating,
        comment: r.comment!,
        author: getPublicDisplayName(r.user.name),
        context: r.story.title,
      })),
    ]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    const totalReviews = siteStats._count + storyStats._count;
    const combinedAvg =
      totalReviews > 0
        ? ((siteStats._avg.rating ?? 0) * siteStats._count +
            (storyStats._avg.rating ?? 0) * storyStats._count) /
          totalReviews
        : null;

    return {
      averageRating: combinedAvg ? Math.round(combinedAvg * 10) / 10 : null,
      totalReviews,
      testimonials,
    };
  } catch {
    return {
      averageRating: null,
      totalReviews: 0,
      testimonials: [],
    };
  }
}
