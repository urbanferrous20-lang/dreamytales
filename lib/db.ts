import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function hasReviewModels(client: PrismaClient) {
  return (
    typeof client.siteReview?.aggregate === "function" &&
    typeof client.storyReview?.aggregate === "function"
  );
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  if (cached && hasReviewModels(cached)) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
