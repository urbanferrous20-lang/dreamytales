/**
 * Illustration output tuned for story PDFs (~480×640pt pages).
 * 720px max edge ≈ 1.6× display width — sharp on phones, much smaller files than 1024 PNG.
 */
export const ILLUSTRATION_OPENAI_SIZE = "1024x1024" as const;
export const ILLUSTRATION_OPENAI_QUALITY = "medium" as const;
export const ILLUSTRATION_MAX_PX = 720;
export const ILLUSTRATION_JPEG_QUALITY = 84;
