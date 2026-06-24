import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storyReviewSchema } from "@/lib/reviews";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = storyReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid review" },
        { status: 400 }
      );
    }

    const { storyId, rating, comment } = parsed.data;

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: { child: { include: { user: true } } },
    });

    if (!story || story.child.userId !== session.userId) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const review = await prisma.storyReview.upsert({
      where: { userId_storyId: { userId: session.userId, storyId } },
      create: {
        userId: session.userId,
        storyId,
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
