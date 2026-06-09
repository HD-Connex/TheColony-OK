// Shared formatting helpers (no dependencies).

import type { LiveEvent } from "./live-events";

/** "1:02:03" for >= 1h, else "2:03". Accepts seconds. */
export function formatDuration(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds < 0 || !Number.isFinite(totalSeconds)) return "0:00";
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** "1H 18M" / "45M" — coarse label used in listings. */
export function formatDurationLabel(s?: number | null): string {
  if (!s || s <= 0) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}H ${String(m).padStart(2, "0")}M` : `${m}M`;
}

/** 0–100 integer percentage of position through duration. */
export function progressPercent(position?: number | null, duration?: number | null): number {
  if (!position || !duration || duration <= 0) return 0;
  return Math.min(100, Math.round((position / duration) * 100));
}

/** "MAY 28, 2026" (uppercase) from an ISO string. */
export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

/** "MAY 28" (uppercase, no year) from an ISO string. */
export function formatDateShort(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

/** "11:42 CT" or "MAY 27 · 17:20 CT" for news list datelines. */
export function formatNewsTime(iso?: string | null, includeDate = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")} CT`;
  if (!includeDate) return time;
  return `${formatDateShort(iso)} · ${time}`;
}

export type NewsDateGroup = "today" | "yesterday" | "earlier";

/** Bucket articles by calendar day relative to now. */
export function newsDateGroup(iso?: string | null, now = new Date()): NewsDateGroup {
  if (!iso) return "earlier";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "earlier";

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (d >= startOfToday) return "today";
  if (d >= startOfYesterday) return "yesterday";
  return "earlier";
}

/** "11:42 CT" style for ticker/hero. Upper + CT. */
export function formatTimeCT(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return "";
  return (
    d
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/Chicago",
      })
      .toUpperCase() + " CT"
  );
}

/** For hero dateline: "OKLAHOMA CITY · WED, JUN 4, 2026" */
export function formatHeroDateline(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  const day = d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
  return `OKLAHOMA CITY · ${day}`;
}

/** Time label for live sidebar / hero (e.g. "7:00 PM CT" or "LIVE NOW"). */
export function formatLiveWhen(e?: LiveEvent | null): string {
  if (!e) return "UPCOMING";
  if (e.status === "live") return "LIVE NOW";
  if (!e.scheduled_start) return "UPCOMING";
  const d = new Date(e.scheduled_start);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
  return `${time} CT`;
}

/** Label used for stage items (LIVE NOW / REPLAY / datestamp). */
export function whenLabel(e?: LiveEvent | null): string {
  if (!e) return "";
  const iso = e.status === "ended" ? (e.ended_at ?? e.scheduled_start) : e.scheduled_start;
  if (!iso) return e.status === "live" ? "LIVE NOW" : "";
  const d = new Date(iso)
    .toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    .toUpperCase();
  return e.status === "live" ? `LIVE NOW · ${d}` : e.status === "ended" ? `REPLAY · ${d}` : d;
}

