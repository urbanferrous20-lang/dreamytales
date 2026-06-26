import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { findValidPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; password?: string };
    const token = body.token?.trim();
    const password = body.password;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const resetRecord = await findValidPasswordResetToken(token);
    if (!resetRecord) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    const sessionToken = await createSession({
      userId: resetRecord.user.id,
      email: resetRecord.user.email,
      name: resetRecord.user.name,
    });
    await setSessionCookie(sessionToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not reset password. Please try again." }, { status: 500 });
  }
}
