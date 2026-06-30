import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { supabase } from "@/lib/supabase";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton, ProgramCardSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ProgramCard } from "@/components/ProgramCard";
import type { Series, Episode } from "@/types";

/**
 * Series Detail screen.
 *
 * Shows a series (show/podcast) with its episodes.
 * Mirrors the web's /shows/[slug] and /podcasts/[slug] pages.
 */
export default function SeriesDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeries = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const [seriesRes, episodesRes] = await Promise.all([
        supabase.from("series").select("*").eq("slug", slug).maybeSingle(),
        supabase
          .from("video_episodes")
          .select("*, series:series!inner(slug)")
          .eq("series.slug", slug)
          .order("published_at", { ascending: false }),
      ]);

      if (seriesRes.error) throw seriesRes.error;
      setSeries(seriesRes.data as Series | null);

      const episodesData = (episodesRes.data ?? []) as any[];
      setEpisodes(
        episodesData.map((ep) => ({
          ...ep,
          series_slug: slug,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load series");
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // --- Loading ---
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 pt-4">
          <Skeleton height={200} borderRadius={12} />
          <View className="mt-4">
            {[1, 2, 3].map((i) => (
              <ProgramCardSkeleton key={i} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <ErrorState title="Couldn't load series" message={error} onRetry={fetchSeries} />
      </SafeAreaView>
    );
  }

  // --- Not found ---
  if (!series) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg font-semibold mb-2">
            Series not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-brand-400">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <Stack.Screen options={{ title: series.title }} />
      <ErrorBoundary>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        // @ts-ignore
        <FlashList
          data={episodes}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View className="mb-4">
              {/* Hero */}
              <View className="w-full h-48 bg-surface-800">
                {series.poster_url ? (
                  <Image
                    source={{ uri: series.poster_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-surface-500 text-lg">
                      {series.title[0]}
                    </Text>
                  </View>
                )}
              </View>
              <View className="px-4 pt-4">
                <Text className="text-white text-xl font-bold mb-1">
                  {series.title}
                </Text>
                <View className="flex-row items-center mb-3">
                  <View className="bg-brand-600/20 px-2 py-0.5 rounded">
                    <Text className="text-brand-400 text-xs font-semibold uppercase">
                      {series.pillar}
                    </Text>
                  </View>
                  {episodes.length > 0 && (
                    <Text className="text-surface-500 text-xs ml-3">
                      {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
                {series.description && (
                  <Text className="text-surface-300 text-sm leading-6 mb-4">
                    {series.description}
                  </Text>
                )}
              </View>
            </View>
          }
          renderItem={({ item }: any) => (
            <View className="px-4">
              <ProgramCard
                program={item}
                onPress={() => router.push(`/episode/${item.id}`)}
                size="small"
                showCategory={false}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              icon="🎙"
              title="No episodes yet"
              message="Check back soon for new episodes."
            />
          }
        />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
