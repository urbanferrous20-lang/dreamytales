import "server-only";
import { deepseekJson } from "@/lib/ai/deepseek";
import {
  generateIllustrationFromReference,
  ensureCharacterAnchor,
} from "@/lib/ai/openai";
import {
  buildSceneIllustrationPrompt,
  formatIllustrationCharacterBlock,
} from "@/lib/illustration-character";
import { saveImage } from "@/lib/pdf-builder";
import {
  childProfileToPromptContext,
  getWordBudget,
  getResolvedCity,
  type ChildProfileInput,
} from "@/lib/types/child";
import { formatSaLocation } from "@/lib/sa-locations";
import { buildStorySystemPrompt, resolveStoryLanguage } from "@/lib/sa-languages";
import { formatTopicsToAvoid, getIllustrationContentPolicy, getStoryFantasyPolicy } from "@/lib/story-content-policy";
import { formatStorySettingPrompt, getBirthdayStorySetting, pickStorySetting, type StorySetting } from "@/lib/story-settings";
import { formatArchetypePrompt, pickStoryArchetype, type StoryArchetype } from "@/lib/story-archetypes";
import {
  formatRecentStoryAvoidance,
  pickFocusInterest,
  STORY_GENERATION_TEMPERATURE,
  type RecentStoryHint,
} from "@/lib/story-variation";
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
  const languageId = resolveStoryLanguage(child.language);
  const systemPrompt = buildStorySystemPrompt(languageId, child.age);
  const avoidLine = formatTopicsToAvoid(child.topicsToAvoid);
  return deepseekJson<CharacterBible>([
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
  ]);
}

export async function generateNightlyStory(params: {
  child: ChildProfileInput;
  characterBible: CharacterBible;
  storyNumber: number;
  recentStories: RecentStoryHint[];
  recentSettingKeys: string[];
  setting?: StorySetting;
}): Promise<{ story: GeneratedStory; setting: StorySetting; archetype: StoryArchetype }> {
  const setting =
    params.setting ??
    pickStorySetting({
      child: params.child,
      storyNumber: params.storyNumber,
      recentSettingKeys: params.recentSettingKeys,
    });

  const archetype = pickStoryArchetype({
    recentArchetypeKeys: params.recentStories
      .map((s) => s.archetypeKey)
      .filter((key): key is string => Boolean(key)),
  });
  const focusInterest = pickFocusInterest(params.child.interests, params.storyNumber);

  const languageId = resolveStoryLanguage(params.child.language);
  const budget = getWordBudget(params.child.age);
  const systemPrompt = buildStorySystemPrompt(languageId, params.child.age);
  const avoidLine = formatTopicsToAvoid(params.child.topicsToAvoid);
  const settingPrompt = formatStorySettingPrompt(setting, params.child);
  const archetypePrompt = formatArchetypePrompt(archetype);
  const recentAvoidance = formatRecentStoryAvoidance(params.recentStories);

  const story = await deepseekJson<GeneratedStory>(
    [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Write story #${params.storyNumber} as JSON with fields: title, teaser (2 sentences for email), summary (1 line for dedup — mention setting and story type), pages (array of 10 items with pageNumber, text, sceneDescription, mood).

Word budget: ${budget.min}-${budget.max} total words (child is ${params.child.age} years old).
Character bible: ${JSON.stringify(params.characterBible)}
Child: ${childProfileToPromptContext(params.child)}
${settingPrompt}
${archetypePrompt}
TONIGHT'S SPOTLIGHT INTEREST: "${focusInterest}" — make this interest the heart of tonight's plot. Other interests may appear lightly or not at all.
Story mood preference from parent: ${params.child.storyMood}${params.child.moralTheme ? `. Optional moral theme: ${params.child.moralTheme}` : ""}.
${recentAvoidance}
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
    { temperature: STORY_GENERATION_TEMPERATURE }
  );

  return { story, setting, archetype };
}

export async function generateBirthdayStory(params: {
  child: ChildProfileInput;
  characterBible: CharacterBible;
  storyNumber: number;
  turningAge: number;
}): Promise<{ story: GeneratedStory; setting: StorySetting }> {
  const setting = getBirthdayStorySetting(params.child, params.turningAge);
  const languageId = resolveStoryLanguage(params.child.language);
  const budget = getWordBudget(params.turningAge);
  const systemPrompt = buildStorySystemPrompt(languageId, params.turningAge);
  const avoidLine = formatTopicsToAvoid(params.child.topicsToAvoid);
  const settingPrompt = formatStorySettingPrompt(setting, params.child);

  const story = await deepseekJson<GeneratedStory>([
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Write a SPECIAL BIRTHDAY story (#${params.storyNumber} in the series) as JSON with fields: title, teaser (2 sentences for email — mention it is their birthday tonight), summary (1 line — note "birthday story"), pages (array of 10 items with pageNumber, text, sceneDescription, mood).

This is ${params.child.name}'s birthday — they are turning ${params.turningAge} today.
Word budget: ${budget.min}-${budget.max} total words.
Character bible: ${JSON.stringify(params.characterBible)}
Child: ${childProfileToPromptContext(params.child)}
${settingPrompt}
${avoidLine ? `${avoidLine}\n` : ""}
${getStoryFantasyPolicy(params.turningAge)}
BIRTHDAY STORY RULES:
- The title and opening should feel celebratory and personal — this happens once a year.
- Include the turning age naturally (e.g. "six candles" or "turning six") without making it the only focus.
- Weave in their interests, favourite colours, toy, pet, best friend, or siblings if listed in the profile.
- Middle pages: gentle magical birthday wonder (glowing candles, star wishes, enchanted cake, friendly magical guests).
- Final pages: wind down — yawns, soft goodnights, sleepy gratitude — same calm bedtime tone as every other night.
- Do NOT repeat a standard adventure plot; this must read clearly as a birthday story.
Each page's sceneDescription should show birthday magic visually for illustration.
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
  setting: StorySetting,
  styleAnchorPath?: string | null
): Promise<{ imagePaths: Map<number, string>; styleAnchorPath?: string }> {
  const imagePaths = new Map<number, string>();
  const anchor = await ensureCharacterAnchor({
    childId,
    child,
    characterBible,
    existingAnchorPath: styleAnchorPath,
  });
  const characterBlock = formatIllustrationCharacterBlock(child, characterBible);
  const homeHint = formatSaLocation(child.province, getResolvedCity(child), child.suburb);
  const locationHint = `${setting.label}: ${setting.prompt.slice(0, 120)}. Home: ${homeHint}`;

  for (const page of pages) {
    const prompt = buildSceneIllustrationPrompt({
      childName: child.name,
      description: page.sceneDescription,
      mood: page.mood,
      characterBlock,
      illustrationStyle: characterBible.illustrationStyle,
      locationHint,
    });

    const buffer = await generateIllustrationFromReference(prompt, anchor.buffer);
    const imagePath = await saveImage(childId, `page-${page.pageNumber}.jpg`, buffer);
    imagePaths.set(page.pageNumber, imagePath);
  }

  return {
    imagePaths,
    ...(anchor.created || !styleAnchorPath ? { styleAnchorPath: anchor.path } : {}),
  };
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
    language: resolveStoryLanguage(record.language),
  };
}
