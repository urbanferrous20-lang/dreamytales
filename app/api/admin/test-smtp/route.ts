import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  formatSmtpError,
  getFromAddress,
  getSmtpHostForDiagnostics,
  isSmtpConfigured,
  sendTestEmail,
  verifySmtpConnection,
} from "@/lib/smtp";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json({
      configured: false,
      host: null,
      from: getFromAddress(),
      canConnect: false,
      error: "SMTP_HOST, SMTP_USER, and SMTP_PASS are not set in .env",
    });
  }

  try {
    await verifySmtpConnection();
    return NextResponse.json({
      configured: true,
      host: getSmtpHostForDiagnostics(),
      from: getFromAddress(),
      canConnect: true,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      host: getSmtpHostForDiagnostics(),
      from: getFromAddress(),
      canConnect: false,
      error: formatSmtpError(error),
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "SMTP is not configured. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { to?: string };
  const to = body.to?.trim() || process.env.ADMIN_EMAIL;
  if (!to) {
    return NextResponse.json({ error: "Provide { \"to\": \"email\" } or set ADMIN_EMAIL" }, { status: 400 });
  }

  try {
    await verifySmtpConnection();
    await sendTestEmail(to);
    return NextResponse.json({ success: true, to, from: getFromAddress() });
  } catch (error) {
    return NextResponse.json({ error: formatSmtpError(error) }, { status: 500 });
  }
}
