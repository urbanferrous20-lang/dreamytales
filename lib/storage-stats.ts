import "server-only";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import {
  DEFAULT_AVG_PDF_BYTES,
  PDF_RETENTION_DAYS,
  STORAGE_QUOTA_BYTES,
  STORAGE_QUOTA_GB,
  isPdfStored,
} from "@/lib/storage-config";

async function getDirectorySizeBytes(dir: string): Promise<number> {
  let total = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        total += await getDirectorySizeBytes(fullPath);
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        total += stat.size;
      }
    }
  } catch {
    // Directory may not exist yet on a fresh deploy
  }
  return total;
}

function getRetentionCutoff(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PDF_RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export type StorageStats = {
  quotaGb: number;
  quotaBytes: number;
  pdfBytes: number;
  imageBytes: number;
  totalStoryStorageBytes: number;
  estimatedAppOverheadBytes: number;
  estimatedUsedBytes: number;
  estimatedFreeBytes: number;
  percentUsed: number;
  pdfFileCount: number;
  archivedStoryCount: number;
  pendingCleanupCount: number;
  activeChildren: number;
  avgPdfBytes: number;
  estimatedDailyGrowthBytes: number;
  estimatedMonthlyGrowthBytes: number;
  estimatedDaysUntilFull: number | null;
  retentionDays: number;
};

export async function getStorageStats(): Promise<StorageStats> {
  const root = process.cwd();
  const storiesDir = path.join(root, "storage", "stories");
  const imagesDir = path.join(root, "storage", "images");

  const [pdfBytes, imageBytes, pdfFileCount, archivedStoryCount, pendingCleanupCount, activeChildren] =
    await Promise.all([
      getDirectorySizeBytes(storiesDir),
      getDirectorySizeBytes(imagesDir),
      fs
        .readdir(storiesDir)
        .then((files) => files.filter((f) => f.endsWith(".pdf")).length)
        .catch(() => 0),
      prisma.story.count({ where: { pdfPath: "" } }),
      prisma.story.count({
        where: {
          pdfPath: { not: "" },
          OR: [
            { sentAt: { lt: getRetentionCutoff() } },
            { sentAt: null, createdAt: { lt: getRetentionCutoff() } },
          ],
        },
      }),
      prisma.childProfile.count({
        where: {
          user: {
            subscription: {
              status: { in: ["trial", "active", "cancel_pending"] },
              OR: [{ accessEndsAt: null }, { accessEndsAt: { gt: new Date() } }],
            },
          },
        },
      }),
    ]);

  const totalStoryStorageBytes = pdfBytes + imageBytes;
  const estimatedAppOverheadBytes = Math.min(2 * 1024 * 1024 * 1024, STORAGE_QUOTA_BYTES * 0.12);
  const estimatedUsedBytes = Math.min(STORAGE_QUOTA_BYTES, totalStoryStorageBytes + estimatedAppOverheadBytes);
  const estimatedFreeBytes = Math.max(0, STORAGE_QUOTA_BYTES - estimatedUsedBytes);
  const percentUsed = Math.round((estimatedUsedBytes / STORAGE_QUOTA_BYTES) * 1000) / 10;

  const avgPdfBytes =
    pdfFileCount > 0 ? Math.round(pdfBytes / pdfFileCount) : DEFAULT_AVG_PDF_BYTES;

  const estimatedDailyGrowthBytes = activeChildren * avgPdfBytes;
  const estimatedMonthlyGrowthBytes = estimatedDailyGrowthBytes * 30;
  const estimatedDaysUntilFull =
    estimatedDailyGrowthBytes > 0
      ? Math.floor(estimatedFreeBytes / estimatedDailyGrowthBytes)
      : null;

  return {
    quotaGb: STORAGE_QUOTA_GB,
    quotaBytes: STORAGE_QUOTA_BYTES,
    pdfBytes,
    imageBytes,
    totalStoryStorageBytes,
    estimatedAppOverheadBytes,
    estimatedUsedBytes,
    estimatedFreeBytes,
    percentUsed,
    pdfFileCount,
    archivedStoryCount,
    pendingCleanupCount,
    activeChildren,
    avgPdfBytes,
    estimatedDailyGrowthBytes,
    estimatedMonthlyGrowthBytes,
    estimatedDaysUntilFull,
    retentionDays: PDF_RETENTION_DAYS,
  };
}
