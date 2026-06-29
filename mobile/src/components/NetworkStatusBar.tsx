import React from "react";
import { View, Text } from "react-native";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * Network status banner shown when offline.
 *
 * Renders a thin bar at the top of the screen when the device has no
 * network connectivity. Auto-hides when connectivity returns.
 */
export function NetworkStatusBar() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View className="bg-red-600 px-4 py-2">
      <Text className="text-white text-xs font-semibold text-center">
        No internet connection. Some features may be unavailable.
      </Text>
    </View>
  );
}

/**
 * Hook-based check for components that need to react to offline state.
 * Returns true when the device is offline.
 */
export { useNetworkStatus };
