/**
 * Build Morne sample PDF from pre-generated assets and email if Resend is configured.
 * Run: npm run sample:morne
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import { Resend } from "resend";
import { assembleStoryPdf } from "../lib/pdf-builder/layout";
import { FROM_EMAIL } from "../lib/site";

const RECIPIENT = "urbanferrous20@gmail.com";
const ASSETS_DIR = path.join(process.cwd(), "assets");
const OUTPUT_DIR = path.join(process.cwd(), "storage", "stories");

const story = {
  title: "Morne and the Paper Plane Over Table Mountain",
  childName: "Morne",
  teaser:
    "Tonight, a breeze from the Atlantic carries a glowing paper plane to Morne's garden beneath Table Mountain — and whispers that some dreams were made to fly.",
  pages: [
    {
      pageNumber: 1,
      text: "Morne stood in the garden after bath time. Table Mountain stood tall and quiet against the purple sky. A cool sea breeze from the Atlantic rustled the fynbos, and far away a plane blinked like a sleepy star.",
    },
    {
      pageNumber: 2,
      text: "Morne loved everything that flew. Kites. Seagulls. The helicopters over the harbour. He folded a paper plane from his notebook and whispered, \"Fly for me.\"",
    },
    {
      pageNumber: 3,
      text: "The paper plane lifted — not much, just a flutter — then hung in the air as if listening. A gentle wind circled Morne's ankles. It smelled of salt and summer rain.",
    },
    {
      pageNumber: 4,
      text: "\"I am Nimbus,\" said a small cloud shaped like a puff of cotton wool. \"Every flyer in Cape Town sends one wish on the wind. Tonight, yours is ready.\"",
    },
    {
      pageNumber: 5,
      text: "Morne's wish was simple. \"I want to fly — just once — over my mountain and my sea.\" Nimbus smiled. \"Brave wishes need brave helpers. Fold another plane.\"",
    },
    {
      pageNumber: 6,
      text: "Morne folded again. This plane shimmered silver-blue, like the moon on the water at Camps Bay. Nimbus tucked a feather of wind beneath each wing.",
    },
    {
      pageNumber: 7,
      text: "The plane grew — still paper, still light — big enough for Morne to sit on. \"Only above the garden,\" said Nimbus. \"Hold tight.\" Morne held tight.",
    },
    {
      pageNumber: 8,
      text: "They glided over rooftops and jacaranda trees. The stadium lights winked hello. The ocean spread out dark and friendly, full of quiet ships.",
    },
    {
      pageNumber: 9,
      text: "Morne flew once around the flat top of the mountain, slow as a lullaby. Then the plane drifted down, down, into the garden, soft as a dandelion seed.",
    },
    {
      pageNumber: 10,
      text: "Morne's feet touched the grass. Nimbus yawned like a little storm. \"Flyers rest when the moon is ready,\" it said. Morne climbed into bed. \"Goodnight, Morne,\" whispered the Cape Town wind. \"Dream in blue.\"",
    },
  ],
};

async function buildPdf(): Promise<string> {
  const pdfBytes = await assembleStoryPdf({
    title: story.title,
    childName: story.childName,
    pages: story.pages,
    loadImage: async (pageNumber) => {
      const imagePath = path.join(ASSETS_DIR, `morne-page-${pageNumber}.png`);
      try {
        return await fs.readFile(imagePath);
      } catch {
        console.warn(`Missing image for page ${pageNumber}`);
        return undefined;
      }
    },
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outPath = path.join(OUTPUT_DIR, `morne-sample-${Date.now()}.pdf`);
  await fs.writeFile(outPath, pdfBytes);
  return outPath;
}

async function main() {
  console.log("Building PDF from assets...");
  const pdfPath = await buildPdf();
  console.log("PDF saved:", path.resolve(pdfPath));

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.log("\nRESEND_API_KEY not in .env.local — cannot email yet.");
    console.log("Add RESEND_API_KEY and re-run to send to", RECIPIENT);
    return;
  }

  console.log("Sending to", RECIPIENT, "...");
  const resend = new Resend(resendKey);
  const pdfBuffer = await fs.readFile(pdfPath);

  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? FROM_EMAIL,
    to: RECIPIENT,
    subject: `Tonight's story for Morne: ${story.title}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; color: #1e293b;">
        <p>Hi Morne,</p>
        <p>${story.teaser}</p>
        <p>This is a <strong>sample Dreamy Tales story</strong> — set in Cape Town, with your love of flying woven in. The illustrated PDF is attached.</p>
      </div>
    `,
    attachments: [{ filename: "morne-cape-town-flying-story.pdf", content: pdfBuffer }],
  });

  if (result.error) {
    console.error("Email failed:", result.error);
    process.exit(1);
  }

  console.log("Email sent! Check", RECIPIENT);
}

main().catch(console.error);
