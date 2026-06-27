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
import { formatStorySettingPrompt, pickStorySetting, type StorySetting } from "@/lib/story-settings";
import {
  birthDateFromRecord,
  estimateBirthDateFromAge,
  formatBirthDateIso,
  getEffectiveAge,
} from "@/lib/child-age";

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
The "world" blends their South African home with gentle fantasy — include both familiar local places AND magical adventure settings (forests, coast, mountains) they may visit on different nights.

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
  recentSettingKeys: string[];
  setting?: StorySetting;
}): Promise<{ story: GeneratedStory; setting: StorySetting }> {
  const setting =
    params.setting ??
    pickStorySetting({
      child: params.child,
      storyNumber: params.storyNumber,
      recentSettingKeys: params.recentSettingKeys,
    });

  const budget = getWordBudget(params.child.age);
  const systemPrompt = buildStorySystemPrompt(params.child.language as SALanguageId, params.child.age);
  const avoidLine = formatTopicsToAvoid(params.child.topicsToAvoid);
  const settingPrompt = formatStorySettingPrompt(setting, params.child);

  const story = await deepseekJson<GeneratedStory>([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Write story #${params.storyNumber} as JSON with fields: title, teaser (2 sentences for email), summary (1 line for dedup — mention the setting type), pages (array of 10 items with pageNumber, text, sceneDescription, mood).

Word budget: ${budget.min}-${budget.max} total words (child is ${params.child.age} years old).
Character bible: ${JSON.stringify(params.characterBible)}
Child: ${childProfileToPromptContext(params.child)}
${settingPrompt}
Recent stories to avoid repeating: ${params.recentSummaries.join("; ") || "none yet"}
${avoidLine ? `${avoidLine}\n` : ""}
${getStoryFantasyPolicy(params.child.age)}
Story arc: hook with a spark of magic, want, gentle problem, two attempts with fantasy helpers or enchanted twists, small wonder-filled climax, calm resolution, sleepy close at home.
Each page's sceneDescription should show the fantasy element visually for illustration.
Re-check every page against the content, safety, and fantasy rules before responding.`,
    },
  ]);

  return { story, setting };
}

export async function generatePageIllustrations(
  childId: string,
  child: ChildProfileInput,
  characterBible: CharacterBible,
  pages: GeneratedStory["pages"],
  setting: StorySetting
): Promise<Map<number, string>> {
  const imagePaths = new Map<number, string>();
  const childDescription = `${child.name}, age ${child.age}, ${characterBible.appearance}`;
  const homeHint = formatSaLocation(child.province, getResolvedCity(child), child.suburb);
  const locationHint = `${setting.label}: ${setting.prompt.slice(0, 120)}. Home: ${homeHint}`;

  for (const page of pages) {
    const prompt = buildIllustrationPrompt({
      description: page.sceneDescription,
      mood: page.mood,
      childDescription,
      locationHint,
    });

    const buffer = await generateIllustration(prompt);
    const imagePath = await saveImage(childId, `page-${page.pageNumber}.jpg`, buffer);
    imagePaths.set(page.pageNumber, imagePath);
  }

  return imagePaths;
}

export function parseChildFromDb(record: {
  name: string;
  age: number;
  birthDate?: Date | null;
  createdAt?: Date;
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
  const birthDateIso =
    birthDateFromRecord({
      birthDate: record.birthDate,
      age: record.age,
      createdAt: record.createdAt,
    }) ?? formatBirthDateIso(estimateBirthDateFromAge(record.age, record.createdAt ?? new Date()));

  const effectiveAge = getEffectiveAge({
    birthDate: birthDateIso,
    storedAge: record.age,
    profileCreatedAt: record.createdAt,
  });

  return {
    name: record.name,
    birthDate: birthDateIso,
    age: effectiveAge,
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
