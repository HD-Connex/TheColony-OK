import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { safeCompare } from "@/lib/safe-compare";
import { log } from "@/lib/log";

export const runtime = "nodejs";

/**
 * Resend delivery-event webhook → keeps newsletter_subscribers health in sync.
 * - email.delivered  → confirm (set confirmed_at if not already)
 * - email.bounced    → soft-disable (set unsubscribed_at)
 * - email.complained → soft-disable (set unsubscribed_at)
 *
 * Resend signs via Svix. We verify the Svix scheme directly (no SDK version
 * coupling): signedContent = `${id}.${timestamp}.${body}`, HMAC-SHA256 with the
 * base64 secret (the part after `whsec_`), compared constant-time against the
 * `v1,<sig>` entries in the signature header.
 *
 * Env: RESEND_WEBHOOK_SECRET (the `whsec_...` signing secret from Resend).
 */
function verifySvix(body: string, headers: Headers, secret: string): boolean {
  const id = headers.get("svix-id") ?? headers.get("webhook-id");
  const timestamp = headers.get("svix-timestamp") ?? headers.get("webhook-timestamp");
  const sigHeader = headers.get("svix-signature") ?? headers.get("webhook-signature");
  if (!id || !timestamp || !sigHeader) return false;

  const key = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let keyBytes: Buffer;
  try {
    keyBytes = Buffer.from(key, "base64");
  } catch {
    return false;
  }

  const signedContent = `${id}.${timestamp}.${body}`;
  const expected = createHmac("sha256", keyBytes).update(signedContent).digest("base64");

  // Header is space-separated list of `v1,<base64sig>` entries.
  for (const part of sigHeader.split(" ")) {
    const [, sig] = part.split(",");
    if (sig && safeCompare(sig, expected)) return true;
  }
  return false;
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (process.env.NODE_ENV === "production" && !secret) {
    log.error("[resend] RESEND_WEBHOOK_SECRET not set in production — rejecting webhook");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();

  if (secret) {
    if (!verifySvix(body, req.headers, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    log.warn("[resend] no RESEND_WEBHOOK_SECRET set — skipping signature verification (dev only)");
  }

  let event: { type?: string; data?: { to?: string[] } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = event.data?.to?.[0];
  if (!email) {
    log.warn("[resend] no recipient email in event");
    return NextResponse.json({ ok: true });
  }

  const sb = supabaseAdmin();
  const now = new Date().toISOString();

  try {
    switch (event.type) {
      case "email.delivered":
        await sb
          .from("newsletter_subscribers")
          .update({ confirmed_at: now, updated_at: now })
          .eq("email", email)
          .is("confirmed_at", null);
        break;
      case "email.bounced":
      case "email.complained":
        await sb
          .from("newsletter_subscribers")
          .update({ unsubscribed_at: now, updated_at: now })
          .eq("email", email);
        log.warn(`[resend] soft-disabled ${email} (${event.type})`);
        break;
      default:
        log.debug(`[resend] unhandled event type: ${event.type}`);
        break;
    }
  } catch (e) {
    log.error("[resend] handler error", e);
  }

  return NextResponse.json({ ok: true });
}
