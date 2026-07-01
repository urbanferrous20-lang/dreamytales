import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { isGoogleTtsConfigured, synthesizeAfrikaansMp3 } from "@/lib/google-tts";
import { resolveStoryLanguage, type ActiveStoryLanguageId } from "@/lib/sa-languages";

/** Calm bedtime narrator — female voices */
export const NARRATION_VOICE = "shimmer" as const;
export const NARRATION_MODEL = "gpt-4o-mini-tts";
export const NARRATION_SPEED = 0.92;

/** Pause between story pages (seconds) — built from repeated short silence clips */
export const PAGE_PAUSE_SECONDS = 2.5;

export type StoryPageForNarration = {
  pageNumber: number;
  text: string;
};

export type NarrationOptions = {
  /** Child story language from profile — english | afrikaans */
  language?: string;
};

const PAUSE_ASSET = path.join(process.cwd(), "assets", "narration", "page-pause-unit.mp3");

let openaiClient: OpenAI | null = null;
let cachedPauseUnit: Buffer | null = null;
let loggedAfrikaansFallback = false;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    openaiClient = new OpenAI({ apiKey: key });
  }
  return openaiClient;
}

function resolveNarrationLanguage(language?: string): ActiveStoryLanguageId {
  return resolveStoryLanguage(language ?? "english");
}

function englishInstructions(): string {
  return (
    "Speak as a warm, calm South African mother reading a bedtime story to a child. " +
    "Gentle pace, soothing tone, slightly slower than everyday conversation."
  );
}

function afrikaansOpenAiInstructions(): string {
  return (
    "Speak in South African Afrikaans as a native speaker from South Africa — NOT Dutch, NOT Netherlands Dutch. " +
    "Warm bedtime story tone for a child. Calm, gentle, and soothing. Use natural South African Afrikaans pronunciation."
  );
}

async function synthesizePageMp3OpenAi(
  text: string,
  language: ActiveStoryLanguageId
): Promise<Buffer> {
  const openai = getOpenAI();
  const isAfrikaans = language === "afrikaans";

  const response = await openai.audio.speech.create({
    model: NARRATION_MODEL,
    voice: isAfrikaans ? "coral" : NARRATION_VOICE,
    input: text,
    speed: NARRATION_SPEED,
    response_format: "mp3",
    instructions: isAfrikaans ? afrikaansOpenAiInstructions() : englishInstructions(),
  });

  return Buffer.from(await response.arrayBuffer());
}

async function synthesizePageMp3(
  text: string,
  language: ActiveStoryLanguageId
): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    return Buffer.alloc(0);
  }

  if (language === "afrikaans" && isGoogleTtsConfigured()) {
    return synthesizeAfrikaansMp3(trimmed, NARRATION_SPEED);
  }

  if (language === "afrikaans" && !loggedAfrikaansFallback) {
    loggedAfrikaansFallback = true;
    console.warn(
      "[narration] GOOGLE_TTS_API_KEY not set — Afrikaans uses OpenAI (may sound Dutch). " +
        "Add a Google Cloud TTS API key for native af-ZA pronunciation."
    );
  }

  return synthesizePageMp3OpenAi(trimmed, language);
}

/** ~0.5s quiet breath unit — concatenated for longer pauses between pages */
async function getPauseUnitMp3(): Promise<Buffer> {
  if (cachedPauseUnit) return cachedPauseUnit;

  try {
    cachedPauseUnit = await fs.readFile(PAUSE_ASSET);
    return cachedPauseUnit;
  } catch {
    const openai = getOpenAI();
    const response = await openai.audio.speech.create({
      model: NARRATION_MODEL,
      voice: NARRATION_VOICE,
      input: " ",
      speed: 0.5,
      response_format: "mp3",
      instructions: "Silence.",
    });
    cachedPauseUnit = Buffer.from(await response.arrayBuffer());
    await fs.mkdir(path.dirname(PAUSE_ASSET), { recursive: true });
    await fs.writeFile(PAUSE_ASSET, cachedPauseUnit);
    return cachedPauseUnit;
  }
}

async function buildPagePauseMp3(): Promise<Buffer> {
  const unit = await getPauseUnitMp3();
  const repeats = Math.max(3, Math.round(PAGE_PAUSE_SECONDS / 0.5));
  return Buffer.concat(Array.from({ length: repeats }, () => unit));
}

/** Build one MP3 with a gentle pause after each page. */
export async function generateStoryNarration(
  pages: StoryPageForNarration[],
  options?: NarrationOptions
): Promise<Buffer> {
  const language = resolveNarrationLanguage(options?.language);
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const parts: Buffer[] = [];
  const pause = await buildPagePauseMp3();

  for (let i = 0; i < sorted.length; i++) {
    const pageMp3 = await synthesizePageMp3(sorted[i]!.text, language);
    if (pageMp3.length > 0) parts.push(pageMp3);
    if (i < sorted.length - 1) {
      parts.push(pause);
    }
  }

  return Buffer.concat(parts);
}

export async function saveStoryAudio(childId: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "storage", "audio", childId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${Date.now()}.mp3`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function buildAndSaveStoryNarration(
  childId: string,
  pages: StoryPageForNarration[],
  options?: NarrationOptions
): Promise<string> {
  const mp3 = await generateStoryNarration(pages, options);
  return saveStoryAudio(childId, mp3);
}
