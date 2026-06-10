import { NextResponse } from "next/server";
import { rateLimit, keyFromRequest, tooManyRequests } from "@/lib/rate-limit";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize";
import { supabaseAdmin } from "@/lib/supabase";
import { sendTipAckEmail } from "@/lib/email";

export const runtime = "nodejs";

interface TipBody {
  kind?: "tip" | "newsletter";
  tip?: string; // for tips
  body?: string; // generic
  contact?: string; // optional reply-to / email
  email?: string; // for newsletter
}

function isEmail(v?: string): boolean {
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function POST(req: Request) {
  const rl = await rateLimit(keyFromRequest(req, "tips"), { limit: 5, windowSec: 3600 });
  if (!rl.ok) return tooManyRequests(rl);

  let body: TipBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const kind: "tip" | "newsletter" = body.kind === "newsletter" ? "newsletter" : "tip";
  const rawBody = (body.tip ?? body.body ?? "").toString().trim();
  if (!rawBody || rawBody.length < 3) {
    return NextResponse.json({ error: "Message body is required." }, { status: 400 });
  }

  const contact = (body.contact ?? body.email ?? "").toString().trim().toLowerCase();
  const safeBody = sanitizeHtml(rawBody).slice(0, 8000);
  const plain = stripHtml(rawBody).slice(0, 2000);

  const { error } = await supabaseAdmin().from("tips").insert({
    kind,
    email: isEmail(contact) ? contact : null,
    body: safeBody || plain,
    contact: contact || null,
    metadata: {
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] || null,
      ua: req.headers.get("user-agent") || null,
    },
  });

  if (error) {
    console.error("[tips] insert error", error.message);
    return NextResponse.json({ error: "Could not store submission." }, { status: 503 });
  }

  // Ack email only if we have a real address (best effort, never blocks response)
  if (isEmail(contact)) {
    await sendTipAckEmail(contact, { kind, contact });
  }

  return NextResponse.json({ ok: true, kind }, { status: 201 });
}
