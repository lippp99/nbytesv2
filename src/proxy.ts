import { type NextRequest, NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/admin-auth/admin-auth-contract";
import { NEXT_PATH_HEADER, sessionCookieName } from "@/lib/auth/auth-contract";

/**
 * Optimistic checks only (the cookie, not the database):
 * - admin pages without the admin cookie -> /admin/login. The real check is getCurrentAdmin in the admin layout.
 * - dashboard pages without the session cookie -> /login?next=<path>. The real check is getCurrentUser.
 * Neither login page is ever redirected here: a stale cookie would loop.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login" || request.cookies.has(adminSessionCookieName())) return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (request.cookies.has(sessionCookieName())) {
    // Set (not append), so a client-sent value never reaches the page; getCurrentUser still filters it.
    const headers = new Headers(request.headers);
    headers.set(NEXT_PATH_HEADER, pathname);
    return NextResponse.next({ request: { headers } });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

// Literal list (matchers are read at build time); keep in sync with DASHBOARD_PATHS in auth-contract.
// "/models" is exact on purpose: public/models/*.svg (the provider logos on the landing) share that prefix and must
// never be redirected to /login. Add "/models/:path*" back only with an exclusion for files.
// "/admin/:path*" also matches "/admin" itself; /api/admin is not matched (its handlers check the session).
export const config = {
  matcher: [
    "/quick-start/:path*", "/playground/:path*", "/docs/:path*", "/usage/:path*",
    "/api-keys/:path*", "/models", "/billing/:path*", "/settings/:path*", "/sessions/:path*", "/admin/:path*",
  ],
};
