// Shared formatting helpers (no dependencies).

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
