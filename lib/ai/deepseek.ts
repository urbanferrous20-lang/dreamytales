import "server-only";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY is not configured");
  return key;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function deepseekChat(
  messages: ChatMessage[],
  options?: { json?: boolean; temperature?: number }
): Promise<string> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options?.temperature ?? 0.7,
      response_format: options?.json ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Story generation failed. Please try again later.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Story generation returned empty content");
  return content;
}

export async function deepseekJson<T>(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<T> {
  const content = await deepseekChat(messages, {
    json: true,
    temperature: options?.temperature ?? 0.6,
  });
  return JSON.parse(content) as T;
}
