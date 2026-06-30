import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    contactName?: string;
    contactEmail?: string;
    commissionAmount?: number;
    active?: boolean;
    notes?: string;
  };

  const data: {
    name?: string;
    contactName?: string | null;
    contactEmail?: string | null;
    commissionAmount?: number;
    active?: boolean;
    notes?: string | null;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.contactName !== undefined) data.contactName = body.contactName.trim() || null;
  if (body.contactEmail !== undefined) data.contactEmail = body.contactEmail.trim().toLowerCase() || null;
  if (body.commissionAmount !== undefined) {
    if (body.commissionAmount <= 0) {
      return NextResponse.json({ error: "Commission must be greater than zero" }, { status: 400 });
    }
    data.commissionAmount = body.commissionAmount;
  }
  if (body.active !== undefined) data.active = body.active;
  if (body.notes !== undefined) data.notes = body.notes.trim() || null;

  try {
    const partner = await prisma.affiliatePartner.update({
      where: { id },
      data,
    });
    return NextResponse.json({ partner });
  } catch {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const conversionCount = await prisma.affiliateConversion.count({ where: { partnerId: id } });
  if (conversionCount > 0) {
    await prisma.affiliatePartner.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ deactivated: true, message: "Partner deactivated (has conversion history)" });
  }

  try {
    await prisma.affiliatePartner.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }
}
