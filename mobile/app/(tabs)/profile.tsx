import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { APP_VERSION } from "@/lib/constants";

/**
 * Profile Tab — User account and settings.
 *
 * Mirrors the web's /membership page and /membership/account.
 * Shows:
 * - Signed out: Sign in / create account prompt
 * - Signed in: User info, membership status, settings links
 * - Membership management (if member)
 *
 * Links to:
 * - Settings screen
 * - Sign in screen
 * - (Future) Membership management via web Stripe portal
 */
export default function ProfileScreen() {
  const { user, isMember, isAdmin, loading, signOut } = useAuth();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Profile</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-surface-400">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <ErrorBoundary>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Profile</Text>
        </View>

        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 32 }}>
          {user ? (
            // ── Signed In ──
            <View>
              {/* User info card */}
              <View className="bg-surface-800 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 rounded-full bg-brand-600 items-center justify-center">
                    <Text className="text-white text-lg font-bold">
                      {(user.email ?? "U")[0]!.toUpperCase()}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold text-base">
                      {user.email ?? "User"}
                    </Text>
                    <View className="flex-row items-center mt-0.5">
                      <Text
                        className={`text-xs font-semibold ${
                          isMember ? "text-amber-500" : "text-surface-400"
                        }`}
                      >
                        {isMember ? "Member" : "Free"}
                      </Text>
                      {isAdmin && (
                        <View className="ml-2 bg-red-600/20 px-2 py-0.5 rounded">
                          <Text className="text-red-400 text-[10px] font-bold">
                            ADMIN
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Menu items */}
              <View className="bg-surface-800 rounded-xl overflow-hidden mb-4">
                <MenuItem
                  label="Settings"
                  onPress={() => router.push("/settings")}
                />
                {!isMember && (
                  <MenuItem
                    label="Become a Member"
                    onPress={() => router.push("/(auth)/sign-in")}
                    accent
                  />
                )}
              </View>

              {/* Sign out */}
              <TouchableOpacity
                onPress={signOut}
                className="bg-surface-800 rounded-xl py-3 items-center active:bg-surface-700"
                accessibilityRole="button"
              >
                <Text className="text-red-400 font-semibold">Sign Out</Text>
              </TouchableOpacity>

              {/* App info */}
              <Text className="text-surface-600 text-xs text-center mt-8">
                The Colony v{APP_VERSION}
              </Text>
            </View>
          ) : (
            // ── Signed Out ──
            <View className="flex-1 items-center justify-center pt-16">
              <View className="w-20 h-20 rounded-full bg-surface-800 items-center justify-center mb-4">
                <Text className="text-surface-500 text-3xl">◎</Text>
              </View>
              <Text className="text-white text-xl font-semibold text-center mb-2">
                Sign In
              </Text>
              <Text className="text-surface-400 text-sm text-center mb-8 max-w-xs">
                Sign in to access your profile, watch history, and premium
                content.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/sign-in")}
                className="bg-brand-600 px-8 py-3 rounded-lg active:bg-brand-700"
                accessibilityRole="button"
              >
                <Text className="text-white font-semibold">Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </ErrorBoundary>
    </SafeAreaView>
  );
}

interface MenuItemProps {
  label: string;
  onPress: () => void;
  accent?: boolean;
}

function MenuItem({ label, onPress, accent }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3.5 active:bg-surface-700 border-b border-surface-700 last:border-b-0"
      accessibilityRole="button"
    >
      <Text
        className={`text-sm ${
          accent ? "text-brand-400 font-semibold" : "text-white"
        }`}
      >
        {label}
      </Text>
      <Text className="text-surface-500">›</Text>
    </TouchableOpacity>
  );
}
