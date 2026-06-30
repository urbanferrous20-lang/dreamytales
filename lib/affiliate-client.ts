/** Browser-only affiliate ref helpers (no server imports). */

export const AFFILIATE_REF_COOKIE = "dt_ref";
export const AFFILIATE_REF_COOKIE_DAYS = 30;

const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeAffiliateCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toLowerCase();
  if (!code || !CODE_PATTERN.test(code)) return null;
  return code;
}

export function getStoredAffiliateCode(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${AFFILIATE_REF_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split("=")[1] ?? "");
  return normalizeAffiliateCode(value);
}

export function storeAffiliateCode(code: string): void {
  if (typeof document === "undefined") return;
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return;
  if (getStoredAffiliateCode()) return;
  const maxAge = AFFILIATE_REF_COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function captureAffiliateRefFromUrl(): void {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref) storeAffiliateCode(ref);
}

export function slugifyAffiliateCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
