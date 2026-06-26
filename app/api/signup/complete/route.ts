import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  hashPassword,
  isSecureRequest,
  setSessionCookie,
} from "@/lib/auth";
import {
  activatePendingSignupByEmail,
  activateSignup,
  findLatestPendingSignup,
} from "@/lib/signup-activate";
import { prisma } from "@/lib/db";

async function resolveUserAfterPayment(params: {
  signupId?: string;
  email?: string;
  password?: string;
}) {
  let user = null;

  if (params.signupId) {
    user = await activateSignup(params.signupId);
  }

  if (!user && params.email) {
    user = await prisma.user.findUnique({ where: { email: params.email } });
  }

  if (!user && params.email) {
    user = await activatePendingSignupByEmail(params.email, undefined, { allowExpired: true });
  }

  if (user && params.password) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(params.password) },
    });
  } else if (!user && params.email && params.password) {
    const pending = await findLatestPendingSignup(params.email);
    if (pending && params.signupId === pending.id) {
      user = await activateSignup(pending.id);
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(params.password) },
        });
      }
    }
  }

  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      signupId?: string;
      email?: string;
      password?: string;
    };
    const signupId = body.signupId?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!signupId && !email) {
      return NextResponse.json({ error: "Signup reference or email is required" }, { status: 400 });
    }

    const user = await resolveUserAfterPayment({ signupId, email, password });

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
    await setSessionCookie(token, { secure: isSecureRequest(request) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup complete error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not finish setting up your account" }, { status: 500 });
  }
}
