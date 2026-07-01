/**
 * Test OpenAI narration for a sample story (uses last Paul PDF pages or built-in snippet).
 * Run: npm run sample:narration
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import {
  buildAndSaveStoryNarration,
  generateStoryNarration,
  PAGE_PAUSE_SECONDS,
  NARRATION_VOICE,
} from "../lib/story-narration";

const SAMPLE_PAGES = [
  {
    pageNumber: 1,
    text: "Paul pushed his chair back from the desk and rubbed his eyes. The Highveld sky outside his window was turning from gold to violet.",
  },
  {
    pageNumber: 2,
    text: "He followed the trail of jacaranda petals to the windowsill, where something glinted in the last of the sunlight — a small brass key, warm and mysterious.",
  },
  {
    pageNumber: 3,
    text: "After supper, when the house had gone quiet, Paul slipped out into the cool Johannesburg evening, the key safe in his pocket.",
  },
];

async function main() {
  console.log(`Generating test narration (voice: ${NARRATION_VOICE}, ${PAGE_PAUSE_SECONDS}s pause between pages)...`);

  const mp3 = await generateStoryNarration(SAMPLE_PAGES);
  const outDir = path.join(process.cwd(), "storage", "audio", "sample-test");
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `narration-test-${Date.now()}.mp3`);
  await fs.writeFile(outPath, mp3);

  console.log("Saved:", path.resolve(outPath));
  console.log("Size KB:", Math.round(mp3.length / 1024));

  const savedPath = await buildAndSaveStoryNarration("sample-test", SAMPLE_PAGES);
  console.log("Also saved via pipeline:", path.resolve(savedPath));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
