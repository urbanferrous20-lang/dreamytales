/**
 * Generate a real Paul sample story using production prompts + APIs → PDF → email.
 * Run: npm run sample:paul
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import fs from "fs/promises";
import path from "path";
import OpenAI, { toFile } from "openai";
import { assembleStoryPdf } from "../lib/pdf-builder/layout";
import { optimizeIllustration } from "../lib/image-optimize";
import {
  ILLUSTRATION_OPENAI_QUALITY,
  ILLUSTRATION_OPENAI_SIZE,
} from "../lib/ai/illustration-settings";
import {
  buildCharacterAnchorPrompt,
  buildSceneIllustrationPrompt,
  CHARACTER_ANCHOR_FILENAME,
  formatIllustrationCharacterBlock,
} from "../lib/illustration-character";
import { sceneIncludesSignupPet } from "../lib/pet-illustration";
import { formatArchetypePrompt, pickStoryArchetype } from "../lib/story-archetypes";
import { formatInspirationPrompt, pickStoryInspiration } from "../lib/story-inspiration";
import { formatStorySettingPrompt, pickStorySetting } from "../lib/story-settings";
import {
  formatProfileGarnishPrompt,
  formatRecentStoryAvoidance,
  pickOptionalProfileGarnish,
  STORY_GENERATION_TEMPERATURE,
} from "../lib/story-variation";
import { formatTopicsToAvoid, getStoryFantasyPolicy } from "../lib/story-content-policy";
import {
  childProfileCoreContext,
  childProfileToPromptContext,
  getWordBudget,
  getResolvedCity,
  type ChildProfileInput,
} from "../lib/types/child";
import { defaultBirthDateForAge } from "../lib/child-age";
import { buildStorySystemPrompt, resolveStoryLanguage } from "../lib/sa-languages";
import { formatSaLocation } from "../lib/sa-locations";
import { isSmtpConfigured, sendPdfEmail } from "../lib/smtp";
import { SITE_URL } from "../lib/site";

const CHILD_ID = "sample-paul";
const PARENT_NAME = "Morne";
const RECIPIENT = process.env.SAMPLE_EMAIL?.trim() || "urbanferrous20@gmail.com";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CharacterBible = {
  protagonist: string;
  appearance: string;
  personality: string;
  world: string;
  recurringElements: string[];
  illustrationStyle: string;
};

type GeneratedStory = {
  title: string;
  teaser: string;
  summary: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    sceneDescription: string;
    mood: string;
  }>;
};

const paulProfile: ChildProfileInput = {
  name: "Paul",
  birthDate: defaultBirthDateForAge(12),
  age: 12,
  pronouns: "he/him",
  interests: ["soccer", "pirates", "dinosaurs"],
  favoriteColors: "Blue",
  favoriteToy: "Soccer ball",
  province: "Gauteng",
  cityOrTown: "Johannesburg",
  storyMood: "gentle",
  readAloudBy: "parent",
  language: "english",
};

async function storyJson<T>(messages: ChatMessage[], temperature: number): Promise<T> {
  const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (deepseekKey) {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) {
      throw new Error(`DeepSeek failed: ${response.status} ${await response.text()}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek returned empty content");
    return JSON.parse(content) as T;
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) {
    throw new Error("Set DEEPSEEK_API_KEY or OPENAI_API_KEY in .env.local");
  }

  console.log("(DEEPSEEK_API_KEY not set — using OpenAI for story text)");
  const openai = new OpenAI({ apiKey: openaiKey });
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature,
    response_format: { type: "json_object" },
  });
  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content) as T;
}

async function saveImage(childId: string, filename: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "storage", "images", childId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: key });
}

async function generateIllustration(prompt: string): Promise<Buffer> {
  const openai = getOpenAI();
  const response = await openai.images.generate({
    model: "gpt-image-1-mini",
    prompt,
    size: ILLUSTRATION_OPENAI_SIZE,
    quality: ILLUSTRATION_OPENAI_QUALITY,
    n: 1,
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation failed");
  return optimizeIllustration(Buffer.from(b64, "base64"));
}

async function generateIllustrationFromReference(
  prompt: string,
  referenceImages: Buffer | Buffer[]
): Promise<Buffer> {
  const openai = getOpenAI();
  const images = Array.isArray(referenceImages) ? referenceImages : [referenceImages];
  const imageFiles = await Promise.all(
    images.map((buffer, index) =>
      toFile(buffer, index === 0 ? CHARACTER_ANCHOR_FILENAME : "pet-anchor.jpg", {
        type: "image/jpeg",
      })
    )
  );

  try {
    const response = await openai.images.edit({
      model: "gpt-image-1-mini",
      image: imageFiles.length === 1 ? imageFiles[0]! : imageFiles,
      prompt,
      size: ILLUSTRATION_OPENAI_SIZE,
      quality: ILLUSTRATION_OPENAI_QUALITY,
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image edit returned no data");
    return optimizeIllustration(Buffer.from(b64, "base64"));
  } catch (error) {
    console.warn(
      "Reference edit failed, falling back to text-only:",
      error instanceof Error ? error.message : error
    );
    return generateIllustration(prompt);
  }
}

function normalizeCharacterBible(raw: Record<string, unknown>): CharacterBible {
  const asString = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object") return JSON.stringify(value);
    return String(value ?? "");
  };

  const protagonist = raw.protagonist;
  const protagonistStr =
    typeof protagonist === "object" && protagonist && "name" in protagonist
      ? `${(protagonist as { name?: string }).name ?? "Child"}, ${asString((protagonist as { age?: number }).age ? `age ${(protagonist as { age?: number }).age}` : "")}`.trim()
      : asString(protagonist);

  const recurring = raw.recurringElements;
  const recurringElements = Array.isArray(recurring)
    ? recurring.map((item) => asString(item)).filter(Boolean)
    : asString(recurring)
        .split(/[,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    protagonist: protagonistStr,
    appearance: asString(raw.appearance),
    personality: asString(raw.personality),
    world: asString(raw.world),
    recurringElements,
    illustrationStyle: asString(raw.illustrationStyle),
  };
}

async function generateCharacterBible(child: ChildProfileInput): Promise<CharacterBible> {
  const languageId = resolveStoryLanguage(child.language);
  const systemPrompt = buildStorySystemPrompt(languageId, child.age);
  const avoidLine = formatTopicsToAvoid(child.topicsToAvoid);
  const raw = await storyJson<Record<string, unknown>>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create a compact character bible JSON for bedtime short stories.
Fields: protagonist, appearance, personality, world, recurringElements (array), illustrationStyle.
Keep each field under 40 words. Describe the child respectfully and inclusively — no stereotypes.
For "appearance": write a STABLE visual design for illustrators — specific hair (colour, length, style), skin tone, face shape, eye colour, and default bedtime outfit using their favourite colours where natural. This exact look must stay the same on every illustrated page.
For "illustrationStyle": one line of art direction (e.g. soft flat digital art, muted blues and golds, bedtime calm).
The "world" blends their South African home with gentle fantasy — include both familiar local places AND magical adventure settings (forests, coast, mountains) they may visit on different nights.

Child profile:
${childProfileToPromptContext(child)}${avoidLine ? `\n${avoidLine}` : ""}`,
      },
    ],
    0.6
  );
  return normalizeCharacterBible(raw);
}

async function generateNightlyStory(params: {
  child: ChildProfileInput;
  characterBible: CharacterBible;
  storyNumber: number;
}): Promise<{
  story: GeneratedStory;
  setting: ReturnType<typeof pickStorySetting>;
  archetype: ReturnType<typeof pickStoryArchetype>;
  inspiration: ReturnType<typeof pickStoryInspiration>;
}> {
  const setting = pickStorySetting({
    child: params.child,
    storyNumber: params.storyNumber,
    recentSettingKeys: [],
  });
  const archetype = pickStoryArchetype({ recentArchetypeKeys: [] });
  const inspiration = pickStoryInspiration({
    storyNumber: params.storyNumber,
    recentInspirationKeys: [],
  });
  const garnish = pickOptionalProfileGarnish(params.child, params.storyNumber);

  const languageId = resolveStoryLanguage(params.child.language);
  const budget = getWordBudget(params.child.age);
  const systemPrompt = buildStorySystemPrompt(languageId, params.child.age);
  const avoidLine = formatTopicsToAvoid(params.child.topicsToAvoid);

  const story = await storyJson<GeneratedStory>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Write story #${params.storyNumber} as JSON with fields: title, teaser (2 sentences for email), summary (1 line for dedup — mention setting and story type), pages (array of 10 items with pageNumber, text, sceneDescription, mood).

Word budget: ${budget.min}-${budget.max} total words (child is ${params.child.age} years old).
Character bible: ${JSON.stringify(params.characterBible)}
Child (identity & home — use every night): ${childProfileCoreContext(params.child)}
${formatStorySettingPrompt(setting, params.child)}
${formatArchetypePrompt(archetype)}
${formatInspirationPrompt(inspiration)}
${formatProfileGarnishPrompt(garnish)}
${formatRecentStoryAvoidance([])}
${avoidLine ? `${avoidLine}\n` : ""}
${getStoryFantasyPolicy(params.child.age)}
STRUCTURE RULES:
- Follow tonight's story TYPE arc above — it overrides any generic template.
- Vary the opening (do not always start with magic appearing in the bedroom).
- Page 10: sleepy goodnight at home with the child's name.
Each page's sceneDescription should match the scene and show fantasy visually for illustration.
Re-check every page against the content, safety, and fantasy rules before responding.`,
      },
    ],
    STORY_GENERATION_TEMPERATURE
  );

  return { story, setting, archetype, inspiration };
}

async function generatePageIllustrations(
  child: ChildProfileInput,
  characterBible: CharacterBible,
  pages: GeneratedStory["pages"],
  setting: ReturnType<typeof pickStorySetting>
): Promise<Map<number, string>> {
  const imagePaths = new Map<number, string>();

  console.log("  Creating character anchor...");
  const anchorPrompt = buildCharacterAnchorPrompt(child, characterBible);
  const anchorBuffer = await generateIllustration(anchorPrompt);
  await saveImage(CHILD_ID, CHARACTER_ANCHOR_FILENAME, anchorBuffer);

  const characterBlock = formatIllustrationCharacterBlock(child, characterBible);
  const homeHint = formatSaLocation(child.province, getResolvedCity(child), child.suburb);
  const locationHint = `${setting.label}: ${setting.prompt.slice(0, 120)}. Home: ${homeHint}`;

  for (const page of pages) {
    console.log(`  Illustrating page ${page.pageNumber}/10...`);
    const petInScene = sceneIncludesSignupPet({
      sceneDescription: page.sceneDescription,
      pageText: page.text,
      petInfo: child.petInfo,
    });

    const prompt = buildSceneIllustrationPrompt({
      childName: child.name,
      description: page.sceneDescription,
      mood: page.mood,
      characterBlock,
      illustrationStyle: characterBible.illustrationStyle,
      locationHint,
      petInfo: child.petInfo,
      petInScene,
    });

    const buffer = await generateIllustrationFromReference(prompt, anchorBuffer);
    const imagePath = await saveImage(CHILD_ID, `page-${page.pageNumber}.jpg`, buffer);
    imagePaths.set(page.pageNumber, imagePath);
  }

  return imagePaths;
}

async function buildStoryPdf(params: {
  title: string;
  childName: string;
  pages: Array<{ pageNumber: number; text: string; imagePath?: string }>;
}): Promise<string> {
  const pdfBytes = await assembleStoryPdf({
    title: params.title,
    childName: params.childName,
    pages: params.pages,
    loadImage: async (pageNumber) => {
      const page = params.pages.find((p) => p.pageNumber === pageNumber);
      if (!page?.imagePath) return undefined;
      try {
        return await fs.readFile(page.imagePath);
      } catch {
        return undefined;
      }
    },
  });

  const dir = path.join(process.cwd(), "storage", "stories");
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${CHILD_ID}-${Date.now()}.pdf`);
  await fs.writeFile(filePath, pdfBytes);
  return filePath;
}

async function main() {
  console.log("Paul sample — production story pipeline\n");
  console.log("Profile:", paulProfile.name, `age ${paulProfile.age}`, paulProfile.interests.join(", "));

  console.log("\n1/4 Character bible (DeepSeek/OpenAI)...");
  const characterBible = await generateCharacterBible(paulProfile);
  console.log("   Appearance:", characterBible.appearance.slice(0, 100) + "...");

  console.log("\n2/4 Nightly story #1 (new variation system)...");
  const { story, setting, archetype, inspiration } = await generateNightlyStory({
    child: paulProfile,
    characterBible,
    storyNumber: 1,
  });
  console.log(`   Title: ${story.title}`);
  console.log(`   Setting: ${setting.label} | Archetype: ${archetype.label} | Inspiration: ${inspiration.tradition}`);
  console.log(`   Garnish tonight: ${pickOptionalProfileGarnish(paulProfile, 1) ? "yes" : "none (plot from archetype + setting + inspiration)"}`);

  const skipArt = process.argv.includes("--skip-art");
  let imagePaths = new Map<number, string>();

  if (skipArt) {
    console.log("\n3/4 Skipping illustrations (--skip-art)");
  } else {
    console.log("\n3/4 Illustrations (OpenAI gpt-image-1-mini)...");
    imagePaths = await generatePageIllustrations(paulProfile, characterBible, story.pages, setting);
  }

  console.log("\n4/4 Building PDF...");
  const pdfPath = await buildStoryPdf({
    title: story.title,
    childName: paulProfile.name,
    pages: story.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      imagePath: imagePaths.get(p.pageNumber),
    })),
  });

  console.log("\nPDF saved:", path.resolve(pdfPath));

  const manageUrl = `${SITE_URL}/dashboard`;
  const filename = `${story.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;

  if (!isSmtpConfigured()) {
    console.log("\nSMTP not configured — PDF ready locally (not emailed).");
    console.log("Teaser:", story.teaser);
    return;
  }

  console.log(`\nSending parent email to ${RECIPIENT}...`);
  await sendPdfEmail({
    to: RECIPIENT,
    subject: `Tonight's story for Paul: ${story.title}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
        <p>Hi ${PARENT_NAME},</p>
        <p>${story.teaser}</p>
        <p>Your illustrated bedtime short story for <strong>Paul</strong> is attached as a PDF — perfect for tonight's read-aloud at 6pm.</p>
        <p style="color: #64748b; font-size: 14px;">
          <a href="${manageUrl}">Manage your subscription</a>
        </p>
        <p style="color: #64748b; font-size: 14px;">Sweet dreams from Dreamy Tales.</p>
      </div>
    `,
    pdfPath,
    filename,
  });
  console.log("Email sent!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
