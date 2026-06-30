import { getIllustrationContentPolicy } from "@/lib/story-content-policy";

export const PET_ANCHOR_FILENAME = "pet-anchor.jpg";

/** Terms to detect the signup pet in scene text or descriptions. */
export function petSearchTerms(petInfo: string): string[] {
  const normalized = petInfo.trim().toLowerCase();
  if (!normalized) return [];

  const terms = new Set<string>([normalized]);

  const calledMatch = petInfo.match(/\bcalled\s+([A-Za-z]+)/i);
  if (calledMatch) terms.add(calledMatch[1].toLowerCase());

  const namedMatch = petInfo.match(/\bnamed\s+([A-Za-z]+)/i);
  if (namedMatch) terms.add(namedMatch[1].toLowerCase());

  for (const word of normalized.split(/\s+/)) {
    if (word.length >= 3) terms.add(word);
  }

  return [...terms];
}

export function sceneIncludesSignupPet(params: {
  sceneDescription: string;
  pageText: string;
  petInfo?: string | null;
}): boolean {
  const petInfo = params.petInfo?.trim();
  if (!petInfo) return false;

  const haystack = `${params.sceneDescription} ${params.pageText}`.toLowerCase();
  if (haystack.includes("pet")) return true;

  return petSearchTerms(petInfo).some(
    (term) => term.length >= 3 && haystack.includes(term)
  );
}

export function buildPetAnchorPrompt(petInfo: string, illustrationStyle: string): string {
  return [
    "Children's storybook ANIMAL reference sheet for a recurring family pet in a bedtime picture-book series.",
    getIllustrationContentPolicy(),
    "Single animal only — full body clearly visible, gentle friendly expression, simple standing or sitting pose.",
    "Plain soft cream background, no scenery, no people, no text.",
    `${illustrationStyle}. Soft flat digital art, muted warm bedtime palette.`,
    "No text, no words, no labels in the image.",
    `Design this pet EXACTLY as described at signup (lock species, size, colours, markings, ear shape, tail): ${petInfo}`,
    "Must be repeatable: the same pet design on every illustrated page when the pet appears.",
  ].join(" ");
}

export function formatIllustrationPetBlock(petInfo: string): string {
  return [
    `SIGNUP FAMILY PET: ${petInfo}`,
    "When this pet appears in the scene, match the attached pet reference image EXACTLY.",
    "Keep IDENTICAL every time: species, breed/type, size, fur/feather colour, markings, ear shape, tail, and overall silhouette.",
    "Do NOT redesign as a different animal or colour between pages.",
  ].join(" ");
}
