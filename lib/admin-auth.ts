import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site";

const ADMIN_SESSION_COOKIE = "dreamy_tales_admin_session";
const ADMIN_SESSION_DURATION = 60 * 60 * 24 * 7;

export type AdminSessionPayload = {
  role: "admin";
  email: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL?.trim();
  if (!email) throw new Error("ADMIN_EMAIL is not configured");
  return email.toLowerCase();
}

function getAdminPlainPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  return password || null;
}

function getAdminPasswordHash(): string | null {
  const b64 = process.env.ADMIN_PASSWORD_HASH_B64?.trim();
  if (b64) {
    try {
      const decoded = Buffer.from(b64, "base64").toString("utf8").trim();
      if (decoded.startsWith("$2")) return decoded;
    } catch {
      // fall through
    }
  }

  let hash = process.env.ADMIN_PASSWORD_HASH?.trim() ?? "";
  if (
    (hash.startsWith("'") && hash.endsWith("'")) ||
    (hash.startsWith('"') && hash.endsWith('"'))
  ) {
    hash = hash.slice(1, -1);
  }
  if (!hash || !hash.startsWith("$2")) return null;
  return hash;
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPlainPassword() || getAdminPasswordHash());
}

/** Explains common Plesk misconfiguration (plain password in HASH_B64 field). */
export function getAdminPasswordConfigError(): string | null {
  if (isAdminPasswordConfigured()) return null;

  if (process.env.ADMIN_PASSWORD_HASH_B64?.trim()) {
    return (
      "ADMIN_PASSWORD_HASH_B64 is set but is not a valid bcrypt hash. " +
      "Do not put your plain password there. Use ADMIN_PASSWORD=your-password instead, " +
      "or run: npm run admin:hash-password -- \"your-password\" and paste the ADMIN_PASSWORD_HASH_B64 line it prints."
    );
  }

  if (process.env.ADMIN_PASSWORD_HASH?.trim()) {
    return "ADMIN_PASSWORD_HASH is set but is not a valid bcrypt hash (must start with $2).";
  }

  return "Set ADMIN_PASSWORD=your-password in httpdocs/.env, or generate ADMIN_PASSWORD_HASH_B64 with npm run admin:hash-password.";
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = getAdminEmail();
  if (email.trim().toLowerCase() !== adminEmail) return false;

  const plainPassword = getAdminPlainPassword();
  if (plainPassword && password === plainPassword) return true;

  const hash = getAdminPasswordHash();
  if (!hash) return false;

  return verifyPassword(password, hash);
}

export async function createAdminSession(email: string): Promise<string> {
  const payload: AdminSessionPayload = { role: "admin", email: email.toLowerCase() };
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function verifyAdminSession(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const session = payload as unknown as AdminSessionPayload;
    if (session.role !== "admin" || session.email !== getAdminEmail()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSession(token);
}

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: getSiteUrl().startsWith("https://"),
    sameSite: "lax",
    maxAge: ADMIN_SESSION_DURATION,
    path: "/",
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export { ADMIN_SESSION_COOKIE };
