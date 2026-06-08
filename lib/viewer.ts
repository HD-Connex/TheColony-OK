// Viewer progress stub (localStorage or supabase viewer_progress).
export async function saveProgress(episodeId: string, position: number, duration: number) {
  if (typeof window === 'undefined') return;
  try {
    const key = `progress:${episodeId}`;
    localStorage.setItem(key, JSON.stringify({ position, duration, at: Date.now() }));
  } catch {}
}
export function getProgress(episodeId: string): { position: number; duration: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`progress:${episodeId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}