/**
 * Illustration output tuned for story PDFs (~480×640pt pages).
 * 720px max edge ≈ 1.6× display width — sharp on phones, much smaller files than 1024 PNG.
 */

export const ILLUSTRATION_OPENAI_SIZE = "1024x1024" as const;

export type IllustrationOpenAIQuality = "low" | "medium" | "high" | "auto";

const ILLUSTRATION_QUALITY_VALUES: IllustrationOpenAIQuality[] = [
  "low",
  "medium",
  "high",
  "auto",
];

/** Override via ILLUSTRATION_OPENAI_QUALITY in .env (default: low). */
export function getIllustrationOpenAIQuality(): IllustrationOpenAIQuality {
  const raw = process.env.ILLUSTRATION_OPENAI_QUALITY?.trim().toLowerCase();
  if (raw && ILLUSTRATION_QUALITY_VALUES.includes(raw as IllustrationOpenAIQuality)) {
    return raw as IllustrationOpenAIQuality;
  }
  return "low";
}

export const ILLUSTRATION_OPENAI_QUALITY = getIllustrationOpenAIQuality();

export const ILLUSTRATION_MAX_PX = 720;
export const ILLUSTRATION_JPEG_QUALITY = 84;
