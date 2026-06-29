import type { ChildProfileInput } from "@/lib/types/child";
import { getIllustrationContentPolicy } from "@/lib/story-content-policy";

export type IllustrationCharacterBible = {
  protagonist: string;
  appearance: string;
  illustrationStyle: string;
};

export const CHARACTER_ANCHOR_FILENAME = "character-anchor.jpg";

export function formatIllustrationCharacterBlock(
  child: ChildProfileInput,
  characterBible: IllustrationCharacterBible
): string {
  return [
    `Protagonist: ${characterBible.protagonist}`,
    `Locked appearance: ${characterBible.appearance}`,
    child.favoriteColors ? `Signature colours: ${child.favoriteColors}` : null,
  ]
    .filter(Boolean)
    .join(". ");
}

/** One-time reference sheet — saved per child and reused for every story page. */
export function buildCharacterAnchorPrompt(
  child: ChildProfileInput,
  characterBible: IllustrationCharacterBible
): string {
  return [
    "Children's storybook character reference sheet for a bedtime picture-book series.",
    getIllustrationContentPolicy(),
    "Single child protagonist only — full body and face clearly visible, front-facing, gentle smile.",
    "Plain soft cream background, no scenery, no other characters.",
    `${characterBible.illustrationStyle}. Soft flat digital art, muted warm bedtime palette.`,
    "No text, no words, no labels in the image.",
    `Character (identity only — do not write name on image): ${child.name}, age ${child.age}.`,
    `Appearance — lock this exact design: ${characterBible.appearance}`,
    child.favoriteColors
      ? `Bedtime outfit in ${child.favoriteColors} tones (pajamas or comfy clothes).`
      : "Cozy bedtime pajamas.",
    "Design must be distinctive and repeatable: clear face shape, hairstyle, skin tone, and outfit for every page of every story.",
  ].join(" ");
}

export function buildSceneIllustrationPrompt(params: {
  childName: string;
  description: string;
  mood: string;
  characterBlock: string;
  illustrationStyle: string;
  locationHint?: string;
}): string {
  return [
    "Children's bedtime short storybook illustration — one scene from a picture book.",
    getIllustrationContentPolicy(),
    `CRITICAL: The attached reference image is ${params.childName}. Match that character EXACTLY.`,
    "Keep IDENTICAL across every page: face, eyes, nose, mouth, hairstyle, hair colour, skin tone, body proportions, and default pajamas/outfit.",
    "Change ONLY: pose, expression, camera angle, background, and scene action.",
    params.illustrationStyle,
    "Soft flat digital art, muted warm palette, calming bedtime mood.",
    "No text, no words, no letters in the image.",
    params.locationHint ? `South African setting: ${params.locationHint}` : "South African setting.",
    params.characterBlock,
    `Scene: ${params.description}`,
    `Mood: ${params.mood}`,
  ].join(" ");
}
