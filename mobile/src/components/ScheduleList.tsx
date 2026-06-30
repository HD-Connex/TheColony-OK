import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { QueueItem } from "@/types";
import { buildThumbnailUrl } from "@/lib/constants";

interface ScheduleListProps {
  current: QueueItem | null;
  upcoming: QueueItem[];
  onProgramPress: (item: QueueItem, index: number) => void;
}

/**
 * ScheduleList — Renders the 24/7 schedule as a performant FlashList.
 */
export function ScheduleList({
  current,
  upcoming,
  onProgramPress,
}: ScheduleListProps) {
  const items: (QueueItem & { isCurrent?: boolean })[] = [
    ...(current ? [{ ...current, isCurrent: true }] : []),
    ...upcoming.map((item) => ({ ...item, isCurrent: false })),
  ];

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Text className="text-surface-400 text-sm">
          No programs scheduled
        </Text>
      </View>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // @ts-ignore
  return (
    <FlashList
      data={items}
      keyExtractor={(item, index) => `${item.programId}-${index}`}
      renderItem={({ item, index }: any) => (
        <ScheduleRow
          item={item}
          index={index}
          isCurrent={item.isCurrent ?? false}
          onPress={() => onProgramPress(item, index)}
        />
      )}
      contentContainerStyle={styles.listContent}
    />
  );
}  // <-- ✅ Added this closing brace!

interface ScheduleRowProps {
  item: QueueItem;
  index: number;
  isCurrent: boolean;
  onPress: () => void;
}

function ScheduleRow({ item, index, isCurrent, onPress }: ScheduleRowProps) {
  const thumbnailUrl =
    item.thumbnailUrl ?? buildThumbnailUrl(item.playbackId);

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row mb-3 rounded-xl overflow-hidden ${
        isCurrent ? "bg-brand-600/20 border border-brand-500/40" : "bg-surface-800"
      }`}
      accessibilityLabel={`${isCurrent ? "Now playing: " : ""}${item.title}`}
      accessibilityRole="button"
    >
      <View className="w-28 h-20">
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-surface-700 items-center justify-center">
            <Text className="text-surface-500 text-[10px]">No img</Text>
          </View>
        )}
        <View className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded">
          <Text className="text-white text-[10px] font-medium">
            {isCurrent ? "NOW" : `#${index}`}
          </Text>
        </View>
      </View>

      <View className="flex-1 px-3 py-2 justify-center">
        <Text
          className={`text-sm font-semibold ${
            isCurrent ? "text-brand-400" : "text-white"
          }`}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View className="flex-row items-center mt-1">
          {item.category ? (
            <Text className="text-surface-400 text-[11px] uppercase tracking-wide mr-2">
              {item.category}
            </Text>
          ) : null}
          {item.duration > 0 && (
            <Text className="text-surface-500 text-[11px]">
              {formatDuration(item.duration)}
            </Text>
          )}
        </View>
        {item.isPremium && (
          <Text className="text-amber-500 text-[10px] font-semibold mt-0.5">
            Premium
          </Text>
        )}
      </View>

      {isCurrent && (
        <View className="pr-3 justify-center">
          <View style={styles.playingIndicator}>
            <View style={styles.playingBar} />
            <View style={[styles.playingBar, { height: 12 }]} />
            <View style={styles.playingBar} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  playingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    gap: 2,
  },
  playingBar: {
    width: 3,
    height: 8,
    backgroundColor: "#0c8ee7",
    borderRadius: 1.5,
  },
});
