import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { month?: string; partnerId?: string };
  const month = body.month?.trim();
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month is required (YYYY-MM)" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

  const result = await prisma.affiliateConversion.updateMany({
    where: {
      convertedAt: { gte: start, lte: end },
      payoutStatus: "pending",
      ...(body.partnerId ? { partnerId: body.partnerId } : {}),
    },
    data: {
      payoutStatus: "paid",
      paidAt: new Date(),
      payoutMonth: month,
    },
  });

  return NextResponse.json({ updated: result.count });
}
