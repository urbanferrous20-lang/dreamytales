import "server-only";
import OpenAI from "openai";
import { getIllustrationContentPolicy } from "@/lib/story-content-policy";

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
    size: "1024x1024",
    quality: "medium",
    n: 1,
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image generation failed");
  return Buffer.from(b64, "base64");
}

export function buildIllustrationPrompt(scene: {
  description: string;
  mood: string;
  childDescription: string;
  locationHint?: string;
}): string {
  return [
    "Children's bedtime short storybook illustration.",
    getIllustrationContentPolicy(),
    "Soft flat digital art, muted warm palette, calming bedtime mood.",
    "No text, no words, no letters in the image.",
    "Age-appropriate, friendly, gentle lighting.",
    scene.locationHint ? `South African setting: ${scene.locationHint}` : "South African setting.",
    `Main character: ${scene.childDescription}`,
    `Scene: ${scene.description}`,
    `Mood: ${scene.mood}`,
  ].join(" ");
}
