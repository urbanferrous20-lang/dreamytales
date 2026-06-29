import { randomInt } from "crypto";
import { type SAProvince } from "@/lib/sa-locations";
import type { ChildProfileInput } from "@/lib/types/child";
import { getResolvedCity } from "@/lib/types/child";

export type StorySettingKind = "home" | "regional" | "adventure";

export type StorySetting = {
  key: string;
  kind: StorySettingKind;
  label: string;
  prompt: string;
};

const ADVENTURE_SETTINGS: StorySetting[] = [
  {
    key: "enchanted_forest",
    kind: "adventure",
    label: "Enchanted forest",
    prompt:
      "Tonight's adventure visits a gentle enchanted forest — glowing mushrooms, whispering trees, friendly fireflies, soft moss paths. Magic feels cosy, not wild or scary.",
  },
  {
    key: "starlit_sea",
    kind: "adventure",
    label: "Starlit sea",
    prompt:
      "Tonight's adventure visits a calm starlit sea — moonlit waves, a friendly dolphin or turtle guide, bioluminescent sparkles in shallow water, a sandy cove for the sleepy ending.",
  },
  {
    key: "cloud_kingdom",
    kind: "adventure",
    label: "Cloud kingdom",
    prompt:
      "Tonight's adventure floats into a soft cloud kingdom — cotton-candy clouds, gentle wind guides, rainbow bridges, distant stars. Keep motion slow and dreamy.",
  },
  {
    key: "mountain_sanctuary",
    kind: "adventure",
    label: "Mountain sanctuary",
    prompt:
      "Tonight's adventure climbs to a peaceful mountain sanctuary — cool air, distant eagles, a hidden cave with warm lantern light, stone paths and wildflowers.",
  },
  {
    key: "desert_night",
    kind: "adventure",
    label: "Desert night",
    prompt:
      "Tonight's adventure crosses a hushed desert night — brilliant stars, a caravan of friendly beetles or meerkats, soft dunes, a oasis with palm shadows and cool water.",
  },
  {
    key: "magical_library",
    kind: "adventure",
    label: "Magical library",
    prompt:
      "Tonight's adventure enters a magical library — books that glow, paper birds, ladders into soft light, stories that flutter like moths. Quiet wonder only.",
  },
  {
    key: "riverboat_journey",
    kind: "adventure",
    label: "River journey",
    prompt:
      "Tonight's adventure follows a gentle river — a small boat or leaf raft, reeds and dragonflies, kingfishers, fireflies at dusk, banks that feel South African.",
  },
  {
    key: "secret_garden",
    kind: "adventure",
    label: "Secret garden",
    prompt:
      "Tonight's adventure discovers a walled secret garden — butterflies, hummingbirds, fountain mist, flowers in the child's favourite colours, hidden gate that only opens for kind hearts.",
  },
];

const REGIONAL_BY_PROVINCE: Record<SAProvince, StorySetting[]> = {
  "Western Cape": [
    {
      key: "wc_coast",
      kind: "regional",
      label: "Western Cape coast",
      prompt:
        "Tonight's adventure explores the Western Cape coast — fynbos cliffs, kelp forests in shallow water, penguins or seals in the distance, salt air and golden sunset.",
    },
    {
      key: "wc_winelands",
      kind: "regional",
      label: "Winelands hills",
      prompt:
        "Tonight's adventure wanders rolling winelands hills — oak shadows, baboons in the far distance (friendly), warm stone farm paths, mountain backdrop.",
    },
  ],
  Gauteng: [
    {
      key: "gp_highveld",
      kind: "regional",
      label: "Highveld evening",
      prompt:
        "Tonight's adventure crosses the Highveld — jacaranda petals, summer thunder rumbling far away, city parks turning gold at dusk, lightning bugs of magic.",
    },
    {
      key: "gp_cradle",
      kind: "regional",
      label: "Cradle grasslands",
      prompt:
        "Tonight's adventure visits wide grasslands near the city — antelope silhouettes, acacia trees, red earth paths, enormous sunset sky.",
    },
  ],
  "KwaZulu-Natal": [
    {
      key: "kzn_coast",
      kind: "regional",
      label: "KZN warm coast",
      prompt:
        "Tonight's adventure follows the warm KZN coast — sugar cane breeze, humid starlight, gentle surf, mangrove whispers or lagoon stillness.",
    },
    {
      key: "kzn_valley",
      kind: "regional",
      label: "Green valley",
      prompt:
        "Tonight's adventure explores a lush green valley — misty hills, waterfalls as soft curtains, forest birds, paths through ferns.",
    },
  ],
  "Eastern Cape": [
    {
      key: "ec_harbour",
      kind: "regional",
      label: "Harbour town",
      prompt:
        "Tonight's adventure visits a friendly harbour town — fishing boats, lighthouse beam, gulls, warm community lights along the shore.",
    },
    {
      key: "ec_hills",
      kind: "regional",
      label: "Rolling hills",
      prompt:
        "Tonight's adventure crosses rolling Eastern Cape hills — wind in the grass, distant cattle, wide sky, cosy farm gate at the end.",
    },
  ],
  Mpumalanga: [
    {
      key: "mp_mountain",
      kind: "regional",
      label: "Misty mountains",
      prompt:
        "Tonight's adventure enters misty Mpumalanga mountains — waterfalls, cool forest air, suspension bridge of moonlight, proteas and ferns.",
    },
    {
      key: "mp_bush",
      kind: "regional",
      label: "Gentle bushveld",
      prompt:
        "Tonight's adventure walks gentle bushveld — far-off elephant silhouettes (calm, not scary), marula trees, red sunset, cricket song.",
    },
  ],
  Limpopo: [
    {
      key: "lp_baobab",
      kind: "regional",
      label: "Baobab country",
      prompt:
        "Tonight's adventure visits baobab country — ancient trees, red earth, star-packed sky, folklore-friendly spirits in the branches.",
    },
  ],
  "Northern Cape": [
    {
      key: "nc_desert_stars",
      kind: "regional",
      label: "Desert stars",
      prompt:
        "Tonight's adventure crosses Northern Cape desert under brilliant stars — quiet dunes, succulents, meerkat guides, cool night air.",
    },
  ],
  "Free State": [
    {
      key: "fs_grassland",
      kind: "regional",
      label: "Golden grassland",
      prompt:
        "Tonight's adventure roams golden Free State grassland — windmills, wide horizons, sheep paths, farmhouse lights in the distance.",
    },
  ],
  "North West": [
    {
      key: "nw_plains",
      kind: "regional",
      label: "Bushveld plains",
      prompt:
        "Tonight's adventure crosses North West bushveld plains — acacia silhouettes, platinum-country sunset, friendly jackal or owl guide.",
    },
  ],
};

function homeSetting(child: ChildProfileInput, city: string): StorySetting {
  const place = child.favoritePlace?.trim() || "their home and neighbourhood";
  return {
    key: "home_base",
    kind: "home",
    label: "Home base",
    prompt:
      `Tonight's story is rooted at home in ${city} — begin in ${place}, ` +
      "weave in familiar local streets, garden, or nearby spots the child knows. " +
      "Magic can appear here without travelling far.",
  };
}

function getRegionalPool(province: string): StorySetting[] {
  return REGIONAL_BY_PROVINCE[province as SAProvince] ?? [];
}

function buildCandidatePool(child: ChildProfileInput, city: string): StorySetting[] {
  const regional = getRegionalPool(child.province);
  const home = homeSetting(child, city);
  // Weight: home ~25%, regional ~35%, adventure ~40%
  return [home, ...regional, ...ADVENTURE_SETTINGS];
}

export function pickStorySetting(params: {
  child: ChildProfileInput;
  storyNumber: number;
  recentSettingKeys: string[];
}): StorySetting {
  const city = getResolvedCity(params.child);
  const pool = buildCandidatePool(params.child, city);
  const recent = new Set(params.recentSettingKeys.filter(Boolean));

  // Rotate kinds: prefer adventure/regional on most nights; home every ~4th story
  const preferHome = params.storyNumber % 4 === 1;
  const kindOrder: StorySettingKind[] = preferHome
    ? ["home", "regional", "adventure"]
    : ["adventure", "regional", "home"];

  for (const kind of kindOrder) {
    const candidates = pool.filter((s) => s.kind === kind && !recent.has(s.key));
    if (candidates.length > 0) {
      return candidates[randomInt(candidates.length)]!;
    }
  }

  // All recent — pick randomly from full pool
  return pool[randomInt(pool.length)]!;
}

export function formatStorySettingPrompt(setting: StorySetting, child: ChildProfileInput): string {
  const city = getResolvedCity(child);
  return (
    `TONIGHT'S PRIMARY SETTING (${setting.label}):\n${setting.prompt}\n` +
    `Structure: open with a familiar beat in ${city}, journey through tonight's setting in the middle pages, ` +
    `return to home and sleep on page 10. Tie magic to the child's interests and character bible.`
  );
}

export function getBirthdayStorySetting(child: ChildProfileInput, turningAge: number): StorySetting {
  const city = getResolvedCity(child);
  const place = child.favoritePlace?.trim() || "their home";
  return {
    key: "birthday",
    kind: "home",
    label: "Birthday celebration",
    prompt:
      `Tonight is ${child.name}'s BIRTHDAY — they are turning ${turningAge} today. ` +
      `This is a special once-a-year birthday story rooted in ${city}, beginning at ${place}. ` +
      "Weave a gentle magical birthday celebration: enchanted candles, a softly glowing cake or starlight wishes, " +
      "surprise cameos from people and pets in their profile (best friend, siblings, pet) if listed, " +
      "and small joyful moments tied to their interests. " +
      "Celebratory in the middle pages but MUST wind down to a calm, sleepy birthday-night close — this is still bedtime reading. " +
      "No loud party chaos, expensive gifts, brands, or sugar overload.",
  };
}
