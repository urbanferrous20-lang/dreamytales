import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { activatePendingSignupByEmail, activateSignup } from "@/lib/signup-activate";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { signupId?: string; email?: string };
    const signupId = body.signupId?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (signupId) {
        user = await activateSignup(signupId);
      }
      if (!user) {
        user = await activatePendingSignupByEmail(email);
      }
    }

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Your account is still being set up. Wait a moment and try again, or sign in with the email and password you used at signup.",
        },
        { status: 404 }
      );
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup complete error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not finish setting up your account" }, { status: 500 });
  }
}
