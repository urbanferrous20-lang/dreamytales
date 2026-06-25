import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { cleanupExpiredPdfs } from "@/lib/pdf-retention";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const result = await cleanupExpiredPdfs();
  return NextResponse.json(result);
}
