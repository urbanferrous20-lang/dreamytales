/**
 * Build personalised sample PDFs for showcase characters.
 * Run: npm run sample:characters
 *
 * Uses OPENAI_API_KEY from .env.local for illustrations when available.
 * Without it, PDFs are still built with story text on the dark overlay layout.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { optimizeIllustration } from "../lib/image-optimize";
import {
  ILLUSTRATION_OPENAI_QUALITY,
  ILLUSTRATION_OPENAI_SIZE,
} from "../lib/ai/illustration-settings";
import { assembleStoryPdf } from "../lib/pdf-builder/layout";
import { getIllustrationContentPolicy } from "../lib/story-content-policy";
import type { ChildProfileInput } from "../lib/types/child";
import { formatSaLocation } from "../lib/sa-locations";

const ASSETS_DIR = path.join(process.cwd(), "assets");
const OUTPUT_DIR = path.join(process.cwd(), "storage", "stories");

type StoryPage = {
  pageNumber: number;
  text: string;
  sceneDescription: string;
  mood: string;
};

type CharacterSample = {
  slug: string;
  profile: ChildProfileInput;
  appearance: string;
  title: string;
  pages: StoryPage[];
};

const SAMPLES: CharacterSample[] = [
  {
    slug: "zukiswa",
    profile: {
      name: "Zukiswa",
      age: 3,
      pronouns: "she/her",
      interests: ["unicorns", "fairy tales", "animals"],
      favoriteColors: "Pink and purple",
      province: "Gauteng",
      cityOrTown: "Johannesburg",
      suburb: "Soweto",
      storyMood: "gentle",
      readAloudBy: "parent",
      language: "isi_xhosa",
      favoritePlace: "the small garden behind the house",
    },
    appearance:
      "Zukiswa, a joyful 3-year-old girl with neat braided hair, pink pyjamas with tiny stars, warm brown skin, bright curious eyes",
    title: "UZukiswa noMpohlo Mhle weSoweto",
    pages: [
      {
        pageNumber: 1,
        text: "Emva kwesikhathi sokulala, uZukiswa wayengaphandle kwesigcawu eSoweto. Izinkuni zaseGauteng zaziphola. Inkwenkwezi enye yayikhanya phezulu.",
        sceneDescription:
          "Small girl in pink star pyjamas in Soweto garden at dusk, warm township rooftops, single bright star, gentle purple sky",
        mood: "calm, wonder",
      },
      {
        pageNumber: 2,
        text: "uZukiswa wayeyithanda kakhulu iimpohlo. Wayezowadweba emgceni. \"Mna ndiyithanda le mpohlo,\" wathi.",
        sceneDescription:
          "Girl drawing a unicorn with chalk on garden path, colourful Soweto houses in soft background, pink and purple chalk",
        mood: "happy, playful",
      },
      {
        pageNumber: 3,
        text: "Ngobusuku, umoya wawuthambile. Kukhanya okucacileyo kwavela ehlathini. Kwakuyimpohlo encinane, emhlophe, enemibala emihle.",
        sceneDescription:
          "Tiny gentle unicorn with soft rainbow mane appearing among garden trees, girl watching in amazement, Soweto evening light",
        mood: "magical, gentle",
      },
      {
        pageNumber: 4,
        text: "\"Molo, Zukiswa,\" yathi impohlo ngelizwi elithambileyo. \"NdinguNoluntu. Ndizoza ukukubonisa ubuhle beSoweto ebusuku.\"",
        sceneDescription:
          "Friendly small unicorn facing girl in garden, warm golden glow, Soweto skyline with Orlando Towers far away",
        mood: "friendly, warm",
      },
      {
        pageNumber: 5,
        text: "uZukiswa wancuma. \"Ndifuna ukubona iinkwenkwezi zam.\" uNoluntu wagqiba intliziyo yakhe. \"Masihambe kancinci nje.\"",
        sceneDescription:
          "Girl holding unicorn's soft mane, stars beginning to appear, cosy Soweto yards and lit windows",
        mood: "hopeful, gentle",
      },
      {
        pageNumber: 6,
        text: "Badlula phezu kweendlela ezithambileyo. Abantu babebuthule. Imimoya yeSoweto yayithambile, njengengoma yokulala.",
        sceneDescription:
          "Girl and small unicorn walking softly through quiet Soweto street at night, warm window lights, stars above",
        mood: "peaceful, dreamy",
      },
      {
        pageNumber: 7,
        text: "uNoluntu wagquma ngokukhanya okubomvu nokuphuzi. \"Bonke abantwana baseSoweto banamaphupha amahle,\" yathi.",
        sceneDescription:
          "Unicorn glowing softly pink and purple, girl smiling, neighbourhood gardens with flowers, night sky",
        mood: "warm, encouraging",
      },
      {
        pageNumber: 8,
        text: "Badlula ecaleni kwengcambu enkulu. Imimoya yaseGauteng yayiphola. uZukiswa wayevale amehlo, emnandi.",
        sceneDescription:
          "Girl resting against large tree with unicorn beside her, Gauteng highveld stars, peaceful township night",
        mood: "restful, content",
      },
      {
        pageNumber: 9,
        text: "Impohlo yathi, \"Kufanele ukuba ubuthongo buze.\" Badlula emva ekhaya. uZukiswa wayesazi ukuba iphupha lalihle.",
        sceneDescription:
          "Unicorn fading into starlight near garden gate, girl waving softly, home doorway with warm light",
        mood: "bittersweet, calm",
      },
      {
        pageNumber: 10,
        text: "uZukiswa wangena ekhayeni wayolala. \"Ulale kamnandi, Zukiswa,\" kwathi intliziyo kaSoweto. \"Phupha ngempohlo yakho.\"",
        sceneDescription:
          "Girl asleep in bed with small unicorn toy on pillow, Soweto night through window, moon and stars",
        mood: "sleepy, peaceful close",
      },
    ],
  },
  {
    slug: "zoe",
    profile: {
      name: "Zoe",
      age: 2,
      pronouns: "she/her",
      interests: ["animals", "nature"],
      favoriteColors: "Yellow and white",
      favoriteToy: "knitting basket with soft yarn",
      petInfo: "a friendly brown dog called Bella",
      province: "Western Cape",
      cityOrTown: "Cape Town",
      storyMood: "gentle",
      readAloudBy: "parent",
      language: "afrikaans",
      favoritePlace: "the stoep where Bella sits",
    },
    appearance:
      "Zoe, a tiny 2-year-old girl with curly blonde hair, yellow pyjamas, rosy cheeks, holding soft knitting yarn",
    title: "Zoe, Bella en die Sagte Draadjie",
    pages: [
      {
        pageNumber: 1,
        text: "Na bad tyd sit Zoe op die stoep in Kaapstad. Bella, die hond, leen teen haar. Die see ruik soos sout en somer.",
        sceneDescription:
          "Toddler in yellow pyjamas on Cape Town stoep with friendly brown dog, Table Mountain silhouette at dusk",
        mood: "calm, cosy",
      },
      {
        pageNumber: 2,
        text: "Zoe hou van draadjie. Sy hou van Bella. \"Draad-jie,\" sê sy. Bella wag stil.",
        sceneDescription:
          "Little girl with small basket of colourful soft yarn, dog watching patiently, warm stoep light",
        mood: "gentle, playful",
      },
      {
        pageNumber: 3,
        text: "Die maan kom kyk. Een ster blink. Bella se stert swaai saggies. Saggies. Saggies.",
        sceneDescription:
          "Moon rising over Cape Town, toddler and dog on stoep, one bright star, soft ocean breeze",
        mood: "quiet, magical",
      },
      {
        pageNumber: 4,
        text: "Klein wolkie sê: \"Hallo, Zoe.\" Zoe glimlag. Bella blaf sag — woef — net een keer.",
        sceneDescription:
          "Friendly small cloud with gentle face near stoep, toddler smiling, dog sitting calmly",
        mood: "friendly, whimsical",
      },
      {
        pageNumber: 5,
        text: "Wolkie sê: \"Kom, ons maak 'n sagte kombers vir die nag.\" Zoe gee Bella die geel draadjie.",
        sceneDescription:
          "Soft cloud and girl sharing yarn with dog, golden thread glowing gently, Table Mountain night",
        mood: "warm, cooperative",
      },
      {
        pageNumber: 6,
        text: "Hulle draai die draadjie rond en rond. Dit word 'n warm kombers van lig. Bella krul naby.",
        sceneDescription:
          "Magical soft blanket of light being woven from yarn, toddler, dog curled close, Cape Town lights",
        mood: "cosy, dreamy",
      },
      {
        pageNumber: 7,
        text: "Die kombers dek die stoep. Die wind van die Atlantiese Oseaan is nou so sag soos 'n liedjie.",
        sceneDescription:
          "Glowing light blanket covering stoep, gentle ocean breeze, sleeping city, dog and girl under stars",
        mood: "peaceful",
      },
      {
        pageNumber: 8,
        text: "Zoe leun teen Bella. Haar oë word swaar. Die draadjie glim in die maan.",
        sceneDescription:
          "Toddler leaning on dog, eyes heavy, moonlit yarn basket, peaceful Cape Town night",
        mood: "sleepy, tender",
      },
      {
        pageNumber: 9,
        text: "Ma sê: \"Kom, liefie.\" Zoe staan op. Bella volg. Die kombers van lig bly op die stoep wag.",
        sceneDescription:
          "Mother's hand guiding toddler inside, loyal dog following, soft light blanket fading on stoep",
        mood: "gentle transition",
      },
      {
        pageNumber: 10,
        text: "In bed knuffel Zoe Bella se pluis. \"Lekker slaap, Zoe,\" fluister Kaapstad. \"Droom van draadjies en honde.\"",
        sceneDescription:
          "Toddler in bed hugging soft dog toy, yarn on bedside table, Table Mountain and moon through window",
        mood: "sleepy, peaceful close",
      },
    ],
  },
  {
    slug: "jake",
    profile: {
      name: "Jake",
      age: 10,
      pronouns: "he/him",
      interests: ["cars", "animals", "nature"],
      favoriteColors: "Green and silver",
      favoriteToy: "army toy soldiers in a shoebox",
      petInfo: "a loyal dog called Duke",
      province: "Eastern Cape",
      cityOrTown: "East London",
      storyMood: "adventurous",
      readAloudBy: "both",
      language: "english",
      favoritePlace: "the garage where he lines up his toy cars",
    },
    appearance:
      "Jake, a thoughtful 10-year-old boy with short dark hair, green pyjamas, warm brown skin, confident kind eyes",
    title: "Jake and the Harbour Lights Convoy",
    pages: [
      {
        pageNumber: 1,
        text: "Jake stood in the garage after homework, lining up his favourite toy cars in a perfect row. Duke, his dog, watched from the doorway. Outside, East London harbour lights blinked like slow, friendly signals across the Buffalo River.",
        sceneDescription:
          "Boy arranging toy cars on garage floor, loyal dog in doorway, East London harbour lights at dusk through open garage",
        mood: "calm, focused",
      },
      {
        pageNumber: 2,
        text: "Beside the cars sat Jake's shoebox of army men — brave little plastic soldiers who always kept watch. \"Tonight we go on a mission,\" Jake whispered. Duke's tail thumped once, as if he agreed.",
        sceneDescription:
          "Toy cars and army soldiers in shoebox on garage shelf, boy whispering to toys, dog watching, harbour glow",
        mood: "building adventure",
      },
      {
        pageNumber: 3,
        text: "A soft wind rolled in from the Indian Ocean. One car's headlight seemed to glow — just for a second. Jake blinked. Duke sat up straight. Something wonderful was about to happen.",
        sceneDescription:
          "One toy car headlight glowing magically, boy and dog alert, ocean breeze through garage, night deepening",
        mood: "magical, curious",
      },
      {
        pageNumber: 4,
        text: "\"I am Captain Beacon,\" said a tiny voice from the lead car. \"Every night, East London sends one convoy of dreams along the coast. Your cars, your soldiers, and Duke are invited.\"",
        sceneDescription:
          "Lead toy car with soft golden glow, tiny captain figure visible, boy kneeling in amazement, dog attentive",
        mood: "wondrous, friendly",
      },
      {
        pageNumber: 5,
        text: "Jake's army men climbed aboard the cars — not to fight, but to guide the way. Duke padded beside them as the convoy rolled slowly across the garage floor, then somehow through the open door and into the warm night air.",
        sceneDescription:
          "Toy soldiers riding on toy cars in gentle procession, real dog walking beside, East London street at night",
        mood: "gentle adventure",
      },
      {
        pageNumber: 6,
        text: "They followed the coast road past quiet beaches where waves folded over sand like blankets. Fishing boats rested in the harbour. The convoy's lights painted soft silver lines on the road — never fast, never loud.",
        sceneDescription:
          "Mini convoy of glowing toy cars along East London coastal road, dog walking, harbour and beach at night",
        mood: "peaceful adventure",
      },
      {
        pageNumber: 7,
        text: "Captain Beacon explained that each light was a promise: that explorers could be kind, that soldiers could protect without harm, and that a boy who loved cars and dogs already knew how to lead with a gentle heart.",
        sceneDescription:
          "Boy listening to glowing lead car, army men standing at attention on car roofs, Duke walking proudly, starlit coast",
        mood: "warm, meaningful",
      },
      {
        pageNumber: 8,
        text: "At the old lighthouse, the convoy stopped. Jake looked out at the whole city — the river, the ships, the hills. Duke nudged his hand. Jake felt brave and calm at the same time.",
        sceneDescription:
          "Boy, dog, and toy convoy at East London lighthouse viewpoint, city and harbour spread below, stars above",
        mood: "awe, quiet pride",
      },
      {
        pageNumber: 9,
        text: "One by one, the car lights dimmed. The army men saluted and returned to the shoebox in Jake's pocket. Duke yawned. The ocean whispered goodnight against the rocks below.",
        sceneDescription:
          "Toy cars dimming, soldiers returning to shoebox, boy and dog heading home, lighthouse beam sweeping softly",
        mood: "winding down",
      },
      {
        pageNumber: 10,
        text: "Jake climbed into bed with Duke at his feet. The shoebox sat on his desk, soldiers at rest. \"Goodnight, Jake,\" murmured the East London wind through his window. \"Dream of roads that go on forever — and always lead you home.\"",
        sceneDescription:
          "Boy in bed, dog at foot of bed, toy cars and soldier shoebox on desk, harbour lights through window, peaceful night",
        mood: "sleepy, peaceful close",
      },
    ],
  },
  {
    slug: "jake-fantasy",
    profile: {
      name: "Jake",
      age: 10,
      pronouns: "he/him",
      interests: ["cars", "animals", "nature"],
      favoriteColors: "Green and silver",
      favoriteToy: "army toy soldiers in a shoebox",
      petInfo: "a loyal dog called Duke",
      province: "Eastern Cape",
      cityOrTown: "East London",
      storyMood: "adventurous",
      readAloudBy: "both",
      language: "english",
      favoritePlace: "the garage where he lines up his toy cars",
    },
    appearance:
      "Jake, a thoughtful 10-year-old boy with short dark hair, green pyjamas, warm brown skin, confident kind eyes",
    title: "Jake and the Moonlit Bridge Over the Buffalo River",
    pages: [
      {
        pageNumber: 1,
        text: "Jake's garage was his kingdom after dark — rows of toy cars, a shoebox of army men, and Duke curled on an old mat. Through the open door, East London glittered: harbour cranes, river lights, and the Indian Ocean breathing softly beyond the breakwater.",
        sceneDescription:
          "Boy in green pyjamas in cluttered garage with toy cars and army men, loyal dog on mat, magical harbour and Buffalo River lights at night through open door",
        mood: "cosy, anticipatory",
      },
      {
        pageNumber: 2,
        text: "Tonight the silver car at the front of the row hummed — not loudly, like a secret. Its headlights spilled a pool of moonlight on the concrete. Duke lifted his head and woofed once, as if greeting an old friend.",
        sceneDescription:
          "Toy silver car glowing with soft moonlight on garage floor, boy kneeling in wonder, dog alert, enchanted light spilling toward river",
        mood: "magical spark",
      },
      {
        pageNumber: 3,
        text: "\"I am Maphelo,\" said the car, in a voice like distant bells. \"Beneath East London runs a hidden road only children who love wheels and loyal dogs can see. Will you ride the Moonlit Bridge tonight?\" Jake's army men stood tall in their shoebox, ready to explore.",
        sceneDescription:
          "Enchanted talking toy car with gentle face-like grille glow, boy amazed, toy soldiers standing ready in open shoebox, Duke sitting proudly",
        mood: "wondrous invitation",
      },
      {
        pageNumber: 4,
        text: "Jake whispered yes. Maphelo grew — still a car, still silver, but now large enough to hold Jake, Duke, and a squad of army men on the roof like cheerful pathfinders. The garage wall shimmered and became a curtain of stars leading down to the Buffalo River.",
        sceneDescription:
          "Magically enlarged silver car with boy, dog, and toy soldiers on roof, garage wall transforming into starry portal toward glowing river",
        mood: "gentle transformation",
      },
      {
        pageNumber: 5,
        text: "They rolled onto the Moonlit Bridge — a ribbon of light floating just above the water. Below, fishing boats slept. Above, a friendly river spirit shaped like a long silver eel made of moonbeams swam alongside, splashing quiet sparks.",
        sceneDescription:
          "Glowing bridge of light over Buffalo River at night, boy in magical car with dog and soldiers, moonbeam eel spirit swimming beside them, East London harbour below",
        mood: "awe, peaceful adventure",
      },
      {
        pageNumber: 6,
        text: "The army men pointed the way — not with weapons, but with tiny flags that glowed green and silver. Maphelo followed their signals past the old lighthouse, where the beam bent into a rainbow arch just for them. Duke's ears fluttered in the warm magical wind.",
        sceneDescription:
          "Toy soldiers with glowing green and silver flags directing car on light bridge, rainbow arch from lighthouse beam, dog with ears flying, starlit coast",
        mood: "wonder-filled journey",
      },
      {
        pageNumber: 7,
        text: "At the bridge's highest point, Jake saw two worlds at once: his real East London — streets, hills, ships — and a secret layer where cars could fly an inch above the sea and dogs could understand every language of the wind.",
        sceneDescription:
          "Boy looking out from magical car at dual view of East London city and secret glowing dream layer over ocean, soldiers and dog beside him, stars everywhere",
        mood: "rich wonder, quiet bravery",
      },
      {
        pageNumber: 8,
        text: "The moonbeam eel spoke without words: kindness is the fuel that keeps hidden roads open. Jake thought of Duke's loyalty, his soldiers' courage, and the careful way he polished every car. Maphelo purred like a content cat.",
        sceneDescription:
          "Gentle moonbeam eel spirit circling magical car, boy smiling thoughtfully, toy soldiers saluting peacefully, dog nuzzling boy's hand, harbour lights below",
        mood: "warm, meaningful",
      },
      {
        pageNumber: 9,
        text: "The bridge folded itself home, soft as a tide going out. Maphelo shrank back to toy size. The army men yawned and climbed into their shoebox. Duke led Jake up the garden path while the last stars dripped from the garage roof like silver rain.",
        sceneDescription:
          "Magical bridge fading over river, car shrinking to toy size, soldiers returning to shoebox, boy and dog walking up garden path, silver starlight dripping from garage",
        mood: "winding down, dreamy",
      },
      {
        pageNumber: 10,
        text: "Jake tucked Maphelo beside the other cars and set Duke on his blanket. The shoebox of soldiers rested on his desk like treasure from a kind adventure. \"Goodnight, Jake,\" whispered the Buffalo River through his window. \"The hidden road will wait for you — whenever wonder calls again.\"",
        sceneDescription:
          "Boy in bed almost asleep, dog at foot of bed, glowing toy silver car on desk with soldier shoebox, East London harbour moon through window, peaceful close",
        mood: "sleepy, peaceful close",
      },
    ],
  },
];

function buildIllustrationPrompt(sample: CharacterSample, page: StoryPage): string {
  const location = formatSaLocation(
    sample.profile.province,
    sample.profile.cityOrTown,
    sample.profile.suburb
  );
  return [
    "Children's bedtime short storybook illustration.",
    getIllustrationContentPolicy(),
    "Soft flat digital art, muted warm palette, calming bedtime mood.",
    "No text, no words, no letters in the image.",
    `South African setting: ${location}`,
    `Main character: ${sample.appearance}`,
    `Scene: ${page.sceneDescription}`,
    `Mood: ${page.mood}`,
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

async function ensureImages(
  sample: CharacterSample,
  openai: OpenAI | null
): Promise<Map<number, Buffer>> {
  const images = new Map<number, Buffer>();
  const assetDir = path.join(ASSETS_DIR, sample.slug);
  await fs.mkdir(assetDir, { recursive: true });

  for (const page of sample.pages) {
    const assetPath = path.join(assetDir, `page-${page.pageNumber}.jpg`);

    try {
      const cached = await fs.readFile(assetPath);
      images.set(page.pageNumber, cached);
      continue;
    } catch {
      // try legacy PNG cache
      try {
        const legacyPath = path.join(assetDir, `page-${page.pageNumber}.png`);
        const cached = await fs.readFile(legacyPath);
        images.set(page.pageNumber, cached);
        continue;
      } catch {
        // generate below
      }
    }

    if (!openai) continue;

    console.log(`  Illustration ${sample.slug} page ${page.pageNumber}/10...`);
    const buffer = await generateIllustration(openai, buildIllustrationPrompt(sample, page));
    await fs.writeFile(assetPath, buffer);
    images.set(page.pageNumber, buffer);
  }

  return images;
}

async function buildSamplePdf(sample: CharacterSample, images: Map<number, Buffer>): Promise<string> {
  const pdfBytes = await assembleStoryPdf({
    title: sample.title,
    childName: sample.profile.name,
    pages: sample.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
    })),
    loadImage: async (pageNumber) => images.get(pageNumber),
  });

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outPath = path.join(OUTPUT_DIR, `sample-${sample.slug}-${Date.now()}.pdf`);
  await fs.writeFile(outPath, pdfBytes);
  return outPath;
}

async function main() {
  const onlySlug = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1]
    ?? (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : undefined);

  const samples = onlySlug
    ? SAMPLES.filter((s) => s.slug === onlySlug)
    : SAMPLES;

  if (onlySlug && samples.length === 0) {
    console.error(`Unknown sample slug: ${onlySlug}`);
    console.error("Available:", SAMPLES.map((s) => s.slug).join(", "));
    process.exit(1);
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
  const usePlaceholders = !openai;

  if (usePlaceholders) {
    console.log("OPENAI_API_KEY not set — building text-only PDFs (add key for AI illustrations).\n");
  } else {
    console.log("Generating illustrations where needed (cached in assets/<slug>/).\n");
  }

  const results: string[] = [];

  for (const sample of samples) {
    console.log(`Building ${sample.profile.name} — ${sample.title}...`);
    const images = await ensureImages(sample, openai);
    const pdfPath = await buildSamplePdf(sample, images);
    results.push(pdfPath);
    console.log(`  → ${path.resolve(pdfPath)}`);
    if (images.size === 0) {
      console.log("  (no illustrations — text-only layout)\n");
    } else if (images.size < 10) {
      console.log(`  (${images.size}/10 pages illustrated)\n`);
    } else {
      console.log("  (10/10 pages illustrated)\n");
    }
  }

  console.log("Done! Sample PDFs:");
  for (const p of results) {
    console.log(" ", path.resolve(p));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
