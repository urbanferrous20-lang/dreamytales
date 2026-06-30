import Link from "next/link";
import { redirect } from "next/navigation";
import { AffiliateAdminPanel } from "@/components/admin/AffiliateAdminPanel";
import { getAdminSession } from "@/lib/admin-auth";
import {
  buildAffiliateShortUrl,
  buildAffiliateSignupUrl,
  currentMonthKey,
  getAffiliateConversionsForMonth,
  getAffiliateMonthlyReport,
} from "@/lib/affiliate";
import { prisma } from "@/lib/db";

export default async function AdminAffiliatesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const params = await searchParams;
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonthKey();

  const [partners, report, conversions] = await Promise.all([
    prisma.affiliatePartner.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { conversions: true } } },
    }),
    getAffiliateMonthlyReport(month),
    getAffiliateConversionsForMonth(month),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-cream/50 mb-1">
            <Link href="/admin" className="hover:text-cream">
              ← Dashboard
            </Link>
          </p>
          <h1 className="font-display text-3xl text-cream">School affiliates</h1>
          <p className="text-cream/60 mt-1">
            Track school referral links and monthly R5 payouts (first paid month only)
          </p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-cream/70 hover:text-cream border border-cream/20 px-4 py-2 rounded-full"
          >
            Sign out
          </button>
        </form>
      </div>

      <AffiliateAdminPanel
        month={month}
        report={report}
        conversions={conversions.map((row) => ({
          ...row,
          convertedAt: row.convertedAt.toISOString(),
          paidAt: row.paidAt ? row.paidAt.toISOString() : null,
        }))}
        partners={partners.map((partner) => ({
          id: partner.id,
          code: partner.code,
          name: partner.name,
          contactName: partner.contactName,
          contactEmail: partner.contactEmail,
          commissionAmount: partner.commissionAmount,
          active: partner.active,
          notes: partner.notes,
          conversionCount: partner._count.conversions,
          signupUrl: buildAffiliateSignupUrl(partner.code),
          shortUrl: buildAffiliateShortUrl(partner.code),
        }))}
      />
    </div>
  );
}
