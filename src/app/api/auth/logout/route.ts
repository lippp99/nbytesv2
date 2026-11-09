import { logAuthEvent } from "@/lib/server/auth/auth-events";
import { clientIpKey, emailKey, isSameOrigin, logServerError } from "@/lib/server/auth/request-guard";
import { deleteCurrentSession } from "@/lib/server/auth/session";

// Relative Location keeps the user on the host they came from (localhost or the tunnel), not always APP_URL.
const toLogin = () => new Response(null, { status: 303, headers: { Location: "/login", "Cache-Control": "no-store" } });

// Plain <form method="post"> target, so it works without JS. Idempotent: always 303 to /login.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const user = await deleteCurrentSession();
    if (user) await logAuthEvent("logout", { emailHash: emailKey(user.email), ipHash: clientIpKey(request), userId: user.id });
  } catch (error) {
    // A form submit must never land on a JSON error page. The cookie is already cleared (deleteCurrentSession), so
    // this browser is signed out; the details stay in the server log.
    logServerError(error);
  }
  return toLogin();
}
