import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAudioStored } from "@/lib/storage-config";
import fs from "fs/promises";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const story = await prisma.story.findUnique({
    where: { id },
    include: { child: { include: { user: true } } },
  });

  if (!story || story.child.userId !== session.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAudioStored(story.audioPath)) {
    return NextResponse.json(
      {
        error:
          "This narration is no longer available for download. Check your email inbox — audio is attached for PDF + Audio plans.",
      },
      { status: 410 }
    );
  }

  try {
    const buffer = await fs.readFile(story.audioPath!);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${story.title.replace(/[^a-z0-9]/gi, "-")}.mp3"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }
}
