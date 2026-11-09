import { type NextRequest, NextResponse } from "next/server";
import { NEXT_PATH_HEADER, sessionCookieName } from "@/lib/auth/auth-contract";

/**
 * Optimistic check only: no session cookie on a dashboard page -> /login?next=<path>. The real check (database)
 * is getCurrentUser in the dashboard layout. /login is never redirected here: a stale cookie would loop.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(sessionCookieName())) {
    // Set (not append), so a client-sent value never reaches the page; getCurrentUser still filters it.
    const headers = new Headers(request.headers);
    headers.set(NEXT_PATH_HEADER, request.nextUrl.pathname);
    return NextResponse.next({ request: { headers } });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

// Literal list (matchers are read at build time); keep in sync with DASHBOARD_PATHS in auth-contract.
// "/models" is exact on purpose: public/models/*.svg (the provider logos on the landing) share that prefix and must
// never be redirected to /login. Add "/models/:path*" back only with an exclusion for files.
export const config = {
  matcher: [
    "/quick-start/:path*", "/playground/:path*", "/docs/:path*", "/usage/:path*",
    "/api-keys/:path*", "/models", "/billing/:path*", "/settings/:path*", "/sessions/:path*",
  ],
};
