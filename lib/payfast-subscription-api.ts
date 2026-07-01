import crypto from "crypto";
import type { BillingInterval } from "@/lib/pricing";

/** Matches PHP urlencode() — required for PayFast signature parity. */
export function encodePayfastValue(value: string, trim = true): string {
  const normalized = trim ? value.trim() : value;
  return encodeURIComponent(normalized)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

export function isPayfastSandbox(): boolean {
  return process.env.PAYFAST_SANDBOX !== "false";
}

export function buildPayfastApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `https://api.payfast.co.za${normalized}`;
  return isPayfastSandbox() ? `${url}?testing=true` : url;
}

export function payfastApiTimestampSast(): string {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
  return `${local.replace(" ", "T")}+02:00`;
}

export function generatePayfastApiSignature(
  data: Record<string, string>,
  passphrase: string
): string {
  const withPassphrase: Record<string, string> = { ...data, passphrase };
  const ordered = Object.keys(withPassphrase)
    .filter((k) => k !== "signature" && withPassphrase[k] !== "")
    .sort();
  const paramString = ordered
    .map((k) => `${k}=${encodePayfastValue(withPassphrase[k]!)}`)
    .join("&");
  return crypto.createHash("md5").update(paramString).digest("hex");
}

function getMerchantConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  if (!merchantId || !passphrase) {
    throw new Error("PayFast credentials are not configured");
  }
  return { merchantId, passphrase };
}

async function payfastApiRequest(
  method: "GET" | "PUT" | "PATCH",
  path: string,
  options?: {
    body?: Record<string, string>;
  }
): Promise<{ ok: boolean; error?: string; data?: unknown }> {
  const { merchantId, passphrase } = getMerchantConfig();
  const timestamp = payfastApiTimestampSast();

  // Subscription token goes in the URL path only — not in the signature (WooCommerce / PayFast API).
  const signatureData: Record<string, string> = {
    "merchant-id": merchantId,
    timestamp,
    version: "v1",
    ...(options?.body ?? {}),
  };
  const signature = generatePayfastApiSignature(signatureData, passphrase);

  const response = await fetch(buildPayfastApiUrl(path), {
    method,
    headers: {
      "merchant-id": merchantId,
      version: "v1",
      timestamp,
      signature,
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const text = await response.text().catch(() => "");
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  if (!response.ok) {
    return { ok: false, error: text || response.statusText, data };
  }
  return { ok: true, data };
}

export async function pingPayfastApi(): Promise<{ ok: boolean; error?: string }> {
  return payfastApiRequest("GET", "/ping");
}

export async function fetchPayfastSubscription(
  token: string
): Promise<{ ok: boolean; error?: string; data?: unknown }> {
  return payfastApiRequest("GET", `/subscriptions/${encodeURIComponent(token)}/fetch`);
}

export async function cancelPayfastSubscription(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  return payfastApiRequest("PUT", `/subscriptions/${encodeURIComponent(token)}/cancel`);
}

export async function updatePayfastSubscription(params: {
  token: string;
  recurringAmount: string;
  billingInterval: BillingInterval;
}): Promise<{ ok: boolean; error?: string }> {
  const frequency = params.billingInterval === "annual" ? "6" : "3";
  return payfastApiRequest("PATCH", `/subscriptions/${encodeURIComponent(params.token)}/update`, {
    body: {
      amount: params.recurringAmount,
      recurring_amount: params.recurringAmount,
      frequency,
      cycles: "0",
    },
  });
}
