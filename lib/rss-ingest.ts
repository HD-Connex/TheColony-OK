import "server-only";
import { XMLParser } from "fast-xml-parser";
import { supabaseAdmin } from "./supabase";
import { withRetry } from "./jobs";

export interface RssItem {
  title: string;
  description: string | null;
  guid: string;
  audioUrl: string | null;
  videoUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
}

export interface IngestReport {
  show: string;
  new: number;
  error?: string;
}

export interface IngestResult {
  ok: true;
  totalNew: number;
  report: IngestReport[];
}

/** Parse RSS/Atom XML into normalized episode items. */
export function parseRssItems(xml: string): RssItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const channel = extractChannel(doc);
  if (!channel) return [];

  const rawItems = channel.item ?? channel.entry;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return items.map((item) => normalizeItem(item as Record<string, unknown>)).filter(Boolean) as RssItem[];
}

function extractChannel(doc: Record<string, unknown>): Record<string, unknown> | null {
  const rss = doc.rss as Record<string, unknown> | undefined;
  if (rss?.channel) return rss.channel as Record<string, unknown>;
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (feed) return feed;
  return null;
}

function normalizeItem(item: Record<string, unknown>): RssItem | null {
  const title = textVal(item.title) ?? "Untitled episode";
  const guid =
    textVal(item.guid) ??
    textVal((item.guid as Record<string, unknown> | undefined)?.["#text"]) ??
    textVal(item.id) ??
    textVal(item.link) ??
    slugify(title);

  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  const enclosureUrl = typeof enclosure?.["@_url"] === "string" ? enclosure["@_url"] : null;
  const enclosureType = typeof enclosure?.["@_type"] === "string" ? enclosure["@_type"] : "";

  let audioUrl: string | null = null;
  let videoUrl: string | null = null;
  if (enclosureUrl) {
    if (enclosureType.startsWith("video/")) videoUrl = enclosureUrl;
    else audioUrl = enclosureUrl;
  }

  const itunesVideo = textVal(item["itunes:video"]);
  if (itunesVideo) videoUrl = itunesVideo;

  const pubDate =
    textVal(item.pubDate) ??
    textVal(item.published) ??
    textVal(item.updated) ??
    null;

  const description =
    textVal(item.description) ??
    textVal(item["itunes:summary"]) ??
    textVal(item.summary) ??
    null;

  return {
    title: decodeEntities(title),
    description: description ? decodeEntities(stripTags(description)) : null,
    guid,
    audioUrl,
    videoUrl,
    durationSeconds: parseDuration(textVal(item["itunes:duration"])),
    publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
  };
}

function textVal(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && v !== null && "#text" in v) {
    const t = (v as Record<string, unknown>)["#text"];
    return typeof t === "string" ? t.trim() || null : null;
  }
  return null;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function parseDuration(raw: string | null): number | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const parts = raw.split(":").map((p) => parseInt(p, 10));
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
}

/** Poll every active show with an `rss_url` and upsert new podcast episodes. */
export async function ingestPodcastFeeds(): Promise<IngestResult> {
  const sb = supabaseAdmin();
  const { data: shows, error } = await sb
    .from("shows")
    .select("id,slug,title,rss_url,fail_count")
    .eq("active", true)
    .not("rss_url", "is", null);

  if (error) throw new Error(error.message);

  let added = 0;
  const report: IngestReport[] = [];

  for (const show of shows ?? []) {
    if (!show.rss_url) continue;
    try {
      const xml = await withRetry(async () => {
        const res = await fetch(show.rss_url, {
          headers: { "user-agent": "TheColonyOK/1.0 RSS" },
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      }, { attempts: 2 });
      const items = parseRssItems(xml);

      let showNew = 0;
      for (const item of items) {
        const slug = slugify(item.title);
        const { data: existing } = await sb
          .from("episodes")
          .select("id")
          .eq("show_slug", show.slug)
          .eq("guid", item.guid)
          .maybeSingle();

        if (existing) continue;

        const { error: insertErr } = await sb.from("episodes").insert({
          show_id: show.id,
          show_slug: show.slug,
          guid: item.guid,
          slug,
          title: item.title,
          description: item.description,
          audio_url: item.audioUrl,
          video_url: item.videoUrl,
          duration_s: item.durationSeconds,
          pub_date: item.publishedAt ?? new Date().toISOString(),
        });

        if (!insertErr) showNew++;
      }

      added += showNew;
      report.push({ show: show.title, new: showNew });

      await sb
        .from("shows")
        .update({
          last_polled: new Date().toISOString(),
          last_status: "ok",
          fail_count: 0,
        })
        .eq("id", show.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed";
      report.push({ show: show.title, new: 0, error: message });
      await sb
        .from("shows")
        .update({
          last_polled: new Date().toISOString(),
          last_status: message,
          fail_count: (show.fail_count ?? 0) + 1,
        })
        .eq("id", show.id);
    }
  }

  return { ok: true, totalNew: added, report };
}