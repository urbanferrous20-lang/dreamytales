import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", getSiteUrl()));
}
