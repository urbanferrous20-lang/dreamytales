import { NextResponse } from "next/server";
import { isSmtpConfigured } from "@/lib/smtp";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "dreamy-tales",
    smtpConfigured: isSmtpConfigured(),
  });
}
