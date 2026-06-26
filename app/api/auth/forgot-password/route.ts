import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmail, sendSignupCompleteEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { formatSmtpError, isSmtpConfigured } from "@/lib/smtp";
import { findLatestPendingSignup } from "@/lib/signup-activate";

const GENERIC_SUCCESS =
  "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.";

const NO_ACCOUNT_HINT =
  "If nothing arrives within a few minutes, your account may not be activated yet. Try finishing signup after PayFast, or contact Admin@dreamytales.co.za for help.";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const normalizedEmail = body.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!isSmtpConfigured()) {
      console.error("Password reset requested but SMTP is not configured");
      return NextResponse.json(
        {
          error:
            "Password reset email is not configured on the server yet. Ask support to add SMTP settings, or reset your password via Plesk using: npm run user:reset-password",
        },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${getSiteUrl()}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendPasswordResetEmail({
          to: user.email,
          parentName: user.name,
          resetUrl,
        });
      } catch (error) {
        console.error("Failed to send password reset email:", formatSmtpError(error));
        return NextResponse.json(
          {
            error: `Could not send reset email: ${formatSmtpError(error)}. Check SMTP settings on the server.`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        message: `${GENERIC_SUCCESS} ${NO_ACCOUNT_HINT}`,
      });
    }

    const pending = await findLatestPendingSignup(normalizedEmail);

    if (pending) {
      const completeUrl = `${getSiteUrl()}/signup/success?ref=${encodeURIComponent(pending.id)}&email=${encodeURIComponent(pending.email)}`;

      try {
        await sendSignupCompleteEmail({
          to: pending.email,
          parentName: pending.name,
          completeUrl,
        });
      } catch (error) {
        console.error("Failed to send signup complete email:", formatSmtpError(error));
        return NextResponse.json(
          {
            error: `Could not send email: ${formatSmtpError(error)}. Check SMTP settings on the server.`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        message:
          "We found a recent signup for that email and sent a link to finish setting up your account. Check your inbox and spam folder.",
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: false,
      message: `${GENERIC_SUCCESS} ${NO_ACCOUNT_HINT}`,
    });
  } catch (error) {
    console.error("Forgot password error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
