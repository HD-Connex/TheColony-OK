import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { show_id, show_slug, slug, title, description, audio_url, video_url, thumbnail_url, duration_s, episode_no, pub_date, host_name } = body;

  if (!title || !slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 });

  const sb = supabaseAdmin();
  const guid = body.guid || `admin-${slug}-${Date.now()}`;

  const { data, error } = await sb.from("episodes").insert({
    show_id: show_id || null,
    show_slug: show_slug || null,
    slug,
    guid,
    title,
    description: description || null,
    audio_url: audio_url || null,
    video_url: video_url || null,
    thumbnail_url: thumbnail_url || null,
    duration_s: duration_s || null,
    episode_no: episode_no || null,
    host_name: host_name || null,
    pub_date: pub_date || new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, episode: data });
}

export async function GET(req: Request) {
  const auth = await requireAdmin(req, "editor");
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sb = supabaseAdmin();
  const { data: shows } = await sb.from("shows").select("id,slug,title,host,cover_url").order("title");
  return NextResponse.json({ shows: shows || [] });
}
