import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/LoadingSkeleton";
import { buildThumbnailUrl } from "@/lib/constants";
import type { Program } from "@/types";

/**
 * Program Detail screen.
 *
 * Shows detailed information about a single program.
 * Mirrors the web's program detail view (typically a modal or page).
 * Tapping "Watch" opens the full-screen player.
 */
export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (err) throw err;
      setProgram(data as Program | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load program");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  // --- Loading ---
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="flex-1 px-4 pt-4">
          <Skeleton height={220} borderRadius={12} />
          <View className="mt-4">
            <Skeleton height={24} width="75%" borderRadius={4} />
            <View className="mt-2">
              <Skeleton height={14} width="40%" borderRadius={4} />
            </View>
            <View className="mt-4">
              <Skeleton height={80} borderRadius={4} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <ErrorState title="Couldn't load program" message={error} onRetry={fetchProgram} />
      </SafeAreaView>
    );
  }

  // --- Not found ---
  if (!program) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg font-semibold mb-2">
            Program not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-brand-400">Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const thumbnailUrl =
    program.thumbnail_url ?? buildThumbnailUrl(program.playback_id);

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <Stack.Screen options={{ title: program.title }} />
      <ErrorBoundary>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Hero thumbnail */}
          <View className="w-full h-56 bg-surface-800">
            {thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-surface-500">No thumbnail</Text>
              </View>
            )}

            {/* Overlay gradient effect */}
            <View className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-950/80 to-transparent" />

            {/* Watch button */}
            <TouchableOpacity
              onPress={() => router.push(`/player/${program.id}`)}
              className="absolute bottom-4 left-4 right-4 bg-brand-600 rounded-xl py-3 items-center active:bg-brand-700"
              accessibilityRole="button"
            >
              <Text className="text-white font-bold text-base">▶ Watch Now</Text>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View className="px-4 pt-4">
            {/* Title & meta */}
            <Text className="text-white text-xl font-bold mb-1">
              {program.title}
            </Text>
            <View className="flex-row items-center mb-3">
              <View className="bg-brand-600/20 px-2 py-0.5 rounded">
                <Text className="text-brand-400 text-xs font-semibold uppercase tracking-wide">
                  {program.category}
                </Text>
              </View>
              {program.duration_seconds && (
                <Text className="text-surface-500 text-xs ml-3">
                  {formatDuration(program.duration_seconds)}
                </Text>
              )}
              {program.is_premium && (
                <View className="ml-2 bg-amber-500/20 px-2 py-0.5 rounded">
                  <Text className="text-amber-400 text-xs font-bold">
                    Premium
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {program.description && (
              <Text className="text-surface-300 text-sm leading-6 mb-4">
                {program.description}
              </Text>
            )}

            {/* Tags */}
            {program.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                {program.tags.map((tag, i) => (
                  <View
                    key={`${tag}-${i}`}
                    className="bg-surface-800 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-surface-400 text-xs">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
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
