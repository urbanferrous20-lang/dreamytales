import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth";

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
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("ADMIN_EMAIL is not configured");
  return email.toLowerCase();
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

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = getAdminEmail();
  if (email.toLowerCase() !== adminEmail) return false;

  const plainPassword = process.env.ADMIN_PASSWORD;
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
    secure: process.env.NODE_ENV === "production",
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
