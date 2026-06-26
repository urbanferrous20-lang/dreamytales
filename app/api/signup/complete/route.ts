import { NextRequest, NextResponse } from "next/server";
import { createSession, isSecureRequest, setSessionCookie } from "@/lib/auth";
import {
  findEmailForSignupId,
  getSignupRecoveryStatus,
  resolveUserAfterPayment,
} from "@/lib/signup-complete";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      signupId?: string;
      email?: string;
      password?: string;
    };
    const signupId = body.signupId?.trim();
    let email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!signupId && !email) {
      return NextResponse.json({ error: "Signup reference or email is required" }, { status: 400 });
    }

    if (signupId && !email) {
      email = (await findEmailForSignupId(signupId)) ?? undefined;
    }

    const user = await resolveUserAfterPayment({ signupId, email, password });

    if (!user) {
      const status = await getSignupRecoveryStatus({ signupId, email });
      let error =
        "We could not finish activating your account yet. Enter your signup email and password below and try again.";

      if (!status.pendingFound && !status.userFound && !status.paymentFound) {
        error =
          "We could not find your signup in our system. Please sign up again, or email Admin@dreamytales.co.za with the email you used at checkout.";
      } else if (status.userFound && password) {
        error =
          "Your account exists but the password did not match. Try the exact password from signup, or use Forgot password.";
      }

      return NextResponse.json({ error, recovery: status }, { status: 404 });
    }

    const token = await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    await setSessionCookie(token, { secure: isSecureRequest(request) });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Signup complete error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Could not finish setting up your account" }, { status: 500 });
  }
}
