/** Shared content rules for all AI-generated stories and illustrations. */
export function getStoryContentPolicy(age: number): string {
  const ageBand =
    age <= 5
      ? "ages 3–5: very simple words, short sentences, no abstract themes"
      : age <= 8
        ? "ages 6–8: clear vocabulary, gentle plots, mild curiosity only"
        : "ages 9–12: richer vocabulary but still calm, wholesome, and bedtime-appropriate";

  return `CONTENT & SAFETY (mandatory — never break these):
- Write for a ${age}-year-old child (${ageBand}).
- Be completely child-friendly: no violence, gore, weapons used as threats, bullying, cruelty, horror, sexual content, drugs, or strong fear.
- End peacefully and sleepily — suitable for bedtime.
- Stay neutral and inclusive. Do not favour or disfavour any race, ethnicity, culture, religion, language group, gender, disability, or family type.
- Avoid stereotypes, caricatures, slurs, biased generalisations, or "us vs them" framing. Portray all characters with dignity.
- Celebrate South African diversity respectfully without tokenism or mockery.
- Do not preach one political, religious, or cultural viewpoint as correct; keep themes universal (kindness, curiosity, friendship, courage, honesty).
- If the parent listed topics to avoid, honour those strictly.
- If the child loves toy soldiers or action figures, use them only in gentle imaginative play — guides, explorers, or protectors — never war, combat, or realistic violence.`;
}

/** Fantasy tone for every subscriber story — age-calibrated but always present. */
export function getStoryFantasyPolicy(age: number): string {
  const intensity =
    age <= 5
      ? "Keep magic simple and cosy: talking animals, friendly tiny spirits, toys that come alive for a moment, quiet moonlight secrets."
      : age <= 8
        ? "Use moderate fantasy: magical guides, familiar places with a hidden twist, gentle transformations, whimsical SA-flavoured creatures."
        : "Use richer fantasy: hidden layers in the real city, folklore-inspired allies, wonder-filled quests — still calm, never frightening.";

  return `FANTASY & WONDER (required in every story):
- Every story MUST include meaningful fantasy or magical wonder — not realistic slice-of-life only.
- The child has a real home in South Africa, but tonight's primary setting (provided separately) may be a forest, coast, mountains, cloud kingdom, magical library, or their neighbourhood — vary locations across nights.
- Tie enchantment to the child's interests, favourite toys, pets, and character-bible recurring elements.
- ${intensity}
- Good elements: friendly companions, enchanted everyday objects, whispering wind or star guides, unicorns, small dragons, talking clouds, paper planes that listen, dreams that softly touch the waking world, silly surprises, gentle puzzles.
- Vary how wonder shows up — humour, kindness, discovery, a talking animal, a secret door, a dream twist. Do NOT lean on glow, shimmer, sparkle, radiance, or luminous light in every scene.
- At most ONE page may use a soft glow or sparkle if the plot truly needs it; most pages should use other kinds of wonder.
- Fantasy serves bedtime: build wonder through the middle pages, then wind down to a peaceful, sleepy close on page 10.
- Avoid: horror, scary monsters, dark magic, chases, peril, death, bleak tone, or anything that would keep a child awake.`;
}

export function getIllustrationContentPolicy(): string {
  return [
    "Inclusive, neutral, child-safe illustration.",
    "No stereotypes or biased portrayals by race, ethnicity, culture, religion, gender, or appearance.",
    "Friendly, dignified characters; no scary, violent, or adult imagery.",
    "Include gentle fantasy visuals where the scene allows: magical companions, enchanted objects, whimsical SA settings — avoid defaulting every scene to glowing or sparkly light.",
  ].join(" ");
}

export function formatTopicsToAvoid(topicsToAvoid?: string): string | null {
  const trimmed = topicsToAvoid?.trim();
  if (!trimmed) return null;
  return `Parent-requested topics to avoid (strict): ${trimmed}`;
}
