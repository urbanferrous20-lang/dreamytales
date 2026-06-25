/**
 * One-off sample: Morne's Cape Town flying story → PDF → email
 * Run: npx tsx --env-file=.env.local --env-file=.env scripts/send-morne-sample.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import { isSmtpConfigured, sendPdfEmail } from "../lib/smtp";
import OpenAI from "openai";
import { optimizeIllustration } from "../lib/image-optimize";
import {
  ILLUSTRATION_OPENAI_QUALITY,
  ILLUSTRATION_OPENAI_SIZE,
} from "../lib/ai/illustration-settings";
import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import type { ChildProfileInput } from "../lib/types/child";
import { formatSaLocation } from "../lib/sa-locations";

const RECIPIENT = "urbanferrous20@gmail.com";
const CHILD_ID = "sample-morne";

const morneProfile: ChildProfileInput = {
  name: "Morne",
  age: 7,
  pronouns: "he/him",
  interests: ["flying", "airplanes", "space"],
  favoriteColors: "Blue",
  province: "Western Cape",
  cityOrTown: "Cape Town",
  storyMood: "gentle",
  readAloudBy: "parent",
  language: "english",
  favoritePlace: "the garden overlooking the mountain",
};

const characterBible = {
  protagonist: "Morne, a curious 7-year-old boy who dreams of flying",
  appearance: "Short brown hair, blue pyjamas, warm brown skin, bright curious eyes",
  personality: "Brave, kind, wonder-filled, gentle at heart",
  world: "A cosy Cape Town home beneath Table Mountain, with sea breezes and starry skies",
  recurringElements: ["Table Mountain", "sea breeze", "paper planes", "friendly moon"],
  illustrationStyle: "Soft flat digital art, muted blues and golds, bedtime calm",
};

const story = {
  title: "Morne and the Paper Plane Over Table Mountain",
  teaser:
    "Tonight, a breeze from the Atlantic carries a glowing paper plane to Morne's garden beneath Table Mountain — and whispers that some dreams were made to fly.",
  summary: "Morne follows a magical paper plane from his Cape Town garden toward the stars.",
  pages: [
    {
      pageNumber: 1,
      text: "Morne stood in the garden after bath time. Table Mountain stood tall and quiet against the purple sky. A cool sea breeze from the Atlantic rustled the fynbos, and far away a plane blinked like a sleepy star.",
      sceneDescription:
        "Boy in blue pyjamas in a Cape Town garden at dusk, Table Mountain silhouette, fynbos plants, distant airplane light in sky",
      mood: "calm, wonder",
    },
    {
      pageNumber: 2,
      text: "Morne loved everything that flew. Kites. Seagulls. The helicopters over the harbour. He folded a paper plane from his notebook and whispered, \"Fly for me.\"",
      sceneDescription:
        "Boy folding a paper airplane in garden, Cape Town harbour and seagulls in soft background, warm evening light",
      mood: "hopeful",
    },
    {
      pageNumber: 3,
      text: "The paper plane lifted — not much, just a flutter — then hung in the air as if listening. A gentle wind circled Morne's ankles. It smelled of salt and summer rain.",
      sceneDescription:
        "Paper plane floating magically above boy's hands, Table Mountain and ocean breeze, soft golden glow around plane",
      mood: "magical, gentle",
    },
    {
      pageNumber: 4,
      text: "\"I am Nimbus,\" said a small cloud shaped like a puff of cotton wool. \"Every flyer in Cape Town sends one wish on the wind. Tonight, yours is ready.\"",
      sceneDescription:
        "Friendly small cloud character with soft face near boy in garden, Table Mountain backdrop, twilight colours",
      mood: "friendly, whimsical",
    },
    {
      pageNumber: 5,
      text: "Morne's wish was simple. \"I want to fly — just once — over my mountain and my sea.\" Nimbus smiled. \"Brave wishes need brave helpers. Fold another plane.\"",
      sceneDescription:
        "Boy talking to friendly cloud, holding paper, stars appearing, Cape Town city lights far below mountain",
      mood: "warm, encouraging",
    },
    {
      pageNumber: 6,
      text: "Morne folded again. This plane shimmered silver-blue, like the moon on the water at Camps Bay. Nimbus tucked a feather of wind beneath each wing.",
      sceneDescription:
        "Shimmering silver-blue paper plane with soft wind swirls, boy watching in amazement, ocean moonlight feel",
      mood: "building excitement, still calm",
    },
    {
      pageNumber: 7,
      text: "The plane grew — still paper, still light — big enough for Morne to sit on. \"Only above the garden,\" said Nimbus. \"Hold tight.\" Morne held tight.",
      sceneDescription:
        "Boy sitting on large magical paper plane hovering above garden, Table Mountain and city below, gentle starlight",
      mood: "gentle adventure",
    },
    {
      pageNumber: 8,
      text: "They glided over rooftops and jacaranda trees. The stadium lights winked hello. The ocean spread out dark and friendly, full of quiet ships.",
      sceneDescription:
        "Aerial view boy on paper plane over Cape Town rooftops, jacaranda trees, distant stadium and harbour lights",
      mood: "peaceful adventure",
    },
    {
      pageNumber: 9,
      text: "Morne flew once around the flat top of the mountain, slow as a lullaby. Then the plane drifted down, down, into the garden, soft as a dandelion seed.",
      sceneDescription:
        "Paper plane circling Table Mountain summit at night, boy smiling, city and sea below, soft moon",
      mood: "wonder, settling",
    },
    {
      pageNumber: 10,
      text: "Morne's feet touched the grass. Nimbus yawned like a little storm. \"Flyers rest when the moon is ready,\" it said. Morne climbed into bed. \"Goodnight, Morne,\" whispered the Cape Town wind. \"Dream in blue.\"",
      sceneDescription:
        "Boy in bed by window with Table Mountain and moon visible, paper plane on bedside table, peaceful bedroom",
      mood: "sleepy, peaceful close",
    },
  ],
};

async function saveImage(childId: string, filename: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "storage", "images", childId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function buildStoryPdf(params: {
  childId: string;
  title: string;
  pages: Array<{ pageNumber: number; text: string; imagePath?: string; sceneDescription?: string }>;
  usePlaceholders?: boolean;
}): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;

  for (const page of params.pages) {
    const pdfPage = pdfDoc.addPage([pageWidth, pageHeight]);
    const artTop = pageHeight - margin - 380;
    const artHeight = 360;
    const artWidth = pageWidth - margin * 2;

    if (page.imagePath) {
      try {
        const imageBytes = await fs.readFile(page.imagePath);
        const image = await pdfDoc.embedPng(imageBytes).catch(() => pdfDoc.embedJpg(imageBytes));
        const imgDims = image.scale(1);
        const maxW = artWidth;
        const maxH = artHeight;
        const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height);
        const w = imgDims.width * scale;
        const h = imgDims.height * scale;
        pdfPage.drawImage(image, {
          x: (pageWidth - w) / 2,
          y: pageHeight - margin - h,
          width: w,
          height: h,
        });
      } catch {
        drawPlaceholderArt(pdfPage, margin, artTop, artWidth, artHeight, page.pageNumber);
      }
    } else if (params.usePlaceholders) {
      drawPlaceholderArt(pdfPage, margin, artTop, artWidth, artHeight, page.pageNumber);
    }

    let line = "";
    let y = pageHeight - margin - 420;
    const maxWidth = pageWidth - margin * 2;
    const fontSize = 14;
    const lineHeight = 20;

    for (const word of page.text.split(" ")) {
      const testLine = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && line) {
        pdfPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.12, 0.16, 0.22) });
        line = word;
        y -= lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line) {
      pdfPage.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.12, 0.16, 0.22) });
    }

    pdfPage.drawText(`${page.pageNumber}`, {
      x: pageWidth - margin - 10,
      y: margin,
      size: 10,
      font: boldFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const dir = path.join(process.cwd(), "storage", "stories");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${params.childId}-${Date.now()}.pdf`);
  await fs.writeFile(filePath, await pdfDoc.save());
  return filePath;
}

/** Simple Cape Town–themed art when OpenAI is unavailable */
function drawPlaceholderArt(page: PDFPage, x: number, y: number, w: number, h: number, pageNum: number) {
  const sky = pageNum <= 3 ? rgb(0.45, 0.55, 0.75) : rgb(0.15, 0.18, 0.35);
  page.drawRectangle({ x, y, width: w, height: h, color: sky });

  // Table Mountain silhouette
  page.drawRectangle({ x: x + w * 0.15, y: y + h * 0.35, width: w * 0.7, height: h * 0.08, color: rgb(0.25, 0.28, 0.35) });
  page.drawRectangle({ x: x + w * 0.35, y: y + h * 0.28, width: w * 0.25, height: h * 0.07, color: rgb(0.3, 0.32, 0.4) });

  // Ocean band
  page.drawRectangle({ x, y, width: w, height: h * 0.22, color: rgb(0.2, 0.35, 0.55) });

  // Garden / ground
  page.drawRectangle({ x, y: y + h * 0.22, width: w, height: h * 0.15, color: rgb(0.35, 0.5, 0.38) });

  // Moon or sun
  if (pageNum >= 8) {
    page.drawCircle({ x: x + w * 0.82, y: y + h * 0.78, size: 18, color: rgb(0.95, 0.92, 0.75) });
  }

  // Paper plane on flying pages
  if (pageNum >= 2 && pageNum <= 9) {
    page.drawRectangle({
      x: x + w * 0.42,
      y: y + h * 0.5,
      width: 36,
      height: 6,
      color: rgb(0.85, 0.88, 0.95),
    });
  }

  // Boy silhouette
  page.drawCircle({ x: x + w * 0.25, y: y + h * 0.32, size: 12, color: rgb(0.55, 0.4, 0.32) });
  page.drawRectangle({ x: x + w * 0.22, y: y + h * 0.18, width: 20, height: 28, color: rgb(0.3, 0.45, 0.7) });
}

function buildIllustrationPrompt(scene: {
  description: string;
  mood: string;
}): string {
  const locationHint = formatSaLocation(morneProfile.province, morneProfile.cityOrTown);
  return [
    "Children's bedtime short storybook illustration.",
    "Soft flat digital art, muted warm palette, calming bedtime mood.",
    "No text, no words, no letters in the image.",
    "Age-appropriate, friendly, gentle lighting.",
    `South African setting: ${locationHint}`,
    `Main character: ${morneProfile.name}, age ${morneProfile.age}, ${characterBible.appearance}`,
    `Scene: ${scene.description}`,
    `Mood: ${scene.mood}`,
  ].join(" ");
}

async function generateIllustration(openai: OpenAI, prompt: string): Promise<Buffer> {
  const response = await openai.images.generate({
    model: "gpt-image-1-mini",
    prompt,
    size: ILLUSTRATION_OPENAI_SIZE,
    quality: ILLUSTRATION_OPENAI_QUALITY,
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation returned no data");
  return optimizeIllustration(Buffer.from(b64, "base64"));
}

async function main() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const usePlaceholders = process.argv.includes("--placeholders") || !openaiKey;

  const imagePaths = new Map<number, string>();

  if (usePlaceholders) {
    console.log("Using illustrated placeholders (add OPENAI_API_KEY to .env.local for AI art)...");
  } else {
    console.log("Generating illustrations for 10 pages (this may take a few minutes)...");
    const openai = new OpenAI({ apiKey: openaiKey });

    for (const page of story.pages) {
      console.log(`  Page ${page.pageNumber}/10...`);
      const prompt = buildIllustrationPrompt(page);
      const buffer = await generateIllustration(openai, prompt);
      const imagePath = await saveImage(CHILD_ID, `page-${page.pageNumber}.jpg`, buffer);
      imagePaths.set(page.pageNumber, imagePath);
    }
  }

  console.log("Building PDF...");
  const pdfPath = await buildStoryPdf({
    childId: CHILD_ID,
    title: story.title,
    usePlaceholders,
    pages: story.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      imagePath: imagePaths.get(p.pageNumber),
      sceneDescription: p.sceneDescription,
    })),
  });

  console.log(`PDF saved: ${pdfPath}`);

  if (!isSmtpConfigured()) {
    console.log("\nSMTP not configured — PDF created locally but not emailed.");
    console.log(`Open the file at: ${path.resolve(pdfPath)}`);
    process.exit(0);
  }

  console.log(`Sending to ${RECIPIENT}...`);
  await sendPdfEmail({
    to: RECIPIENT,
    subject: `Tonight's story for Morne: ${story.title}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; color: #1e293b;">
        <p>Hi Morne,</p>
        <p>${story.teaser}</p>
        <p>This is a <strong>sample Dreamy Tales story</strong> — personalised for you in Cape Town, with your love of flying woven in. The full illustrated PDF is attached, exactly as a subscriber would receive it at 6pm.</p>
        <p style="color: #64748b; font-size: 14px;">Sweet dreams from Dreamy Tales. 🌙</p>
      </div>
    `,
    pdfPath,
    filename: "morne-cape-town-flying-story.pdf",
  });

  console.log("Done! Check your inbox at", RECIPIENT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
