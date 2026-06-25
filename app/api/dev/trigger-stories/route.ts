import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { countPendingNightlyStories, processNextNightlyStory } from "@/lib/nightly-stories";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const pending = await countPendingNightlyStories();
  const result = await processNextNightlyStory();

  return NextResponse.json({ pending, result });
}
