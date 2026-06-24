export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

export type SAProvince = (typeof SA_PROVINCES)[number];

export const CITIES_BY_PROVINCE: Record<SAProvince, string[]> = {
  "Eastern Cape": [
    "Port Elizabeth (Gqeberha)",
    "East London",
    "Mthatha",
    "Grahamstown (Makhanda)",
    "Jeffreys Bay",
    "Other",
  ],
  "Free State": ["Bloemfontein", "Welkom", "Bethlehem", "Kroonstad", "Other"],
  Gauteng: [
    "Johannesburg",
    "Pretoria",
    "Sandton",
    "Soweto",
    "Midrand",
    "Centurion",
    "Benoni",
    "Other",
  ],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Ballito", "Richards Bay", "Newcastle", "Other"],
  Limpopo: ["Polokwane", "Tzaneen", "Musina", "Thohoyandou", "Other"],
  Mpumalanga: ["Nelspruit (Mbombela)", "Witbank (Emalahleni)", "Secunda", "Middelburg", "Other"],
  "Northern Cape": ["Kimberley", "Upington", "Springbok", "Other"],
  "North West": ["Rustenburg", "Mahikeng", "Potchefstroom", "Klerksdorp", "Other"],
  "Western Cape": ["Cape Town", "Stellenbosch", "Paarl", "George", "Mossel Bay", "Other"],
};

/** Regional flavour hints for the story AI — keep brief to save tokens */
export const PROVINCE_STORY_HINTS: Record<SAProvince, string> = {
  "Eastern Cape": "coastal breezes, rolling hills, friendly harbour towns, warm community spirit",
  "Free State": "golden grasslands, wide open skies, starry nights, quiet farm roads",
  Gauteng: "jacaranda trees, summer thunderstorms, vibrant neighbourhoods, city parks and gardens",
  "KwaZulu-Natal": "warm Indian Ocean air, green hills, sugar cane fields, humid summer evenings",
  Limpopo: "baobab trees, bushveld sunsets, red earth, rich cultural heritage",
  Mpumalanga: "misty mountains, lush valleys, wildlife nearby, cool forest air",
  "Northern Cape": "vast desert skies, brilliant stars, dry winter air, dramatic landscapes",
  "North West": "bushveld horizons, platinum country sunsets, wide plains",
  "Western Cape": "Table Mountain views, fynbos, ocean cliffs, Mediterranean-style summers",
};

export function formatSaLocation(province: string, cityOrTown: string, suburb?: string): string {
  const parts = [cityOrTown, province, "South Africa"];
  if (suburb?.trim()) parts.unshift(suburb.trim());
  return parts.join(", ");
}

export function getLocationStoryGuidance(province: string, cityOrTown: string): string {
  const hint =
    PROVINCE_STORY_HINTS[province as SAProvince] ??
    "South African landscapes, local seasons, and familiar everyday life";
  return `Set stories in and around ${cityOrTown}, ${province}, South Africa. Weave in authentic local details: ${hint}. Use South African English; mention familiar seasonal weather where natural.`;
}
