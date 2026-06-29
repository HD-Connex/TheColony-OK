import React from "react";
import { View, Text } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

/**
 * Consistent empty state for all screens.
 *
 * Shown when data loads successfully but returns zero results.
 * Never show a blank screen — always provide context.
 */
export function EmptyState({ icon = "📭", title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-4">{icon}</Text>
      <Text className="text-white text-lg font-semibold text-center mb-2">
        {title}
      </Text>
      {message && (
        <Text className="text-surface-400 text-sm text-center leading-5 max-w-xs">
          {message}
        </Text>
      )}
    </View>
  );
}
