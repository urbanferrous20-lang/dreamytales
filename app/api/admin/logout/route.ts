import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { getSiteUrl } from "@/lib/site";

export async function POST() {
  await clearAdminSessionCookie();
  return NextResponse.redirect(new URL("/admin/login", getSiteUrl()));
}
