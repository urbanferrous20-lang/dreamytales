/**
 * Write the story delivery email HTML to a local file for browser preview.
 * Run: npm run preview:story-email:html
 */
import fs from "fs/promises";
import path from "path";
import { buildStoryDeliveryEmailHtml } from "../lib/story-delivery-email";
import { SITE_URL } from "../lib/site";
import { SAMPLE_STORY } from "../lib/sample-story";

async function main() {
  const html = buildStoryDeliveryEmailHtml({
    parentName: "Morne",
    childName: SAMPLE_STORY.childName,
    storyTitle: SAMPLE_STORY.title,
    teaser: SAMPLE_STORY.teaser,
    manageUrl: `${SITE_URL}/dashboard`,
    includesNarration: process.argv.includes("--audio"),
  });

  const outPath = path.join(process.cwd(), "storage", "story-email-preview.html");
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, html, "utf8");
  console.log("Preview written to:", outPath);
  console.log("Open that file in your browser to see the email layout.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
