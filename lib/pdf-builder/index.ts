import "server-only";
import fs from "fs/promises";
import path from "path";
import { assembleStoryPdf } from "./layout";

export type StoryPage = {
  pageNumber: number;
  text: string;
  imagePath?: string;
};

export async function ensureStorageDir(): Promise<string> {
  const dir = path.join(process.cwd(), "storage", "stories");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveImage(childId: string, filename: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "storage", "images", childId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function buildStoryPdf(params: {
  childId: string;
  title: string;
  childName: string;
  pages: StoryPage[];
}): Promise<string> {
  const pdfBytes = await assembleStoryPdf({
    title: params.title,
    childName: params.childName,
    pages: params.pages,
    loadImage: async (pageNumber) => {
      const page = params.pages.find((p) => p.pageNumber === pageNumber);
      if (!page?.imagePath) return undefined;
      try {
        return await fs.readFile(page.imagePath);
      } catch {
        return undefined;
      }
    },
  });

  const storageDir = await ensureStorageDir();
  const filename = `${params.childId}-${Date.now()}.pdf`;
  const filePath = path.join(storageDir, filename);
  await fs.writeFile(filePath, pdfBytes);
  return filePath;
}
