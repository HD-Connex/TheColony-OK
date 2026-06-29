import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import type { QueueItem, Program, Episode } from "@/types";
import { buildThumbnailUrl } from "@/lib/constants";

interface ProgramCardProps {
  program: QueueItem | Program | Episode;
  onPress?: () => void;
  showCategory?: boolean;
  size?: "small" | "medium" | "large";
}

/**
 * ProgramCard — Reusable card for programs/episodes in lists.
 *
 * Shows thumbnail, title, category badge, and premium lock if applicable.
 * Used in Browse, Schedule, and Program detail screens.
 * Works with both QueueItem (from 24/7 schedule) and Program types.
 */

function isQueueItem(p: any): p is QueueItem {
  return "programId" in p && "playbackId" in p;
}

function isEpisode(p: any): p is Episode {
  return "series_id" in p;
}

function getThumbnailUrl(program: QueueItem | Program | Episode): string | null {
  if (isQueueItem(program)) {
    return program.thumbnailUrl ?? buildThumbnailUrl(program.playbackId);
  }
  if (isEpisode(program)) {
    return program.thumbnail_url ?? null;
  }
  return (program as Program).thumbnail_url ?? buildThumbnailUrl((program as Program).playback_id);
}

function getTitle(program: QueueItem | Program | Episode): string {
  if (isQueueItem(program)) return program.title;
  if (isEpisode(program)) return program.title;
  return (program as Program).title;
}

function getCategory(program: QueueItem | Program | Episode): string | null {
  if (isQueueItem(program)) return program.category;
  if (isEpisode(program)) return null;
  return (program as Program).category;
}

function isPremium(program: QueueItem | Program | Episode): boolean {
  if (isQueueItem(program)) return program.isPremium;
  if (isEpisode(program)) return program.is_premium;
  return (program as Program).is_premium;
}

export function ProgramCard({
  program,
  onPress,
  showCategory = true,
  size = "medium",
}: ProgramCardProps) {
  const thumbnailUrl = getThumbnailUrl(program);
  const title = getTitle(program);
  const category = getCategory(program);
  const premium = isPremium(program);

  const imageHeight = size === "small" ? 100 : size === "large" ? 220 : 160;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-4 active:opacity-80"
      accessibilityLabel={`${title}${premium ? ", Premium" : ""}`}
      accessibilityRole="button"
    >
      <View className="relative rounded-xl overflow-hidden bg-surface-800">
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={{ width: "100%", height: imageHeight }}
            className="bg-surface-800"
            resizeMode="cover"
          />
        ) : (
          <View
            style={{ height: imageHeight }}
            className="bg-surface-800 items-center justify-center"
          >
            <Text className="text-surface-500 text-sm">No thumbnail</Text>
          </View>
        )}

        {/* Category badge */}
        {showCategory && category && (
          <View className="absolute top-2 left-2 bg-brand-600/80 px-2 py-0.5 rounded">
            <Text className="text-white text-[10px] font-semibold uppercase tracking-wide">
              {category}
            </Text>
          </View>
        )}

        {/* Premium badge */}
        {premium && (
          <View className="absolute top-2 right-2 bg-amber-500/80 px-2 py-0.5 rounded">
            <Text className="text-white text-[10px] font-bold">Premium</Text>
          </View>
        )}
      </View>

      <View className="mt-2 px-0.5">
        <Text
          className="text-white text-sm font-semibold"
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
