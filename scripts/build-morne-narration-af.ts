/**
 * Generate MP3 narration for the Morne Cape Town sample story in Afrikaans.
 * Run: npm run sample:morne-narration:af
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
import { isGoogleTtsConfigured } from "../lib/google-tts";

const STORY = {
  title: "Morne en die Papiervliegtuig oor Tafelberg",
  childName: "Morne",
  pages: [
    {
      pageNumber: 1,
      text: "Morne staan in die tuin ná badtyd. Tafelberg staan hoog en stil teen die pers hemel. 'n Koel seebries van die Atlantiese Oseaan ritsel in die fynbos, en ver weg het 'n vliegtuig geblink soos 'n slapende ster.",
    },
    {
      pageNumber: 2,
      text: "Morne hou van alles wat kan vlieg. Reuse. Seemeeue. Helikopters oor die hawe. Hy vou 'n papiervliegtuig uit sy notaboek en fluister: \"Vlieg vir my.\"",
    },
    {
      pageNumber: 3,
      text: "Die papiervliegtuig styg op — nie baie nie, net 'n fladder — en hang dan in die lug asof dit luister. 'n Sagte wind sirkuleer om Morne se enkels. Dit ruik na sout en somerreën.",
    },
    {
      pageNumber: 4,
      text: "\"Ek is Nimbus,\" sê 'n wolkie wat soos bommetjies lyk. \"Elke vlieënier in Kaapstad stuur een wens op die wind. Vanavond is joune gereed.\"",
    },
    {
      pageNumber: 5,
      text: "Morne se wens was eenvoudig. \"Ek wil vlieg — net een keer — oor my berg en my see.\" Nimbus glimlag. \"Dapper wense het dapper helpers nodig. Vou nog 'n vliegtuig.\"",
    },
    {
      pageNumber: 6,
      text: "Morne vou weer. Hierdie vliegtuig glinster silwer-blou, soos die maan op die water by Campsbaai. Nimbus steek 'n veer van wind onder elke vlerk.",
    },
    {
      pageNumber: 7,
      text: "Die vliegtuig word groter — steeds papier, steeds lig — groot genoeg vir Morne om op te sit. \"Net bo die tuin,\" sê Nimbus. \"Hou vas.\" Morne hou vas.",
    },
    {
      pageNumber: 8,
      text: "Hulle gly oor dakke en jakaranda-bome. Die stadion se ligte knip oog. Die oseaan strek donker en vriendelik, vol stil skepe.",
    },
    {
      pageNumber: 9,
      text: "Morne vlieg een keer om die plat top van die berg, stadig soos 'n wiegliedjie. Dan dryf die vliegtuig af, af, in die tuin in, sag soos 'n blaasblom-seed.",
    },
    {
      pageNumber: 10,
      text: "Morne se voete raak die gras. Nimbus gaap soos 'n klein stormpie. \"Vlieërs rus wanneer die maan gereed is,\" sê hy. Morne klim in bed. \"Lekker droom, Morne,\" fluister die Kaapstad-wind. \"Droom in blou.\"",
    },
  ],
};

async function main() {
  console.log(`Generating Afrikaans narration for "${STORY.title}"`);
  console.log(
    `Engine: ${isGoogleTtsConfigured() ? "Google Cloud af-ZA (native)" : "OpenAI fallback (add GOOGLE_TTS_API_KEY for native Afrikaans)"}`
  );
  console.log(`Voice: ${NARRATION_VOICE} · ${PAGE_PAUSE_SECONDS}s pause between pages · ${STORY.pages.length} pages`);
  console.log("This may take a minute...\n");

  const slug = STORY.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const outPath = await buildAndSaveStoryNarration(`sample-morne-af-${slug}`, STORY.pages, {
    language: "afrikaans",
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
