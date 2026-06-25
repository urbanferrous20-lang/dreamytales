import { NextRequest, NextResponse } from "next/server";

const userProtectedPaths = ["/dashboard"];
const adminPublicPaths = ["/admin/login"];

function withPathname(response: NextResponse, pathname: string): NextResponse {
  response.headers.set("x-pathname", pathname);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isPublic = adminPublicPaths.some((p) => pathname === p);
    const adminToken = request.cookies.get("dreamy_tales_admin_session")?.value;

    if (!isPublic && !adminToken) {
      return withPathname(NextResponse.redirect(new URL("/admin/login", request.url)), pathname);
    }

    if (pathname === "/admin/login" && adminToken) {
      return withPathname(NextResponse.redirect(new URL("/admin", request.url)), pathname);
    }

    return withPathname(NextResponse.next(), pathname);
  }

  const isUserProtected = userProtectedPaths.some((p) => pathname.startsWith(p));
  if (!isUserProtected) return NextResponse.next();

  const token = request.cookies.get("dreamy_tales_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return withPathname(NextResponse.next(), pathname);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
