import React, { useCallback } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { use24x7Schedule } from "@/hooks/use24x7Schedule";
import { ScheduleList } from "@/components/ScheduleList";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";
import { ScheduleListSkeleton } from "@/components/LoadingSkeleton";
import { NetworkStatusBar } from "@/components/NetworkStatusBar";
import type { QueueItem } from "@/types";

/**
 * Schedule Tab — Full 24/7 program schedule.
 *
 * Mirrors the web's schedule view (derived from current_program + upcoming_queue).
 * Shows the currently-playing program highlighted, followed by the full upcoming queue.
 * Updates in real-time via Supabase Realtime (same subscription as the player).
 *
 * Data source: Same use24x7Schedule hook used by EliteMobile24x7Player.
 * Tapping a program opens the full-screen player for that item.
 */
export default function ScheduleScreen() {
  const { current, upcoming, isLoading, error, refresh } = use24x7Schedule();

  const handleProgramPress = useCallback(
    (item: QueueItem) => {
      router.push(`/player/${item.programId}`);
    },
    []
  );

  // --- Loading State ---
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Schedule</Text>
          <Text className="text-surface-400 text-xs">24/7 Program Guide</Text>
        </View>
        <ScheduleListSkeleton />
      </SafeAreaView>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Schedule</Text>
        </View>
        <ErrorState
          title="Couldn't load schedule"
          message={
            error === "stale"
              ? "Showing cached schedule. Pull down to refresh."
              : error
          }
          onRetry={refresh}
        />
      </SafeAreaView>
    );
  }

  // --- Empty State ---
  if (!current && upcoming.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Schedule</Text>
          <Text className="text-surface-400 text-xs">24/7 Program Guide</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg font-semibold text-center mb-2">
            No programs scheduled
          </Text>
          <Text className="text-surface-400 text-sm text-center">
            The 24/7 schedule is empty. Check back later for upcoming programs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <ErrorBoundary>
        {/* Header */}
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Schedule</Text>
          <Text className="text-surface-400 text-xs">24/7 Program Guide</Text>
        </View>

        {/* Schedule list — item count for context */}
        {upcoming.length > 0 && (
          <View className="px-4 pb-2">
            <Text className="text-surface-500 text-xs">
              {upcoming.length} program{upcoming.length !== 1 ? "s" : ""} upcoming
            </Text>
          </View>
        )}

        {/* Schedule FlashList */}
        <ScheduleList
          current={current}
          upcoming={upcoming}
          onProgramPress={handleProgramPress}
        />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
