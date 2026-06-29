import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton, PlayerSkeleton } from "@/components/LoadingSkeleton";
import { buildHlsUrl, buildThumbnailUrl } from "@/lib/constants";
import type { Episode } from "@/types";

/**
 * Episode Detail screen.
 *
 * Shows a single video/podcast episode with its player and metadata.
 * Mirrors the web's /shows/[slug]/[ep] pages.
 * For video episodes, plays HLS from Mux.
 * For audio episodes, shows a simple audio player (future: background audio).
 */
export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisode = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("video_episodes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (err) throw err;
      setEpisode(data as Episode | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load episode");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEpisode();
  }, [fetchEpisode]);

  // --- Loading ---
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <PlayerSkeleton />
        <View className="px-4 pt-4">
          <Skeleton height={24} width="80%" borderRadius={4} />
          <View className="mt-2">
            <Skeleton height={14} width="50%" borderRadius={4} />
          </View>
          <View className="mt-4">
            <Skeleton height={60} borderRadius={4} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <ErrorState title="Couldn't load episode" message={error} onRetry={fetchEpisode} />
      </SafeAreaView>
    );
  }

  // --- Not found ---
  if (!episode) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg font-semibold mb-2">
            Episode not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-brand-400">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Build video source (same resolution chain as web's lib/series.ts resolveVideo)
  const videoSource = episode.mux_playback_id
    ? buildHlsUrl(episode.mux_playback_id)
    : episode.video_url ?? null;

  const thumbnailUrl =
    episode.thumbnail_url ??
    (episode.mux_playback_id
      ? buildThumbnailUrl(episode.mux_playback_id)
      : null);

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <Stack.Screen options={{ title: episode.title }} />
      <ErrorBoundary>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Video player */}
          <View className="w-full h-56 bg-black">
            {videoSource ? (
              <VideoPlayer
                source={videoSource}
                title={episode.title}
                isLive={false}
                autoPlay={true}
                allowsPiP={true}
              />
            ) : episode.audio_url ? (
              // Audio-only episode — show thumbnail as placeholder
              <View className="flex-1 items-center justify-center bg-surface-900">
                {thumbnailUrl ? (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-surface-500 text-4xl">🎵</Text>
                )}
                <View className="absolute bottom-4 left-4 right-4 items-center">
                  <Text className="text-white text-sm font-semibold">
                    Audio-only episode
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center bg-surface-900">
                <Text className="text-surface-500">No playback available</Text>
              </View>
            )}
          </View>

          {/* Episode details */}
          <View className="px-4 pt-4">
            <Text className="text-white text-lg font-bold mb-1">
              {episode.title}
            </Text>
            {episode.description && (
              <Text className="text-surface-300 text-sm leading-6 mt-2">
                {episode.description}
              </Text>
            )}

            {/* Meta */}
            <View className="flex-row items-center mt-3">
              {episode.duration_seconds && (
                <Text className="text-surface-500 text-xs">
                  {formatDuration(episode.duration_seconds)}
                </Text>
              )}
              {episode.is_premium && (
                <View className="ml-2 bg-amber-500/20 px-2 py-0.5 rounded">
                  <Text className="text-amber-400 text-xs font-bold">
                    Premium
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </ErrorBoundary>
    </SafeAreaView>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}
