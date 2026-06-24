import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { siteReviewSchema } from "@/lib/reviews";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = siteReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid review" },
        { status: 400 }
      );
    }

    const { rating, comment } = parsed.data;

    const review = await prisma.siteReview.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        rating,
        comment: comment?.trim() || null,
      },
      update: {
        rating,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}
