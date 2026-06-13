import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { isActiveMember } from "@/lib/entitlements";
import { tierLocked } from "@/lib/tiers";
import type { Article } from "@/lib/articles";
import type { VideoEpisode } from "@/lib/series";
import type { PlayableEpisode } from "@/lib/podcasts";

/**
 * Server-side content access gate.
 * Returns a gated version of the content: full for entitled, teaser + locked flag otherwise.
 * Never sends full protected body/media URLs to non-members.
 * Used in stories, shows episodes, podcasts episodes.
 */

export interface Viewer {
  userId: string | null;
  isMember: boolean;
}

export async function getViewer(): Promise<Viewer> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const isMember = user ? await isActiveMember(user.id) : false;
  return { userId: user?.id ?? null, isMember };
}

export interface GatedArticle extends Partial<Article> {
  fullBody: boolean;
  body: string | null; // full description or teaser
  locked: boolean;
}

export async function gateArticle(article: Article): Promise<GatedArticle> {
  const viewer = await getViewer();
  const locked = tierLocked(article.tier_required);
  const entitled = !locked || viewer.isMember;

  if (entitled) {
    return {
      ...article,
      fullBody: true,
      body: article.description ?? null,
      locked: false,
    };
  }

  // Teaser only
  const teaser = article.dek || (article.description ? article.description.slice(0, 400) + "..." : null);
  return {
    ...article,
    fullBody: false,
    body: teaser,
    locked: true,
    description: teaser, // for consumers
  };
}

export interface GatedEpisode {
  fullAccess: boolean;
  episode: Partial<VideoEpisode> | PlayableEpisode;
  playbackSrc?: string | null; // only if entitled
  locked: boolean;
}

export async function gateVideoEpisode(episode: VideoEpisode): Promise<GatedEpisode> {
  const viewer = await getViewer();
  const locked = tierLocked(episode.tier_required);
  const entitled = !locked || viewer.isMember;

  const gated: GatedEpisode = {
    fullAccess: entitled,
    episode: { ...episode },
    locked,
  };

  if (entitled) {
    // full playback from resolveVideo caller
    gated.playbackSrc = undefined; // resolved in page
  } else {
    // strip sensitive
    (gated.episode as any).video_url = null;
    (gated.episode as any).mux_playback_id = null;
    (gated.episode as any).description = episode.description?.slice(0, 300) + "...";
  }

  return gated;
}

export async function gatePodcastEpisode(episode: any): Promise<any> {
  const viewer = await getViewer();
  const locked = tierLocked(episode.tier_required);
  const entitled = !locked || viewer.isMember;

  if (entitled) {
    return { ...episode, fullAccess: true, locked: false };
  }

  return {
    ...episode,
    fullAccess: false,
    locked: true,
    description: episode.description?.slice(0, 300) + "...",
    audio_url: null,
    video_url: null,
    mux_playback_id: null,
  };
}
