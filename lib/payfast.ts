import crypto from "crypto";
import "server-only";
import { addDays, formatBillingDate } from "@/lib/dates";
import { getSiteUrl } from "@/lib/site";

export { addDays, formatBillingDate };

export function getAppUrl(): string {
  return getSiteUrl();
}

export function isSandbox(): boolean {
  return process.env.PAYFAST_SANDBOX !== "false";
}

export function getPayfastProcessUrl(): string {
  return isSandbox()
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

export function getPayfastValidateUrl(): string {
  return isSandbox()
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";
}

export function getPayfastApiBase(): string {
  const base = "https://api.payfast.co.za";
  return isSandbox() ? `${base}?testing=true` : base;
}

function getMerchantConfig() {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;
  if (!merchantId || !merchantKey || !passphrase) {
    throw new Error("PayFast credentials are not configured");
  }
  return { merchantId, merchantKey, passphrase };
}

/** Matches PHP urlencode() — required for PayFast signature parity. */
function encodePayfastValue(value: string, trim = true): string {
  const normalized = trim ? value.trim() : value;
  return encodeURIComponent(normalized)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

/** PayFast custom-integration field order (see developers.payfast.co.za/docs). */
const PAYFAST_CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "fica_idnumber",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

export function validatePayfastEnvironment(): void {
  const { merchantId } = getMerchantConfig();
  const sandbox = isSandbox();
  const isSandboxMerchant = merchantId === "10000100";

  if (sandbox && !isSandboxMerchant) {
    throw new Error(
      "PayFast is in sandbox mode (PAYFAST_SANDBOX is not false) but your merchant ID is a live account. Set PAYFAST_SANDBOX=false on production, or use sandbox merchant ID 10000100 for testing."
    );
  }
  if (!sandbox && isSandboxMerchant) {
    throw new Error(
      "PayFast is in live mode (PAYFAST_SANDBOX=false) but merchant ID 10000100 is sandbox-only. Use your live PayFast merchant credentials."
    );
  }
}

function orderedCheckoutEntries(data: Record<string, string>): [string, string][] {
  const seen = new Set<string>();
  const entries: [string, string][] = [];

  for (const key of PAYFAST_CHECKOUT_FIELD_ORDER) {
    const value = data[key];
    if (value === undefined || value === "") continue;
    entries.push([key, value]);
    seen.add(key);
  }

  for (const [key, value] of Object.entries(data)) {
    if (seen.has(key) || key === "signature" || value === "") continue;
    entries.push([key, value]);
  }

  return entries;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** PayFast REST API signatures use alphabetical key order. */
export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  const pass = passphrase ?? getMerchantConfig().passphrase;
  const ordered = Object.keys(data)
    .filter((k) => data[k] !== "" && k !== "signature")
    .sort();
  const paramString = ordered.map((k) => `${k}=${encodePayfastValue(data[k])}`).join("&");
  return crypto
    .createHash("md5")
    .update(`${paramString}&passphrase=${encodePayfastValue(pass)}`)
    .digest("hex");
}

/**
 * Checkout / onsite form signatures must follow PayFast attribute order.
 * Do NOT sort alphabetically — that format is API-only.
 */
export function generateFormSignature(data: Record<string, string>): string {
  const { passphrase } = getMerchantConfig();
  const parts = orderedCheckoutEntries(data).map(
    ([key, value]) => `${key}=${encodePayfastValue(value)}`
  );
  const paramString = parts.join("&");
  return crypto
    .createHash("md5")
    .update(`${paramString}&passphrase=${encodePayfastValue(passphrase)}`)
    .digest("hex");
}

export function buildPayfastRedirectHtml(
  formData: Record<string, string>,
  actionUrl: string,
  signupMeta?: { signupId: string; email: string }
): string {
  const entries = orderedCheckoutEntries(formData);
  if (formData.signature) {
    entries.push(["signature", formData.signature]);
  }

  const inputs = entries
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`
    )
    .join("\n");

  const stashScript = signupMeta
    ? `sessionStorage.setItem("dreamytales_signup_ref", ${JSON.stringify(signupMeta.signupId)});
sessionStorage.setItem("dreamytales_signup_email", ${JSON.stringify(signupMeta.email)});`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Redirecting to PayFast…</title>
</head>
<body>
  <p>Redirecting to PayFast secure checkout…</p>
  <form id="payfast-checkout" method="post" action="${escapeHtml(actionUrl)}">
${inputs}
  </form>
  <script>
${stashScript}
document.getElementById("payfast-checkout").submit();
  </script>
</body>
</html>`;
}

export function parseItnPostBody(body: string): {
  data: Record<string, string>;
  keyOrder: string[];
} {
  const params = new URLSearchParams(body);
  const data: Record<string, string> = {};
  const keyOrder: string[] = [];
  params.forEach((value, key) => {
    data[key] = value;
    keyOrder.push(key);
  });
  return { data, keyOrder };
}

/** ITN signatures use posted field order (stop at `signature`), not alphabetical order. */
export function verifyPayfastItnSignature(
  data: Record<string, string>,
  keyOrder: string[]
): boolean {
  const received = data.signature;
  if (!received) return false;

  const passphrase = process.env.PAYFAST_PASSPHRASE;
  if (!passphrase) return false;

  const parts: string[] = [];
  for (const key of keyOrder) {
    if (key === "signature") break;
    const value = data[key] ?? "";
    parts.push(`${key}=${encodePayfastValue(value, false)}`);
  }

  const expected = crypto
    .createHash("md5")
    .update(`${parts.join("&")}&passphrase=${encodePayfastValue(passphrase, false)}`)
    .digest("hex");

  return expected === received;
}

import type { BillingInterval } from "@/lib/pricing";

export type PayfastCheckoutParams = {
  mPaymentId: string;
  amount: string;
  recurringAmount: string;
  billingInterval: BillingInterval;
  itemName: string;
  itemDescription: string;
  emailAddress: string;
  nameFirst: string;
  nameLast: string;
  billingDate: string;
};

export function buildSubscriptionFormData(params: PayfastCheckoutParams): Record<string, string> {
  validatePayfastEnvironment();
  const { merchantId, merchantKey } = getMerchantConfig();
  const appUrl = getAppUrl();
  const isAnnual = params.billingInterval === "annual";

  // Insertion order must match PayFast attribute docs (merchant → buyer → transaction → subscription).
  const data: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${appUrl}/signup/success?ref=${encodeURIComponent(params.mPaymentId)}&email=${encodeURIComponent(params.emailAddress)}`,
    cancel_url: `${appUrl}/signup?cancelled=1`,
    notify_url: `${appUrl}/api/webhooks/payfast/itn`,
    name_first: params.nameFirst,
    name_last: params.nameLast,
    email_address: params.emailAddress,
    m_payment_id: params.mPaymentId,
    amount: params.amount,
    item_name: params.itemName,
    item_description: params.itemDescription,
    custom_str1: params.mPaymentId,
    custom_str2: params.billingInterval,
    subscription_type: "1",
    billing_date: params.billingDate,
    recurring_amount: params.recurringAmount,
    frequency: isAnnual ? "6" : "3",
    cycles: "0",
    subscription_notify_webhook: "true",
  };

  data.signature = generateFormSignature(data);
  return data;
}

export async function cancelPayfastSubscription(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await payfastSubscriptionRequest("PUT", `/subscriptions/${token}/cancel`);
  if (!result.ok) {
    console.error("PayFast cancel subscription failed:", result.error);
  }
  return result;
}

export async function updatePayfastSubscription(params: {
  token: string;
  recurringAmount: string;
  billingInterval: BillingInterval;
}): Promise<{ ok: boolean; error?: string }> {
  const frequency = params.billingInterval === "annual" ? "6" : "3";
  return payfastSubscriptionRequest("PATCH", `/subscriptions/${params.token}/update`, {
    amount: params.recurringAmount,
    recurring_amount: params.recurringAmount,
    frequency,
    cycles: "0",
  });
}

async function payfastSubscriptionRequest(
  method: "PUT" | "PATCH",
  path: string,
  body?: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  const { merchantId, passphrase } = getMerchantConfig();
  const timestamp = new Date().toISOString().slice(0, 19);

  const signatureData: Record<string, string> = {
    "merchant-id": merchantId,
    timestamp,
    version: "v1",
    ...(body ?? {}),
  };
  const signature = generatePayfastSignature(signatureData, passphrase);

  const url = `${getPayfastApiBase()}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "merchant-id": merchantId,
      version: "v1",
      timestamp,
      signature,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, error: text || response.statusText };
  }
  return { ok: true };
}

export async function validateItnWithPayfast(postData: string): Promise<boolean> {
  const response = await fetch(getPayfastValidateUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: postData,
  });
  const text = await response.text();
  return text.trim() === "VALID";
}

