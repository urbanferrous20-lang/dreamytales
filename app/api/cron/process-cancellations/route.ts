import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { processDueCancellations } from "@/lib/subscription-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const result = await processDueCancellations();
  return NextResponse.json(result);
}
