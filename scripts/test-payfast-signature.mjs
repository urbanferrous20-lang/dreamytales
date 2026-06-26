/**
 * Quick PayFast signature sanity check (no app imports required).
 * Usage: node scripts/test-payfast-signature.mjs
 */
import crypto from "crypto";

const PAYFAST_CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "name_first",
  "name_last",
  "email_address",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_str1",
  "custom_str2",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
];

function encodePayfastValue(value, trim = true) {
  const normalized = trim ? value.trim() : value;
  return encodeURIComponent(normalized)
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

function generateFormSignature(data, passphrase) {
  const parts = [];
  for (const key of PAYFAST_CHECKOUT_FIELD_ORDER) {
    const value = data[key];
    if (!value || key === "signature") continue;
    parts.push(`${key}=${encodePayfastValue(value)}`);
  }
  const paramString = parts.join("&");
  return crypto
    .createHash("md5")
    .update(`${paramString}&passphrase=${encodePayfastValue(passphrase)}`)
    .digest("hex");
}

// PayFast documentation example (sandbox)
const docExample = {
  merchant_id: "10000100",
  merchant_key: "46f0cd694581a",
  return_url: "http://www.yourdomain.co.za/return.php",
  cancel_url: "http://www.yourdomain.co.za/cancel.php",
  notify_url: "http://www.yourdomain.co.za/notify.php",
  name_first: "First Name",
  name_last: "Last Name",
  email_address: "test@test.com",
  m_payment_id: "1234",
  amount: "10.00",
  item_name: "Order#123",
};

console.log("Doc example signature:", generateFormSignature(docExample, "jt7NOE43FZPn"));
console.log("Compare at https://sandbox.payfast.co.za → Tools → Signature Generator");
