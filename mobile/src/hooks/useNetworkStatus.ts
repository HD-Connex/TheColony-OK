import { useEffect, useState, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

/**
 * Monitors network connectivity status on mobile.
 *
 * React Native's NetInfo is the gold standard, but we keep this lightweight
 * by using AppState + a Supabase health-check ping. When the app returns to
 * foreground, we verify backend reachability.
 *
 * This is sufficient for the player's needs: detect when to stop/retry playback.
 * For production, install @react-native-community/netinfo and replace this.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const { checkSupabaseHealth } = await import("@/lib/resilience");
      const healthy = await checkSupabaseHealth();
      setIsOnline(healthy);
      if (healthy && wasOffline) {
        setWasOffline(false);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setChecking(false);
    }
  }, [checking, wasOffline]);

  // Listen for app state changes (foreground/background)
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        setIsOnline(true);
        checkConnection();
      }
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [checkConnection]);

  // Periodic health check every 30s when online, 10s when offline
  useEffect(() => {
    const interval = setInterval(
      checkConnection,
      isOnline ? 30_000 : 10_000
    );
    return () => clearInterval(interval);
  }, [checkConnection, isOnline]);

  const setOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  const setOnline = useCallback(() => {
    setIsOnline(true);
    setWasOffline(false);
  }, []);

  return { isOnline, wasOffline, checkConnection, setOffline, setOnline };
}

/**
 * Lightweight hook that returns whether the network is reachable.
 * Use in components that need to show offline state.
 */
export function useIsOnline() {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}
