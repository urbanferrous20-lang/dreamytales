/** Higher temperature for nightly stories — more plot variety while JSON stays valid. */
export const STORY_GENERATION_TEMPERATURE = 0.8;

/** How many past stories feed dedup hints into the next prompt. */
export const STORY_RECENT_MEMORY = 14;

export function pickFocusInterest(interests: string[], storyNumber: number): string {
  if (interests.length === 0) return "their favourite things";
  return interests[(storyNumber - 1) % interests.length]!;
}

export type RecentStoryHint = {
  title: string;
  summary: string;
  settingKey?: string | null;
  archetypeKey?: string | null;
};

export function formatRecentStoryAvoidance(recent: RecentStoryHint[]): string {
  if (recent.length === 0) {
    return "Recent stories to avoid repeating: none yet — make tonight feel fresh and distinct.";
  }

  const lines = recent.map((s) => {
    const tags = [
      s.settingKey ? `setting:${s.settingKey}` : null,
      s.archetypeKey ? `type:${s.archetypeKey}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `- "${s.title}"${tags ? ` (${tags})` : ""}: ${s.summary}`;
  });

  return `RECENT STORIES — do NOT repeat these plots, openings, magical helpers, climax beats, or titles:
${lines.join("\n")}

FORBIDDEN tonight unless this archetype truly requires it:
- Opening with generic "spark of magic in the bedroom" (vary: dream, toy, sound, letter, pet, window light, etc.)
- Reusing the same friendly guide creature type from a recent story (dragon, firefly, owl, cloud — pick something new)
- Same "gentle problem → two attempts → small climax" skeleton if a recent story already used it`;
}
