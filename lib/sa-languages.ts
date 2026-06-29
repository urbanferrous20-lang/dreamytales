/** Full registry of South Africa's 11 official spoken languages (legacy DB + future use). */
import { getStoryContentPolicy, getStoryFantasyPolicy } from "@/lib/story-content-policy";

export const SA_LANGUAGES = [
  { id: "english", label: "English", nativeLabel: "English" },
  { id: "afrikaans", label: "Afrikaans", nativeLabel: "Afrikaans" },
  { id: "isi_xhosa", label: "isiXhosa", nativeLabel: "isiXhosa" },
  { id: "isi_zulu", label: "isiZulu", nativeLabel: "isiZulu" },
  { id: "isi_ndebele", label: "isiNdebele", nativeLabel: "isiNdebele" },
  { id: "sepedi", label: "Sepedi", nativeLabel: "Sepedi" },
  { id: "sesotho", label: "Sesotho", nativeLabel: "Sesotho" },
  { id: "setswana", label: "Setswana", nativeLabel: "Setswana" },
  { id: "siswati", label: "siSwati", nativeLabel: "siSwati" },
  { id: "tshivenda", label: "Tshivenda", nativeLabel: "Tshivenda" },
  { id: "xitsonga", label: "Xitsonga", nativeLabel: "Xitsonga" },
] as const;

/** Languages currently offered for signup and story generation. */
export const ACTIVE_STORY_LANGUAGES = [
  { id: "english", label: "English", nativeLabel: "English" },
  { id: "afrikaans", label: "Afrikaans", nativeLabel: "Afrikaans" },
] as const;

export type SALanguageId = (typeof SA_LANGUAGES)[number]["id"];

export type ActiveStoryLanguageId = (typeof ACTIVE_STORY_LANGUAGES)[number]["id"];

export const SA_LANGUAGE_IDS = SA_LANGUAGES.map((l) => l.id) as [
  SALanguageId,
  ...SALanguageId[],
];

export const ACTIVE_STORY_LANGUAGE_IDS = ACTIVE_STORY_LANGUAGES.map((l) => l.id) as [
  ActiveStoryLanguageId,
  ...ActiveStoryLanguageId[],
];

export const STORY_LANGUAGE_MARKETING_LABEL = "English & Afrikaans";

export function isActiveStoryLanguage(id: string): id is ActiveStoryLanguageId {
  return (ACTIVE_STORY_LANGUAGE_IDS as readonly string[]).includes(id);
}

/** Inactive legacy languages fall back to English at generation time. */
export function resolveStoryLanguage(id: string): ActiveStoryLanguageId {
  return isActiveStoryLanguage(id) ? id : "english";
}

export function getLanguageLabel(id: string): string {
  return SA_LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export function getStoryLanguageInstruction(languageId: ActiveStoryLanguageId): string {
  switch (languageId) {
    case "english":
      return "Write the entire story in English (South African English). Do not mix in other languages except proper nouns.";
    case "afrikaans":
      return "Write the entire story in Afrikaans. Use natural, warm bedtime vocabulary suitable for children. Do not mix in English except proper nouns.";
  }
}

export function buildStorySystemPrompt(languageId: ActiveStoryLanguageId, age: number): string {
  return `You write custom bedtime short stories for South African children.
Return valid JSON only. Stories must be age-appropriate, calming, and end peacefully for sleep.
Each story has exactly 10 pages. Final page must include the child's name in a sleepy goodnight line.
Stories MUST feel rooted in the child's South African location — use local place names, landscapes, weather, and everyday details from their province and city where natural. Do not genericise to "a faraway land".

${getStoryContentPolicy(age)}

${getStoryFantasyPolicy(age)}

LANGUAGE (critical): ${getStoryLanguageInstruction(languageId)}`;
}
