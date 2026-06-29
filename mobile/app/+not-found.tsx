import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

/**
 * Global fallback screen for unknown routes.
 *
 * Never crashes or shows blank — always provides a way to navigate home.
 * This is the "dead link prevention" safety net: if a deep link or
 * programmatic navigation targets a non-existent route, this renders.
 */
export default function NotFoundScreen() {
  return (
    <View className="flex-1 bg-surface-950 items-center justify-center px-8">
      <Text className="text-5xl mb-4">404</Text>
      <Text className="text-white text-xl font-semibold text-center mb-2">
        Page Not Found
      </Text>
      <Text className="text-surface-400 text-sm text-center mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        className="bg-brand-600 px-6 py-3 rounded-lg active:bg-brand-700"
        accessibilityRole="button"
      >
        <Text className="text-white font-semibold">Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}
