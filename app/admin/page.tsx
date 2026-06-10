import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import AdminDashboard from "./_components/AdminDashboard";

/**
 * Phase 2 Admin CMS hub.
 * Server-side requireAdmin (min editor for some tabs) is the only gate that matters.
 * All sub-actions (articles, approve, live, clips mod) re-validate.
 */
export default async function AdminIndex() {
  const admin = await requireAdmin(new Request("http://local/admin"), "editor");
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

