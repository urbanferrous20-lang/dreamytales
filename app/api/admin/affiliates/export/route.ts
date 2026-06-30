import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAffiliateConversionsForMonth, getAffiliateMonthlyReport } from "@/lib/affiliate";

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const month = request.nextUrl.searchParams.get("month")?.trim();
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month query param required (YYYY-MM)" }, { status: 400 });
  }

  const [report, conversions] = await Promise.all([
    getAffiliateMonthlyReport(month),
    getAffiliateConversionsForMonth(month),
  ]);

  const lines: string[] = [
    "Dreamy Tales affiliate payout report",
    `Month,${month}`,
    "",
    "School,Code,Conversions,Total owed,Pending,Paid",
    ...report
      .filter((row) => row.conversions > 0)
      .map(
        (row) =>
          `${csvEscape(row.name)},${csvEscape(row.code)},${row.conversions},${row.commissionTotal.toFixed(2)},${row.pendingTotal.toFixed(2)},${row.paidTotal.toFixed(2)}`
      ),
    "",
    "School,Code,Parent name,Parent email,Commission,Converted date,Status",
    ...conversions.map((row) =>
      [
        csvEscape(row.partnerName),
        csvEscape(row.partnerCode),
        csvEscape(row.parentName),
        csvEscape(row.parentEmail),
        row.commissionAmount.toFixed(2),
        row.convertedAt.toISOString().slice(0, 10),
        row.payoutStatus,
      ].join(",")
    ),
  ];

  const body = lines.join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dreamytales-affiliates-${month}.csv"`,
    },
  });
}
