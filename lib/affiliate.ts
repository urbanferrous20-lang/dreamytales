import "server-only";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site";
import { normalizeAffiliateCode, slugifyAffiliateCode } from "@/lib/affiliate-client";

export { normalizeAffiliateCode };

export function buildAffiliateSignupUrl(code: string): string {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new Error("Invalid affiliate code");
  return `${getSiteUrl()}/signup?ref=${encodeURIComponent(normalized)}`;
}

export function buildAffiliateShortUrl(code: string): string {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) throw new Error("Invalid affiliate code");
  return `${getSiteUrl()}/r/${encodeURIComponent(normalized)}`;
}

export async function resolveActiveAffiliateCode(
  code: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return null;

  const partner = await prisma.affiliatePartner.findFirst({
    where: { code: normalized, active: true },
    select: { code: true },
  });
  return partner?.code ?? null;
}

export async function recordAffiliateConversionOnPaidPayment(params: {
  userId: string;
  subscriptionId?: string | null;
  paymentId: string;
  amountGross: number;
}): Promise<void> {
  if (params.amountGross <= 0) return;

  try {
    const existing = await prisma.affiliateConversion.findUnique({
      where: { userId: params.userId },
    });
    if (existing) return;

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { affiliateCode: true },
    });
    if (!user?.affiliateCode) return;

    const partner = await prisma.affiliatePartner.findFirst({
      where: { code: user.affiliateCode, active: true },
    });
    if (!partner) return;

    const convertedAt = new Date();
    const payoutMonth = `${convertedAt.getFullYear()}-${String(convertedAt.getMonth() + 1).padStart(2, "0")}`;

    await prisma.affiliateConversion.create({
      data: {
        partnerId: partner.id,
        userId: params.userId,
        subscriptionId: params.subscriptionId ?? null,
        paymentId: params.paymentId,
        commissionAmount: partner.commissionAmount,
        convertedAt,
        payoutStatus: "pending",
        payoutMonth,
      },
    });
  } catch (error) {
    console.error(
      "recordAffiliateConversionOnPaidPayment failed:",
      error instanceof Error ? error.message : error
    );
  }
}

export type AffiliateMonthlyRow = {
  partnerId: string;
  code: string;
  name: string;
  contactEmail: string | null;
  conversions: number;
  commissionTotal: number;
  pendingTotal: number;
  paidTotal: number;
};

export async function getAffiliateMonthlyReport(month: string): Promise<AffiliateMonthlyRow[]> {
  const [year, monthNum] = month.split("-").map(Number);
  if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
    throw new Error("Invalid month — use YYYY-MM");
  }

  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

  const partners = await prisma.affiliatePartner.findMany({
    orderBy: { name: "asc" },
  });

  const conversions = await prisma.affiliateConversion.findMany({
    where: { convertedAt: { gte: start, lte: end } },
    include: {
      partner: { select: { id: true, code: true, name: true, contactEmail: true } },
    },
  });

  const byPartner = new Map<string, AffiliateMonthlyRow>();

  for (const partner of partners) {
    byPartner.set(partner.id, {
      partnerId: partner.id,
      code: partner.code,
      name: partner.name,
      contactEmail: partner.contactEmail,
      conversions: 0,
      commissionTotal: 0,
      pendingTotal: 0,
      paidTotal: 0,
    });
  }

  for (const conversion of conversions) {
    const row = byPartner.get(conversion.partnerId);
    if (!row) continue;
    row.conversions += 1;
    row.commissionTotal += conversion.commissionAmount;
    if (conversion.payoutStatus === "paid") {
      row.paidTotal += conversion.commissionAmount;
    } else {
      row.pendingTotal += conversion.commissionAmount;
    }
  }

  return [...byPartner.values()].sort((a, b) => b.commissionTotal - a.commissionTotal);
}

export type AffiliateConversionRow = {
  id: string;
  partnerName: string;
  partnerCode: string;
  parentEmail: string;
  parentName: string;
  commissionAmount: number;
  convertedAt: Date;
  payoutStatus: string;
  paidAt: Date | null;
};

export async function getAffiliateConversionsForMonth(month: string): Promise<AffiliateConversionRow[]> {
  const [year, monthNum] = month.split("-").map(Number);
  if (!year || !monthNum) return [];

  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999);

  const rows = await prisma.affiliateConversion.findMany({
    where: { convertedAt: { gte: start, lte: end } },
    include: {
      partner: { select: { name: true, code: true } },
      user: { select: { email: true, name: true } },
    },
    orderBy: { convertedAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    partnerName: row.partner.name,
    partnerCode: row.partner.code,
    parentEmail: row.user.email,
    parentName: row.user.name,
    commissionAmount: row.commissionAmount,
    convertedAt: row.convertedAt,
    payoutStatus: row.payoutStatus,
    paidAt: row.paidAt,
  }));
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export { currentMonthKey };
