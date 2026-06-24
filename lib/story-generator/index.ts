import "server-only";
import { deepseekJson } from "@/lib/ai/deepseek";
import { buildIllustrationPrompt, generateIllustration } from "@/lib/ai/openai";
import { saveImage } from "@/lib/pdf-builder";
import {
  childProfileToPromptContext,
  getWordBudget,
  getResolvedCity,
  type ChildProfileInput,
} from "@/lib/types/child";
import { formatSaLocation } from "@/lib/sa-locations";
import { buildStorySystemPrompt, type SALanguageId } from "@/lib/sa-languages";
import { formatTopicsToAvoid, getIllustrationContentPolicy, getStoryFantasyPolicy } from "@/lib/story-content-policy";

export type CharacterBible = {
  protagonist: string;
  appearance: string;
  personality: string;
  world: string;
  recurringElements: string[];
  illustrationStyle: string;
};

export type GeneratedStory = {
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

export async function generateCharacterBible(child: ChildProfileInput): Promise<CharacterBible> {
  const systemPrompt = buildStorySystemPrompt(child.language as SALanguageId, child.age);
  const avoidLine = formatTopicsToAvoid(child.topicsToAvoid);
  return deepseekJson<CharacterBible>([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Create a compact character bible JSON for bedtime short stories.
Fields: protagonist, appearance, personality, world, recurringElements (array), illustrationStyle.
Keep each field under 40 words. Describe the child respectfully and inclusively — no stereotypes.
The "world" and "recurringElements" must blend their South African home with gentle fantasy (magical friends, enchanted places, whimsical objects tied to their interests).

Child profile:
${childProfileToPromptContext(child)}${avoidLine ? `\n${avoidLine}` : ""}`,
    },
  ]);
}

export async function generateNightlyStory(params: {
  child: ChildProfileInput;
  characterBible: CharacterBible;
  storyNumber: number;
  recentSummaries: string[];
}): Promise<GeneratedStory> {
  const budget = getWordBudget(params.child.age);
  const systemPrompt = buildStorySystemPrompt(params.child.language as SALanguageId, params.child.age);
  const avoidLine = formatTopicsToAvoid(params.child.topicsToAvoid);

  return deepseekJson<GeneratedStory>([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Write story #${params.storyNumber} as JSON with fields: title, teaser (2 sentences for email), summary (1 line for dedup), pages (array of 10 items with pageNumber, text, sceneDescription, mood).

Word budget: ${budget.min}-${budget.max} total words (child is ${params.child.age} years old).
Character bible: ${JSON.stringify(params.characterBible)}
Child: ${childProfileToPromptContext(params.child)}
Recent stories to avoid repeating: ${params.recentSummaries.join("; ") || "none yet"}
${avoidLine ? `${avoidLine}\n` : ""}
${getStoryFantasyPolicy(params.child.age)}
Story arc: hook with a spark of magic, want, gentle problem, two attempts with fantasy helpers or enchanted twists, small wonder-filled climax, calm resolution, sleepy close.
Each page's sceneDescription should show the fantasy element visually for illustration.
Re-check every page against the content, safety, and fantasy rules before responding.`,
    },
  ]);
}

export async function generatePageIllustrations(
  childId: string,
  child: ChildProfileInput,
  characterBible: CharacterBible,
  pages: GeneratedStory["pages"]
): Promise<Map<number, string>> {
  const imagePaths = new Map<number, string>();
  const childDescription = `${child.name}, age ${child.age}, ${characterBible.appearance}`;
  const locationHint = formatSaLocation(child.province, getResolvedCity(child), child.suburb);

  for (const page of pages) {
    const prompt = buildIllustrationPrompt({
      description: page.sceneDescription,
      mood: page.mood,
      childDescription,
      locationHint,
    });

    const buffer = await generateIllustration(prompt);
    const imagePath = await saveImage(childId, `page-${page.pageNumber}.png`, buffer);
    imagePaths.set(page.pageNumber, imagePath);
  }

  return imagePaths;
}

export function parseChildFromDb(record: {
  name: string;
  age: number;
  pronouns: string;
  interests: string;
  favoriteColors: string;
  favoriteToy: string | null;
  petInfo: string | null;
  siblingNames: string | null;
  bestFriend: string | null;
  favoritePlace: string | null;
  province: string;
  cityOrTown: string;
  customCity: string | null;
  suburb: string | null;
  topicsToAvoid: string | null;
  storyMood: string;
  moralTheme: string | null;
  readAloudBy: string;
  language: string;
}): ChildProfileInput {
  return {
    name: record.name,
    age: record.age,
    pronouns: record.pronouns as ChildProfileInput["pronouns"],
    interests: JSON.parse(record.interests) as string[],
    favoriteColors: record.favoriteColors,
    favoriteToy: record.favoriteToy ?? undefined,
    petInfo: record.petInfo ?? undefined,
    siblingNames: record.siblingNames ?? undefined,
    bestFriend: record.bestFriend ?? undefined,
    favoritePlace: record.favoritePlace ?? undefined,
    province: record.province as ChildProfileInput["province"],
    cityOrTown: record.cityOrTown,
    customCity: record.customCity ?? undefined,
    suburb: record.suburb ?? undefined,
    topicsToAvoid: record.topicsToAvoid ?? undefined,
    storyMood: record.storyMood as ChildProfileInput["storyMood"],
    moralTheme: record.moralTheme ?? undefined,
    readAloudBy: record.readAloudBy as ChildProfileInput["readAloudBy"],
    language: record.language as ChildProfileInput["language"],
  };
}
