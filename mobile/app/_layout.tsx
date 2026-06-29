import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { PlayerProvider } from "@/providers/PlayerProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusBar } from "@/components/NetworkStatusBar";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import "../global.css";

/**
 * Root layout — wraps the entire app with providers.
 *
 * Provider order:
 * 1. GestureHandlerRootView — required for react-native-gesture-handler
 * 2. SafeAreaProvider — safe area insets
 * 3. ErrorBoundary — catches render errors globally
 * 4. QueryProvider — TanStack Query for data fetching
 * 5. AuthProvider — Supabase auth state
 * 6. PlayerProvider — Global 24/7 player context
 * 7. Stack navigator — Screen navigation
 *
 * Deep link handling:
 * The app handles thecolony://auth/callback deep links for magic link
 * and OAuth callbacks. Supabase sends auth tokens in the URL fragment.
 */
export default function RootLayout() {
  // Handle incoming deep links for Supabase auth
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url) return;

      // Parse the URL — Supabase auth redirects have #access_token=...
      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams as Record<string, string> | undefined;
      const hash = queryParams?.hash ?? ((parsed as any).hash as string) ?? "";

      // Supabase sends auth tokens in the URL fragment after OAuth/magic link
      if (hash && typeof hash === "string" && hash.includes("access_token")) {
        try {
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        } catch (err) {
          console.error("[DeepLink] Failed to set auth session:", err);
        }
      }
    };

    // Handle URL from initial app launch
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle URLs while app is running
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <PlayerProvider>
                <NetworkStatusBar />
                <StatusBar style="light" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#0a0a0a" },
                    animation: "slide_from_right",
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="(auth)"
                    options={{ animation: "slide_from_bottom" }}
                  />
                  <Stack.Screen
                    name="player/[id]"
                    options={{
                      animation: "slide_from_bottom",
                      presentation: "fullScreenModal",
                    }}
                  />
                  <Stack.Screen
                    name="program/[id]"
                    options={{ presentation: "card" }}
                  />
                  <Stack.Screen
                    name="series/[slug]"
                    options={{ presentation: "card" }}
                  />
                  <Stack.Screen
                    name="episode/[id]"
                    options={{ presentation: "card" }}
                  />
                  <Stack.Screen
                    name="settings/index"
                    options={{ presentation: "card" }}
                  />
                  <Stack.Screen
                    name="+not-found"
                    options={{ title: "Not Found" }}
                  />
                </Stack>
              </PlayerProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}