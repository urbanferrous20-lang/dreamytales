import type { ChildProfileInput } from "@/lib/types/child";

/** Higher temperature for nightly stories — more plot variety while JSON stays valid. */
export const STORY_GENERATION_TEMPERATURE = 0.8;

/** How many past stories feed dedup hints into the next prompt. */
export const STORY_RECENT_MEMORY = 14;

/** Roughly every Nth story may include one subtle signup-detail garnish (e.g. poster on the wall). */
export const PROFILE_GARNISH_EVERY = 5;

export type ProfileGarnish = {
  label: string;
  /** How to use it — background only */
  hint: string;
};

function buildGarnishPool(child: ChildProfileInput): ProfileGarnish[] {
  const pool: ProfileGarnish[] = [];

  for (const interest of child.interests) {
    const label = interest.trim();
    if (label) {
      pool.push({
        label,
        hint: "a poster, sticker, or drawing on the bedroom wall — not the adventure theme",
      });
    }
  }
  if (child.favoriteToy?.trim()) {
    pool.push({
      label: child.favoriteToy.trim(),
      hint: "the toy visible on a shelf or tucked under the arm for one line — not a sentient quest",
    });
  }
  if (child.petInfo?.trim()) {
    pool.push({
      label: child.petInfo.trim(),
      hint: "the pet sleeping in the corner or a quick goodnight to them — not the main plot",
    });
  }
  if (child.bestFriend?.trim()) {
    pool.push({
      label: child.bestFriend.trim(),
      hint: "a mentioned goodnight wish or photo on the dresser — friend need not appear on-page",
    });
  }
  if (child.siblingNames?.trim()) {
    pool.push({
      label: child.siblingNames.trim(),
      hint: "a whispered goodnight down the hall or shared giggle — not a joint quest",
    });
  }
  if (child.favoritePlace?.trim()) {
    pool.push({
      label: child.favoritePlace.trim(),
      hint: "a memory or view from the window — not the whole setting",
    });
  }
  if (child.moralTheme?.trim()) {
    pool.push({
      label: child.moralTheme.trim(),
      hint: "one gentle line of behaviour or kindness — show, don't lecture",
    });
  }

  return pool;
}

/** Most nights return null — plot comes from archetype, setting, and inspiration. */
export function pickOptionalProfileGarnish(
  child: ChildProfileInput,
  storyNumber: number
): ProfileGarnish | null {
  if (storyNumber % PROFILE_GARNISH_EVERY !== 0) return null;

  const pool = buildGarnishPool(child);
  if (pool.length === 0) return null;

  const slot = Math.floor(storyNumber / PROFILE_GARNISH_EVERY) - 1;
  return pool[slot % pool.length]!;
}

export function formatProfileGarnishPrompt(garnish: ProfileGarnish | null): string {
  if (!garnish) {
    return (
      "SIGNUP PROFILE GARNISH: none tonight.\n" +
      "Do NOT build the story around parent signup picks (interests, toys, pets, friends, etc.). " +
      "Tonight's plot is driven by story type, setting, and creative inspiration. " +
      "Keep the child's name, home, age, and appearance — everything else from signup stays off-stage."
    );
  }

  return (
    `OPTIONAL BACKGROUND GARNISH (at most one tiny nod): "${garnish.label}"\n` +
    `${garnish.hint}.\n` +
    "The main adventure must still follow story type, setting, and inspiration — this is wallpaper, not the plot."
  );
}

export type RecentStoryHint = {
  title: string;
  summary: string;
  settingKey?: string | null;
  archetypeKey?: string | null;
  inspirationKey?: string | null;
};

export function formatRecentStoryAvoidance(recent: RecentStoryHint[]): string {
  if (recent.length === 0) {
    return "Recent stories to avoid repeating: none yet — make tonight feel fresh and distinct.";
  }

  const lines = recent.map((s) => {
    const tags = [
      s.settingKey ? `setting:${s.settingKey}` : null,
      s.archetypeKey ? `type:${s.archetypeKey}` : null,
      s.inspirationKey ? `inspiration:${s.inspirationKey}` : null,
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
- Same "gentle problem → two attempts → small climax" skeleton if a recent story already used it
- Centring the plot on a signup interest (dinosaurs, princesses, etc.) unless garnish explicitly allows one background nod
- Overusing glow, shimmer, sparkle, radiance, luminous, or "magical light" — use other wonder instead (talking creatures, silly mishaps, secret places, kindness, gentle comedy)`;
}
