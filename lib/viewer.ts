// Viewer progress — prefers the watch_progress table (RLS-protected per user) when a userId is supplied.
// Falls back to localStorage for anonymous/unauthenticated sessions (graceful degradation).
// Used by VideoPlayer / EpisodePlayer progress reporting and "Continue Watching" rails.

const KEY = 'colony:progress';

export async function saveProgress(episodeId: string, position: number, duration?: number, userId?: string | null) {
  // Persist to DB when we have an authenticated user (throttled by caller).
  if (userId) {
    try {
      const { supabaseAdmin } = await import('./supabase');
      await supabaseAdmin()
        .from('watch_progress')
        .upsert({
          user_id: userId,
          episode_id: episodeId,
          position_seconds: Math.floor(position),
          duration_seconds: duration ? Math.floor(duration) : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,episode_id' });
      return;
    } catch {
      /* fall through to localStorage */
    }
  }

  // Anonymous fallback
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    all[episodeId] = { position, duration: duration || 0, ts: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export async function getProgress(episodeId: string, userId?: string | null): Promise<number | null> {
  if (userId) {
    try {
      const { supabasePublic } = await import('./supabase'); // or admin for server contexts
      const { data } = await supabasePublic()
        .from('watch_progress')
        .select('position_seconds')
        .eq('user_id', userId)
        .eq('episode_id', episodeId)
        .maybeSingle();
      if (data?.position_seconds != null) return data.position_seconds;
    } catch {
      /* fall through */
    }
  }

  try {
    const all = JSON.parse(localStorage.getItem(KEY) || '{}');
    return all[episodeId]?.position ?? null;
  } catch {
    return null;
  }
}
