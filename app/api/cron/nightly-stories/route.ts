import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { countPendingNightlyStories, processNextNightlyStory } from "@/lib/nightly-stories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const result = await processNextNightlyStory();

  if ("done" in result && result.done) {
    return NextResponse.json({
      message: "All nightly stories already sent for today",
      remaining: 0,
    });
  }

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  const pending = await countPendingNightlyStories();
  return NextResponse.json({ pending });
}
