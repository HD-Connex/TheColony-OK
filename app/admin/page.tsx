import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminDashboard from "./_components/AdminDashboard";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/**
 * Phase 2 Admin CMS hub.
 * Server-side requireAdmin (min editor for some tabs) is the only gate that matters.
 * All sub-actions (articles, approve, live, clips mod) re-validate.
 *
 * Auth flow: middleware (ssr) keeps cookies fresh. For the server page we use the
 * official @supabase/ssr server client (cookies) to resolve the user (preferred over
 * bearer-only getUserFromRequest which is for API clients that attach access_token).
 * We still call into requireAdmin logic for the role check after obtaining a user.
 */
export default async function AdminIndex() {
  // Prefer SSR cookie-based user resolution (what middleware + utils/supabase/server support).
  // This bridges the middleware session refresh to server components (unlike bearer-only path).
  const cookieStore = await cookies();
  const supabaseSsr = createClient(cookieStore);
  const { data: { user } } = await supabaseSsr.auth.getUser();

  let admin = null as Awaited<ReturnType<typeof requireAdmin>>;
  if (user) {
    // Re-use the role lookup (and minRole logic) from requireAdmin without re-parsing bearer.
    // We call getUserRole directly (it uses service role) + the roleAtLeast helper.
    // To avoid duplicating, we synthesize a minimal check here using the same primitives.
    // (requireAdmin itself stays bearer-centric for API routes per its design + auth-client localStorage.)
    const { getUserRole, roleAtLeast } = await import("@/lib/admin-auth");
    const role = await getUserRole(user.id);
    if (roleAtLeast(role as any, "editor")) {
      admin = { user, role: role as any };
    }
  }

  // Fallback: also try the legacy header reconstruction + requireAdmin (in case a Bearer was explicitly sent).
  // This keeps prior behavior for any direct API-style calls or tests.
  if (!admin) {
    const h = await headers();
    const authHeader = h.get("authorization") || "";
    const cookieHeader = h.get("cookie") || "";
    const req = new Request("http://local/admin", {
      headers: {
        ...(authHeader && { authorization: authHeader }),
        ...(cookieHeader && { cookie: cookieHeader }),
      },
    });
    admin = await requireAdmin(req, "editor");
  }

  if (!admin) {
    redirect("/?admin=denied");
  }

  return (
    <main id="main">
      <div className="container">
        <p className="page-header__eyebrow">▼ ADMIN • {admin.role.toUpperCase()}</p>
        <h1 className="page-title">The Colony — Editorial CMS</h1>
        <p className="lede">In-app tools. No external CMS. Server-only checks on every action.</p>

        <AdminDashboard currentUserRole={admin.role} />
      </div>
    </main>
  );
}
