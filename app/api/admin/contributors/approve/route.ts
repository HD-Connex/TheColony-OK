import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendContributorApprovedEmail } from "@/lib/email";

/**
 * Admin (editor+) approves a pending contributor application.
 * - Creates/updates contributors row (active).
 * - Links to members.user_id if we can resolve by email (sets role='contributor').
 * - Sends approval email (template already exists).
 * - Idempotent-ish.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { applicationId?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const appId = body.applicationId;
  if (!appId) return NextResponse.json({ error: "applicationId required" }, { status: 400 });

  const sb = supabaseAdmin();

  const { data: app, error: appErr } = await sb
    .from("contributor_applications")
    .select("*")
    .eq("id", appId)
    .maybeSingle();

  if (appErr || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (app.status === "approved") {
    return NextResponse.json({ ok: true, already: true });
  }

  // Create or update contributor profile
  const slugBase = (app.slug || app.name || "contributor").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slug = slugBase || `contrib-${Date.now()}`;

  const { data: contrib, error: cErr } = await sb
    .from("contributors")
    .upsert(
      {
        slug,
        name: app.name,
        tier: app.tier || "contributor",
        role: app.role || null,
        headshot_url: app.headshot_url || null,
        bio: app.bio || null,
        website: app.website || null,
        email: app.email,
        x_handle: app.x_handle || null,
        status: "active",
        // user_id will be linked below if we find a members row
      },
      { onConflict: "slug" },
    )
    .select("id, slug, name, email")
    .single();

  if (cErr || !contrib) {
    return NextResponse.json({ error: "Failed to create contributor profile" }, { status: 500 });
  }

  // Link application
  await sb.from("contributor_applications").update({ status: "approved", notes: body.notes || null }).eq("id", appId);

  // Try to promote any matching member (by email) to contributor role
  const { data: member } = await sb
    .from("members")
    .select("user_id, email")
    .eq("email", app.email.toLowerCase())
    .maybeSingle();

  if (member?.user_id) {
    await sb
      .from("members")
      .update({ role: "contributor", updated_at: new Date().toISOString() })
      .eq("user_id", member.user_id);

    // Also link the contributors.user_id for future scoped access
    await sb.from("contributors").update({ user_id: member.user_id }).eq("id", contrib.id);
  }

  // Send the approval email (best effort)
  if (app.email) {
    await sendContributorApprovedEmail(app.email, {
      name: app.name,
      tier: app.tier || "contributor",
    });
  }

  return NextResponse.json({ ok: true, contributor: { id: contrib.id, slug: contrib.slug } });
}
