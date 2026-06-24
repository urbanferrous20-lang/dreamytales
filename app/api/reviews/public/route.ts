import { NextResponse } from "next/server";
import { getPublicReviewStats } from "@/lib/reviews-public";

export async function GET() {
  const stats = await getPublicReviewStats();
  return NextResponse.json(stats);
}
