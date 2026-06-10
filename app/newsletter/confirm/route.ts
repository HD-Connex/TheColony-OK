import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.redirect("/?newsletter=badtoken");

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("newsletter_subscribers")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("token", token)
    .select("email")
    .maybeSingle();

  if (data) {
    return NextResponse.redirect("/?newsletter=confirmed");
  }
  return NextResponse.redirect("/?newsletter=notfound");
}
