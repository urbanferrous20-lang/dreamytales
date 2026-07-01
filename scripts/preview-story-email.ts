/**
 * Send a preview of the nightly story delivery email (new branded template).
 * Run: npm run preview:story-email
 * Run: npm run preview:story-email -- you@example.com
 * Run: npm run preview:story-email -- you@example.com --audio
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import os from "os";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { buildStoryDeliveryEmailHtml } from "../lib/story-delivery-email";
import { isSmtpConfigured, sendStoryDeliveryEmail, formatSmtpError } from "../lib/smtp";
import { SITE_URL } from "../lib/site";
import { SAMPLE_STORY } from "../lib/sample-story";

async function buildPreviewPdf(): Promise<string> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([480, 640]);
  page.drawRectangle({ x: 0, y: 0, width: 480, height: 640, color: rgb(0.98, 0.96, 0.91) });
  page.drawRectangle({ x: 0, y: 600, width: 480, height: 40, color: rgb(0.12, 0.16, 0.29) });
  page.drawText("Dreamy Tales — email preview", {
    x: 40,
    y: 612,
    size: 12,
    font,
    color: rgb(0.91, 0.84, 0.65),
  });
  page.drawText(SAMPLE_STORY.title, {
    x: 40,
    y: 520,
    size: 16,
    font,
    color: rgb(0.12, 0.16, 0.29),
    maxWidth: 400,
  });
  page.drawText("This is a placeholder PDF for the email preview.", {
    x: 40,
    y: 480,
    size: 11,
    font,
    color: rgb(0.3, 0.35, 0.45),
    maxWidth: 400,
  });
  const bytes = await doc.save();
  const out = path.join(os.tmpdir(), `dreamytales-email-preview-${Date.now()}.pdf`);
  await fs.writeFile(out, bytes);
  return out;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const withAudio = process.argv.includes("--audio");
  const to = args[0]?.trim() || process.env.SAMPLE_EMAIL?.trim() || "urbanferrous20@gmail.com";

  if (!isSmtpConfigured()) {
    console.error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local");
    process.exit(1);
  }

  const pdfPath = await buildPreviewPdf();
  const slug = "morne-and-the-paper-plane-over-table-mountain";

  console.log(`Sending story email preview to ${to}${withAudio ? " (PDF + audio copy)" : ""}...`);

  await sendStoryDeliveryEmail({
    to,
    subject: `[Preview] Tonight's story for ${SAMPLE_STORY.childName}: ${SAMPLE_STORY.title}`,
    html: buildStoryDeliveryEmailHtml({
      parentName: "Morne",
      childName: SAMPLE_STORY.childName,
      storyTitle: SAMPLE_STORY.title,
      teaser: SAMPLE_STORY.teaser,
      manageUrl: `${SITE_URL}/dashboard`,
      includesNarration: withAudio,
    }),
    pdfPath,
    pdfFilename: `${slug}.pdf`,
    audioPath: withAudio ? pdfPath : null,
    audioFilename: withAudio ? `${slug}.mp3` : undefined,
  });

  console.log("Preview email sent!");
  await fs.unlink(pdfPath).catch(() => {});
}

main().catch((err) => {
  console.error("Failed to send preview email:");
  console.error(formatSmtpError(err));
  process.exit(1);
});
