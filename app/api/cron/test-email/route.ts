import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { sendTestEmail } from "@/lib/smtp";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const to = request.nextUrl.searchParams.get("to") ?? process.env.ADMIN_EMAIL;
  if (!to) {
    return NextResponse.json(
      { error: "Provide ?to=email or set ADMIN_EMAIL" },
      { status: 400 }
    );
  }

  try {
    await sendTestEmail(to);
    return NextResponse.json({ success: true, to });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
