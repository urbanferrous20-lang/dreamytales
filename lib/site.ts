export const SITE_DOMAIN = "dreamytales.co.za";
export const SITE_URL = `https://${SITE_DOMAIN}`;
export const CONTACT_EMAIL = "Admin@dreamytales.co.za";
export const FROM_EMAIL = `Dreamy Tales <${CONTACT_EMAIL}>`;

/** Public base URL for links, PayFast callbacks, emails, and metadata. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return SITE_URL;
  return "http://localhost:3000";
}
