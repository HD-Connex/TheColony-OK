import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Consistent error state for all screens.
 *
 * Shows a user-friendly error message with an optional retry button.
 * Every async data fetch should use this instead of letting errors bubble up.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content. Please try again.",
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-red-400 text-4xl mb-4">!</Text>
      <Text className="text-white text-lg font-semibold text-center mb-2">
        {title}
      </Text>
      <Text className="text-surface-400 text-sm text-center leading-5 max-w-xs mb-6">
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="bg-brand-600 px-6 py-3 rounded-lg active:bg-brand-700"
          accessibilityLabel={retryLabel}
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
