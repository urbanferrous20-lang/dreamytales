import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { inngest } from "@/inngest/client";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  await inngest.send({ name: "dev/trigger-stories", data: {} });

  return NextResponse.json({ message: "Use Inngest dashboard or cron for story generation" });
}
