/** Google Cloud Text-to-Speech — native af-ZA voices (not Dutch). */

const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

/** Only Standard tier exists for af-ZA; still proper South African Afrikaans locale. */
export const AFRIKAANS_VOICE = "af-ZA-Standard-A";

export function isGoogleTtsConfigured(): boolean {
  return Boolean(process.env.GOOGLE_TTS_API_KEY?.trim());
}

export async function synthesizeAfrikaansMp3(
  text: string,
  speakingRate = 0.92
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY is not configured");
  }

  const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: "af-ZA",
        name: AFRIKAANS_VOICE,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate,
        pitch: 0,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Google TTS failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }

  const data = (await response.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error("Google TTS returned no audio");
  }

  return Buffer.from(data.audioContent, "base64");
}
