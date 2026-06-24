import crypto from "crypto";
import "server-only";
import { getSiteUrl } from "@/lib/site";

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

export function generatePayfastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  const pass = passphrase ?? getMerchantConfig().passphrase;
  const ordered = Object.keys(data)
    .filter((k) => data[k] !== "" && k !== "signature")
    .sort();
  const paramString = ordered.map((k) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, "+")}`).join("&");
  return crypto.createHash("md5").update(`${paramString}&passphrase=${pass}`).digest("hex");
}

export function generateFormSignature(data: Record<string, string>): string {
  const { passphrase } = getMerchantConfig();
  const pairs = Object.entries(data)
    .filter(([k, v]) => v !== "" && k !== "signature")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`);
  const paramString = pairs.join("&");
  return crypto.createHash("md5").update(`${paramString}&passphrase=${passphrase}`).digest("hex");
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
  const { merchantId, merchantKey } = getMerchantConfig();
  const appUrl = getAppUrl();
  const isAnnual = params.billingInterval === "annual";

  const data: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `${appUrl}/signup/success`,
    cancel_url: `${appUrl}/signup?cancelled=1`,
    notify_url: `${appUrl}/api/webhooks/payfast/itn`,
    m_payment_id: params.mPaymentId,
    amount: params.amount,
    item_name: params.itemName,
    item_description: params.itemDescription,
    email_address: params.emailAddress,
    name_first: params.nameFirst,
    name_last: params.nameLast,
    subscription_type: "1",
    billing_date: params.billingDate,
    recurring_amount: params.recurringAmount,
    frequency: isAnnual ? "6" : "3",
    cycles: "0",
    subscription_notify_webhook: "true",
    custom_str1: params.mPaymentId,
    custom_str2: params.billingInterval,
  };

  data.signature = generateFormSignature(data);
  return data;
}

export async function cancelPayfastSubscription(token: string): Promise<boolean> {
  const { merchantId, passphrase } = getMerchantConfig();
  const timestamp = new Date().toISOString().slice(0, 19);
  const path = `/subscriptions/${token}/cancel`;
  const signatureData = {
    "merchant-id": merchantId,
    timestamp,
    version: "v1",
  };
  const signature = generatePayfastSignature(signatureData, passphrase);

  const url = `${getPayfastApiBase()}${path}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "merchant-id": merchantId,
      version: "v1",
      timestamp,
      signature,
    },
  });

  return response.ok;
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

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatBillingDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
