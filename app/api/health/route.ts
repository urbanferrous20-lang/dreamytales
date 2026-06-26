import { NextResponse } from "next/server";
import { formatSmtpError, getSmtpHostForDiagnostics, isSmtpConfigured, verifySmtpConnection } from "@/lib/smtp";

export async function GET() {
  const smtpConfigured = isSmtpConfigured();
  let smtpCanConnect = false;
  let smtpError: string | null = null;

  if (smtpConfigured) {
    try {
      await verifySmtpConnection();
      smtpCanConnect = true;
    } catch (error) {
      smtpError = formatSmtpError(error);
    }
  }

  return NextResponse.json({
    ok: true,
    service: "dreamy-tales",
    smtpConfigured,
    smtpHost: getSmtpHostForDiagnostics(),
    smtpCanConnect,
    smtpError,
  });
}
