import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  buildAffiliateShortUrl,
  buildAffiliateSignupUrl,
} from "@/lib/affiliate";
import { normalizeAffiliateCode, slugifyAffiliateCode } from "@/lib/affiliate-client";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partners = await prisma.affiliatePartner.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { conversions: true } },
    },
  });

  return NextResponse.json({
    partners: partners.map((partner) => ({
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
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    code?: string;
    contactName?: string;
    contactEmail?: string;
    commissionAmount?: number;
    notes?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "School name is required" }, { status: 400 });
  }

  const code = normalizeAffiliateCode(body.code?.trim() || slugifyAffiliateCode(name));
  if (!code) {
    return NextResponse.json(
      { error: "Code must be lowercase letters, numbers, and hyphens (e.g. springs-primary)" },
      { status: 400 }
    );
  }

  const existing = await prisma.affiliatePartner.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: `Code "${code}" is already in use` }, { status: 409 });
  }

  const commissionAmount =
    typeof body.commissionAmount === "number" && body.commissionAmount > 0
      ? body.commissionAmount
      : 5;

  const partner = await prisma.affiliatePartner.create({
    data: {
      code,
      name,
      contactName: body.contactName?.trim() || null,
      contactEmail: body.contactEmail?.trim().toLowerCase() || null,
      commissionAmount,
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json({
    partner: {
      ...partner,
      signupUrl: buildAffiliateSignupUrl(partner.code),
      shortUrl: buildAffiliateShortUrl(partner.code),
    },
  });
}
