import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { activatePendingSignupByEmail } from "@/lib/signup-activate";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      const pending = await prisma.pendingSignup.findFirst({
        where: {
          email: normalizedEmail,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (pending && (await verifyPassword(password, pending.passwordHash))) {
        user = await activatePendingSignupByEmail(normalizedEmail);
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
