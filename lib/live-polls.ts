import { supabasePublic } from "./supabase";
import type { Poll } from "@/app/_components/LivePoll";

export async function getActivePoll(liveEventId: string | null): Promise<Poll | null> {
  const sb = supabasePublic();
  let query = sb
    .from("live_polls")
    .select("id,live_event_id,question,options,is_active,closes_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (liveEventId) {
    query = query.eq("live_event_id", liveEventId);
  } else {
    query = query.is("live_event_id", null);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;

  const raw = data as {
    id: string;
    live_event_id: string | null;
    question: string;
    options: string[] | Array<{ label: string }>;
    is_active: boolean;
    closes_at: string | null;
  };

  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => (typeof o === "string" ? o : o.label))
    : [];

  return {
    id: raw.id,
    live_event_id: raw.live_event_id,
    question: raw.question,
    options,
    is_active: raw.is_active,
    closes_at: raw.closes_at,
  };
}

/** Client-side fetch for LiveStage poll refresh */
export async function getActivePollClient(liveEventId: string | null): Promise<Poll | null> {
  const { supabaseBrowser } = await import("./auth-client");
  const sb = supabaseBrowser();
  let query = sb
    .from("live_polls")
    .select("id,live_event_id,question,options,is_active,closes_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (liveEventId) {
    query = query.eq("live_event_id", liveEventId);
  } else {
    query = query.is("live_event_id", null);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;

  const raw = data as {
    id: string;
    live_event_id: string | null;
    question: string;
    options: string[] | Array<{ label: string }>;
    is_active: boolean;
    closes_at: string | null;
  };

  const options = Array.isArray(raw.options)
    ? raw.options.map((o) => (typeof o === "string" ? o : o.label))
    : [];

  return {
    id: raw.id,
    live_event_id: raw.live_event_id,
    question: raw.question,
    options,
    is_active: raw.is_active,
    closes_at: raw.closes_at,
  };
}