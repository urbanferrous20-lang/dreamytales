import { randomInt } from "crypto";

export type StoryArchetype = {
  key: string;
  label: string;
  /** Page-by-page structure — must differ from other archetypes. */
  outline: string;
};

export const STORY_ARCHETYPES: StoryArchetype[] = [
  {
    key: "discovery",
    label: "Discovery",
    outline:
      "Pages 1–2: ordinary evening beat, then notice something small and strange (not a problem — a curiosity). " +
      "Pages 3–7: gentle exploration following the wonder; no villains, no chase. " +
      "Pages 8–9: delight at what was found. Page 10: sleepy gratitude at home.",
  },
  {
    key: "helper",
    label: "Helper",
    outline:
      "Pages 1–2: calm start; someone small needs a tiny favour (lost glow, tangled ribbon, lonely pebble). " +
      "Pages 3–7: child helps with kindness and cleverness — one setback, one retry. " +
      "Pages 8–9: helper and helped share a warm moment. Page 10: home, proud and drowsy.",
  },
  {
    key: "wonder_walk",
    label: "Wonder walk",
    outline:
      "Pages 1–2: invitation to wander (dream path, moonlit shortcut, toy-led stroll) — NO conflict or problem. " +
      "Pages 3–8: sensory wonder — sights, sounds, soft magic; each page a new small marvel. " +
      "Pages 9–10: slow return home, yawning, stars.",
  },
  {
    key: "friendship_cameo",
    label: "Friendship",
    outline:
      "Pages 1–2: think of someone they love (best friend, sibling, or pet if in profile). " +
      "Pages 3–7: magical adventure that mirrors sharing, teamwork, or inside-joke warmth — not conflict-heavy. " +
      "Pages 8–9: send imaginary goodnight to that person/creature. Page 10: cozy sleep.",
  },
  {
    key: "gentle_mystery",
    label: "Gentle mystery",
    outline:
      "Pages 1–2: a tiny puzzle appears (a sound, a trail of sparkles, a note only they can read). " +
      "Pages 3–7: three soft clues — no fear, no urgency. " +
      "Pages 8–9: sweet, obvious reveal (never scary). Page 10: mystery solved, eyes closing.",
  },
  {
    key: "cozy_comedy",
    label: "Cozy comedy",
    outline:
      "Pages 1–2: something mildly silly happens (backwards slippers, hiccuping stars, polite soup that talks). " +
      "Pages 3–7: playful mishaps that stay gentle — laugh, don't panic. " +
      "Pages 8–9: silliness settles. Page 10: giggle into sleep.",
  },
  {
    key: "dream_journey",
    label: "Dream journey",
    outline:
      "Pages 1–2: heavy eyelids; the room softens — they drift without leaving bed for long. " +
      "Pages 3–8: dreamscape adventure (rules can bend); anchor one detail from their real home. " +
      "Pages 9–10: dream folds back into pillow; name in goodnight line.",
  },
  {
    key: "kindness_quest",
    label: "Kindness quest",
    outline:
      "Pages 1–2: hear about three tiny acts of kindness needed nearby. " +
      "Pages 3–8: complete each act (one per pair of pages) — small, concrete, magical. " +
      "Pages 9–10: world feels warmer; child sleeps knowing they helped.",
  },
];

const RECENT_ARCHETYPE_WINDOW = 4;

export function pickStoryArchetype(params: { recentArchetypeKeys: string[] }): StoryArchetype {
  const recent = new Set(params.recentArchetypeKeys.filter(Boolean).slice(0, RECENT_ARCHETYPE_WINDOW));
  const candidates = STORY_ARCHETYPES.filter((a) => !recent.has(a.key));

  const pool = candidates.length > 0 ? candidates : STORY_ARCHETYPES;
  return pool[randomInt(pool.length)]!;
}

export function formatArchetypePrompt(archetype: StoryArchetype): string {
  return (
    `TONIGHT'S STORY TYPE (${archetype.label}):\n${archetype.outline}\n` +
    "Follow this arc exactly — do NOT default to 'magic spark at home → creature guide → problem → home' unless this archetype calls for it."
  );
}
