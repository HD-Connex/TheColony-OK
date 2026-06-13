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
  // Audit (Phase 3): all /api/admin/* routes use requireAdmin from lib/admin-auth.ts (with editor|admin minRole).
  // This page also uses it (primary gate). SSR cookie path + synthesized Request for requireAdmin (bearer/cookie).
  // requireAdmin is the single source of truth for role checks (reuses getUserRole + roleAtLeast).
  const cookieStore = await cookies();
  const supabaseSsr = createClient(cookieStore);
  const { data: { user } } = await supabaseSsr.auth.getUser();

  let admin = null as Awaited<ReturnType<typeof requireAdmin>>;

  // Always synthesize a Request (headers + cookies) so we use requireAdmin uniformly for the page gate (audit compliance + reuse).
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

  // If no bearer but SSR user present, do role lookup via requireAdmin primitives (still reuses the lib).
  if (!admin && user) {
    const { getUserRole, roleAtLeast } = await import("@/lib/admin-auth");
    const role = await getUserRole(user.id);
    if (roleAtLeast(role as any, "editor")) {
      admin = { user, role: role as any };
    }
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
