import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { safeCompare } from "@/lib/safe-compare";
import { log } from "@/lib/log";

export const runtime = "nodejs";

/**
 * Supabase Auth → members sync (identity only).
 *
 * This codebase keys entitlement on the `members` table (user_id = auth.users.id),
 * created lazily on checkout. There is no separate `profiles` table, so this hook
 * only mirrors identity fields (user_id, email) and never touches billing columns
 * (is_member, status, tier, stripe_*) — those stay owned by the Stripe webhook.
 *
 * Configure in Supabase → Database Webhooks on `auth` table (INSERT/UPDATE/DELETE).
 * Sends HMAC-SHA256 signature of the body in the `supabase-signature` header.
 * Env: SUPABASE_WEBHOOK_SECRET.
 *
 * Note: members.user_id is ON DELETE CASCADE from auth.users, so user.deleted is
 * largely handled by the DB; the explicit delete here is a belt-and-suspenders.
 */
export async function POST(req: Request) {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  const sig = req.headers.get("supabase-signature");

  if (process.env.NODE_ENV === "production" && !secret) {
    log.error("[supabase webhook] SUPABASE_WEBHOOK_SECRET not set in production — rejecting");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();

  if (secret) {
    if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    const provided = sig.includes("=") ? sig.split("=").pop()! : sig;
    if (!safeCompare(digest, provided)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    log.warn("[supabase webhook] no SUPABASE_WEBHOOK_SECRET set — skipping verification (dev only)");
  }

  let event: { type?: string; record?: { id?: string; email?: string } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { type, record } = event;
  if (!record?.id) return NextResponse.json({ ok: true });

  const sb = supabaseAdmin();
  const now = new Date().toISOString();

  try {
    // Database Webhook event types from auth table: INSERT, UPDATE, DELETE
    // Also accept legacy Auth Hook types: user.created, user.updated, user.deleted
    const isInsertOrUpdate = type === "INSERT" || type === "UPDATE" || type === "user.created" || type === "user.updated";
    const isDelete = type === "DELETE" || type === "user.deleted";

    if (isInsertOrUpdate) {
      // Identity only — onConflict update leaves billing columns untouched.
      const { error } = await sb
        .from("members")
        .upsert(
          { user_id: record.id, email: record.email ?? null, updated_at: now },
          { onConflict: "user_id" },
        );
      if (error) {
        log.error("[supabase webhook] members upsert failed", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
      }
    } else if (isDelete) {
      const { error } = await sb.from("members").delete().eq("user_id", record.id);
      if (error) {
        log.error("[supabase webhook] members delete failed", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      }
    }
  } catch (e) {
    log.error("[supabase webhook] handler error", e);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
