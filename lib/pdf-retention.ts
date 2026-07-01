import "server-only";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { PDF_RETENTION_DAYS } from "@/lib/storage-config";

function getRetentionCutoff(): Date {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PDF_RETENTION_DAYS);
  cutoff.setHours(0, 0, 0, 0);
  return cutoff;
}

export async function cleanupExpiredPdfs(): Promise<{
  scanned: number;
  deleted: number;
  errors: string[];
}> {
  const cutoff = getRetentionCutoff();

  const expired = await prisma.story.findMany({
    where: {
      pdfPath: { not: "" },
      OR: [
        { sentAt: { lt: cutoff } },
        { sentAt: null, createdAt: { lt: cutoff } },
      ],
    },
    select: { id: true, pdfPath: true, audioPath: true, title: true },
  });

  const errors: string[] = [];
  let deleted = 0;

  for (const story of expired) {
    try {
      if (story.pdfPath) {
        await fs.unlink(story.pdfPath).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== "ENOENT") throw err;
        });
      }

      if (story.audioPath) {
        await fs.unlink(story.audioPath).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== "ENOENT") throw err;
        });
      }

      await prisma.story.update({
        where: { id: story.id },
        data: { pdfPath: "", audioPath: null },
      });

      deleted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${story.title} (${story.id}): ${message}`);
    }
  }

  return { scanned: expired.length, deleted, errors };
}
