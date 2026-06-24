import { z } from "zod";

export const reviewRatingSchema = z.number().int().min(1).max(5);

export const storyReviewSchema = z.object({
  storyId: z.string().min(1),
  rating: reviewRatingSchema,
  comment: z.string().max(500).optional(),
});

export const siteReviewSchema = z.object({
  rating: reviewRatingSchema,
  comment: z.string().max(1000).optional(),
});

export type StoryReviewInput = z.infer<typeof storyReviewSchema>;
export type SiteReviewInput = z.infer<typeof siteReviewSchema>;

export function formatRatingStars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function getPublicDisplayName(fullName: string): string {
  const first = fullName.trim().split(" ")[0];
  return first ? `${first}.` : "A parent";
}
