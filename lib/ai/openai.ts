import "server-only";
import fs from "fs/promises";
import OpenAI, { toFile } from "openai";
import {
  buildCharacterAnchorPrompt,
  CHARACTER_ANCHOR_FILENAME,
  type IllustrationCharacterBible,
} from "@/lib/illustration-character";
import { buildPetAnchorPrompt, PET_ANCHOR_FILENAME } from "@/lib/pet-illustration";
import {
  ILLUSTRATION_OPENAI_QUALITY,
  ILLUSTRATION_OPENAI_SIZE,
} from "@/lib/ai/illustration-settings";
import { optimizeIllustration } from "@/lib/image-optimize";
import { saveImage } from "@/lib/pdf-builder";
import type { ChildProfileInput } from "@/lib/types/child";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured");
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export async function generateIllustration(prompt: string): Promise<Buffer> {
  const openai = getClient();

  const response = await openai.images.generate({
    model: "gpt-image-1-mini",
    prompt,
    size: ILLUSTRATION_OPENAI_SIZE,
    quality: ILLUSTRATION_OPENAI_QUALITY,
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation failed");
  const raw = Buffer.from(b64, "base64");
  return optimizeIllustration(raw);
}

/** Generate a scene using reference image(s) so characters stay consistent. */
export async function generateIllustrationFromReference(
  prompt: string,
  referenceImages: Buffer | Buffer[]
): Promise<Buffer> {
  const openai = getClient();
  const images = Array.isArray(referenceImages) ? referenceImages : [referenceImages];
  const imageFiles = await Promise.all(
    images.map((buffer, index) =>
      toFile(
        buffer,
        index === 0 ? CHARACTER_ANCHOR_FILENAME : PET_ANCHOR_FILENAME,
        { type: "image/jpeg" }
      )
    )
  );

  try {
    const response = await openai.images.edit({
      model: "gpt-image-1-mini",
      image: imageFiles.length === 1 ? imageFiles[0]! : imageFiles,
      prompt,
      size: ILLUSTRATION_OPENAI_SIZE,
      quality: ILLUSTRATION_OPENAI_QUALITY,
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image edit returned no data");
    return optimizeIllustration(Buffer.from(b64, "base64"));
  } catch (error) {
    console.error(
      "Reference illustration failed, falling back to text-only:",
      error instanceof Error ? error.message : error
    );
    return generateIllustration(prompt);
  }
}

export async function ensureCharacterAnchor(params: {
  childId: string;
  child: ChildProfileInput;
  characterBible: IllustrationCharacterBible;
  existingAnchorPath?: string | null;
}): Promise<{ path: string; buffer: Buffer; created: boolean }> {
  if (params.existingAnchorPath) {
    try {
      const buffer = await fs.readFile(params.existingAnchorPath);
      return { path: params.existingAnchorPath, buffer, created: false };
    } catch {
      // Missing on disk — regenerate below.
    }
  }

  const prompt = buildCharacterAnchorPrompt(params.child, params.characterBible);
  const buffer = await generateIllustration(prompt);
  const filePath = await saveImage(params.childId, CHARACTER_ANCHOR_FILENAME, buffer);
  return { path: filePath, buffer, created: true };
}

export async function ensurePetAnchor(params: {
  childId: string;
  petInfo: string;
  illustrationStyle: string;
  existingAnchorPath?: string | null;
  existingAnchorSource?: string | null;
}): Promise<{ path: string; buffer: Buffer; created: boolean; source: string } | null> {
  const petInfo = params.petInfo.trim();
  if (!petInfo) return null;

  const sourceMatches =
    params.existingAnchorSource?.trim() === petInfo && params.existingAnchorPath;

  if (sourceMatches && params.existingAnchorPath) {
    try {
      const buffer = await fs.readFile(params.existingAnchorPath);
      return {
        path: params.existingAnchorPath,
        buffer,
        created: false,
        source: petInfo,
      };
    } catch {
      // Missing on disk — regenerate below.
    }
  }

  const prompt = buildPetAnchorPrompt(petInfo, params.illustrationStyle);
  const buffer = await generateIllustration(prompt);
  const filePath = await saveImage(params.childId, PET_ANCHOR_FILENAME, buffer);
  return { path: filePath, buffer, created: true, source: petInfo };
}

/** @deprecated Use buildSceneIllustrationPrompt from illustration-character.ts */
export function buildIllustrationPrompt(scene: {
  description: string;
  mood: string;
  childDescription: string;
  locationHint?: string;
}): string {
  return [
    "Children's bedtime short storybook illustration.",
    "Soft flat digital art, muted warm palette, calming bedtime mood.",
    "No text, no words, no letters in the image.",
    scene.locationHint ? `South African setting: ${scene.locationHint}` : "South African setting.",
    `Main character: ${scene.childDescription}`,
    `Scene: ${scene.description}`,
    `Mood: ${scene.mood}`,
  ].join(" ");
}
