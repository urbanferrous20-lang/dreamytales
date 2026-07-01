/**
 * Generate MP3 narration for the Morne Cape Town sample story.
 * Run: npm run sample:morne-narration
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import {
  buildAndSaveStoryNarration,
  NARRATION_VOICE,
  PAGE_PAUSE_SECONDS,
} from "../lib/story-narration";

const STORY = {
  title: "Morne and the Paper Plane Over Table Mountain",
  childName: "Morne",
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

async function main() {
  console.log(`Generating narration for "${STORY.title}"`);
  console.log(`Voice: ${NARRATION_VOICE} · ${PAGE_PAUSE_SECONDS}s pause between pages · ${STORY.pages.length} pages`);
  console.log("This may take a minute...\n");

  const slug = STORY.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const outPath = await buildAndSaveStoryNarration(`sample-morne-${slug}`, STORY.pages, {
    language: "english",
  });
  const stat = await fs.stat(outPath);

  console.log("Saved:", path.resolve(outPath));
  console.log("Size MB:", (stat.size / (1024 * 1024)).toFixed(2));
  console.log("\nOpen the MP3 in your media player to listen.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
