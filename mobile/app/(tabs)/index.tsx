import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EliteMobile24x7Player } from "@/components/EliteMobile24x7Player";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { APP_NAME } from "@/lib/constants";

/**
 * Home Tab — 24/7 continuous playback experience.
 *
 * This is the primary screen of the app, showing the EliteMobile24x7Player
 * front-and-center with program info overlay. Mirrors the web's homepage
 * / page which features the EliteMux24x7Player.
 *
 * Layout:
 * - Top: branded header with channel title
 * - Middle: 24/7 player (takes ~40-50% of screen)
 * - Bottom: currently playing info, upcoming queue teaser
 *
 * Error handling:
 * - Wrapped in ErrorBoundary to catch render errors
 * - Player has its own error/resilience layer
 */
export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <ErrorBoundary>
        {/* Header */}
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">{APP_NAME}</Text>
          <Text className="text-surface-400 text-xs">24/7 Oklahoma News</Text>
        </View>

        {/* Player — takes ~40% of available space */}
        <View className="flex-1 max-h-[45%] min-h-[240px]">
          <ErrorBoundary>
            <EliteMobile24x7Player showInfo={true} />
          </ErrorBoundary>
        </View>

        {/* Info area below player */}
        <View className="flex-1 px-4 pt-4">
          <CurrentProgramInfo />
        </View>
      </ErrorBoundary>
    </SafeAreaView>
  );
}

/**
 * Displays info about the currently playing program and upcoming items.
 * This is a thin wrapper; the real info comes from the player's state.
 */
function CurrentProgramInfo() {
  return (
    <View>
      <Text className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-3">
        Now Playing
      </Text>
      <Text className="text-white text-base font-semibold">
        The Colony 24/7
      </Text>
      <Text className="text-surface-400 text-sm mt-1 leading-5">
        Your source for Oklahoma news, opinion, and commentary — around the
        clock.
      </Text>
    </View>
  );
}
