// Stub viewer progress (localStorage backed). Used by VideoPlayer.
const KEY = 'colony:progress';

export async function saveProgress(episodeId: string, position: number, duration?: number) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    all[episodeId] = { position, duration: duration || 0, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function getProgress(episodeId: string): number | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return all[episodeId]?.position ?? null;
  } catch { return null; }
}
