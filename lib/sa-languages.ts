/** South Africa's 11 official spoken languages */
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

export type SALanguageId = (typeof SA_LANGUAGES)[number]["id"];

export const SA_LANGUAGE_IDS = SA_LANGUAGES.map((l) => l.id) as [
  SALanguageId,
  ...SALanguageId[],
];

export function getLanguageLabel(id: string): string {
  return SA_LANGUAGES.find((l) => l.id === id)?.label ?? id;
}

export function getStoryLanguageInstruction(languageId: SALanguageId): string {
  switch (languageId) {
    case "english":
      return "Write the entire story in English (South African English).";
    case "afrikaans":
      return "Write the entire story in Afrikaans. Use natural, warm bedtime vocabulary suitable for children.";
    case "isi_xhosa":
      return "Write the entire story in isiXhosa (Xhosa). Use natural, age-appropriate vocabulary.";
    case "isi_zulu":
      return "Write the entire story in isiZulu (Zulu). Use natural, age-appropriate vocabulary.";
    case "isi_ndebele":
      return "Write the entire story in isiNdebele (Ndebele). Use natural, age-appropriate vocabulary.";
    case "sepedi":
      return "Write the entire story in Sepedi (Northern Sotho). Use natural, age-appropriate vocabulary.";
    case "sesotho":
      return "Write the entire story in Sesotho (Southern Sotho). Use natural, age-appropriate vocabulary.";
    case "setswana":
      return "Write the entire story in Setswana. Use natural, age-appropriate vocabulary.";
    case "siswati":
      return "Write the entire story in siSwati (Swazi). Use natural, age-appropriate vocabulary.";
    case "tshivenda":
      return "Write the entire story in Tshivenda (Venda). Use natural, age-appropriate vocabulary.";
    case "xitsonga":
      return "Write the entire story in Xitsonga (Tsonga). Use natural, age-appropriate vocabulary.";
  }
}

export function buildStorySystemPrompt(languageId: SALanguageId, age: number): string {
  return `You write custom bedtime short stories for South African children.
Return valid JSON only. Stories must be age-appropriate, calming, and end peacefully for sleep.
Each story has exactly 10 pages. Final page must include the child's name in a sleepy goodnight line.
Stories MUST feel rooted in the child's South African location — use local place names, landscapes, weather, and everyday details from their province and city where natural. Do not genericise to "a faraway land".

${getStoryContentPolicy(age)}

${getStoryFantasyPolicy(age)}

LANGUAGE (critical): ${getStoryLanguageInstruction(languageId)}`;
}
