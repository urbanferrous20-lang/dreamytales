import sharp from "sharp";
import { ILLUSTRATION_JPEG_QUALITY, ILLUSTRATION_MAX_PX } from "@/lib/ai/illustration-settings";

/** Resize and compress AI illustrations before PDF embed / disk storage. */
export async function optimizeIllustration(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(ILLUSTRATION_MAX_PX, ILLUSTRATION_MAX_PX, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: ILLUSTRATION_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}
