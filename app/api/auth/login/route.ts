import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createSession,
  isSecureRequest,
  setSessionCookie,
} from "@/lib/auth";
import {
  activatePendingSignupByEmail,
  findLatestPendingSignup,
} from "@/lib/signup-activate";
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
      const pending = await findLatestPendingSignup(normalizedEmail);

      if (pending && (await verifyPassword(password, pending.passwordHash))) {
        user = await activatePendingSignupByEmail(normalizedEmail, undefined, {
          allowExpired: true,
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    let valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const pending = await findLatestPendingSignup(normalizedEmail);

      if (pending && (await verifyPassword(password, pending.passwordHash))) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: pending.passwordHash },
          }),
          prisma.pendingSignup.delete({ where: { id: pending.id } }),
        ]);
        valid = true;
      }
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token, { secure: isSecureRequest(request) });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
