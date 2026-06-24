/**
 * Generate side-by-side layout samples (classic split vs overlay-on-image).
 * Run: npm run sample:layouts
 *
 * Outputs to storage/stories/:
 *   sample-layout-classic-*.pdf   — legacy text panel + image split
 *   sample-layout-overlay-dark-*.pdf — production: text on image, dark frosted band
 *   sample-layout-overlay-light-*.pdf — alternate: text on image, light frosted band
 */
import fs from "fs/promises";
import path from "path";
import { assembleStoryPdf, assembleStoryPdfClassic } from "../lib/pdf-builder/layout";
import { assembleStoryPdfOverlay } from "../lib/pdf-builder/layout-overlay";

const ASSETS_DIR = path.join(process.cwd(), "assets");
const OUTPUT_DIR = path.join(process.cwd(), "storage", "stories");

const story = {
  title: "Morne and the Paper Plane Over Table Mountain",
  childName: "Morne",
  pages: [
    {
      pageNumber: 1,
      text: "Morne stood in the garden after bath time. Table Mountain stood tall against the purple sky. A cool sea breeze rustled the fynbos.",
    },
    {
      pageNumber: 2,
      text: "Morne loved everything that flew. Kites. Seagulls. Helicopters over the harbour. He folded a paper plane and whispered, \"Fly for me.\"",
    },
    {
      pageNumber: 3,
      text: "The paper plane lifted — just a flutter — then hung in the air as if listening. A gentle wind circled Morne's ankles. It smelled of salt and rain.",
    },
    {
      pageNumber: 4,
      text: "\"I am Nimbus,\" said a small cloud like cotton wool. \"Every flyer in Cape Town sends one wish on the wind. Tonight, yours is ready.\"",
    },
    {
      pageNumber: 5,
      text: "Morne's wish was simple. \"I want to fly — just once — over my mountain and my sea.\" Nimbus smiled. \"Fold another plane.\"",
    },
    {
      pageNumber: 6,
      text: "Morne folded again. This plane shimmered silver-blue, like moonlight on the water at Camps Bay. Nimbus tucked wind beneath each wing.",
    },
    {
      pageNumber: 7,
      text: "The plane grew — still paper, still light — big enough for Morne to sit on. \"Only above the garden,\" said Nimbus. \"Hold tight.\"",
    },
    {
      pageNumber: 8,
      text: "They glided over rooftops and jacaranda trees. Stadium lights winked hello. The ocean spread out dark and friendly, full of quiet ships.",
    },
    {
      pageNumber: 9,
      text: "Morne flew once around the flat top of the mountain, slow as a lullaby. Then the plane drifted down into the garden, soft as a seed.",
    },
    {
      pageNumber: 10,
      text: "Morne's feet touched the grass. \"Flyers rest when the moon is ready,\" said Nimbus. \"Goodnight, Morne,\" whispered the Cape Town wind.",
    },
  ],
};

async function loadImage(pageNumber: number): Promise<Buffer | undefined> {
  const imagePath = path.join(ASSETS_DIR, `morne-page-${pageNumber}.png`);
  try {
    return await fs.readFile(imagePath);
  } catch {
    console.warn(`Missing image for page ${pageNumber}`);
    return undefined;
  }
}

async function writeSample(label: string, bytes: Uint8Array): Promise<string> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outPath = path.join(OUTPUT_DIR, `${label}-${Date.now()}.pdf`);
  await fs.writeFile(outPath, bytes);
  return outPath;
}

async function main() {
  const base = {
    title: story.title,
    childName: story.childName,
    pages: story.pages,
    loadImage,
  };

  console.log("Building layout samples (3 PDFs)...\n");

  const classicPath = await writeSample(
    "sample-layout-classic",
    await assembleStoryPdfClassic(base)
  );
  console.log("Classic (split panel):", path.resolve(classicPath));

  const overlayDarkPath = await writeSample(
    "sample-layout-overlay-dark",
    await assembleStoryPdf(base)
  );
  console.log("Overlay dark band:  ", path.resolve(overlayDarkPath));

  const overlayLightPath = await writeSample(
    "sample-layout-overlay-light",
    await assembleStoryPdfOverlay({ ...base, variant: "light" })
  );
  console.log("Overlay light band: ", path.resolve(overlayLightPath));

  console.log("\nProduction uses overlay-dark. Open on your phone to compare if needed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
