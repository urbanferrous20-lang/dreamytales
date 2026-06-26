import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSession,
  getAdminPasswordConfigError,
  isAdminPasswordConfigured,
  setAdminSessionCookie,
  verifyAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    const configError = getAdminPasswordConfigError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 503 });
    }

    if (!isAdminPasswordConfigured()) {
      return NextResponse.json(
        {
          error:
            "Admin login is not configured on the server. Set ADMIN_PASSWORD in httpdocs/.env",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const valid = await verifyAdminCredentials(email, password);
    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Invalid admin credentials. Use /admin/login with ADMIN_EMAIL and ADMIN_PASSWORD from the server .env file.",
        },
        { status: 401 }
      );
    }

    const token = await createAdminSession(email);
    await setAdminSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
