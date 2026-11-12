import { deleteCurrentAdminSession } from "@/lib/server/admin-auth/admin-session";
import { logAdminEvent } from "@/lib/server/admin-auth/audit";
import { clientIpKey, emailKey, isSameOrigin, logServerError } from "@/lib/server/auth/request-guard";

const toLogin = () => new Response(null, { status: 303, headers: { Location: "/admin/login", "Cache-Control": "no-store" } });

// Plain <form method="post"> target (works without JS). Idempotent: always 303 to /admin/login.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const admin = await deleteCurrentAdminSession();
    if (admin) await logAdminEvent("logout", { adminId: admin.id, emailHash: emailKey(admin.email), ipHash: clientIpKey(request) });
  } catch (error) {
    // The cookie is already cleared, so this browser is signed out; details stay in the server log.
    logServerError(error);
  }
  return toLogin();
}
