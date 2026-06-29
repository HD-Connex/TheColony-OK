import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  APP_NAME,
  APP_VERSION,
  SITE_URL,
  IS_IOS,
  IS_ANDROID,
} from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

/**
 * Settings screen.
 *
 * Provides app configuration, about info, and links to web resources.
 * Mirrors the web's settings/profile management.
 */
export default function SettingsScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <ErrorBoundary>
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
            accessibilityRole="button"
          >
            <Text className="text-brand-400 text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Settings</Text>
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Account section */}
          {user && (
            <View className="mb-6">
              <SectionLabel>Account</SectionLabel>
              <View className="bg-surface-800 rounded-xl overflow-hidden">
                <SettingRow
                  label="Email"
                  value={user.email ?? ""}
                  disabled
                />
              </View>
            </View>
          )}

          {/* Notifications section */}
          <View className="mb-6">
            <SectionLabel>Notifications</SectionLabel>
            <View className="bg-surface-800 rounded-xl overflow-hidden">
              <SettingRow
                label="Push Notifications"
                onPress={() => {
                  // Future: expo-notifications permission request
                }}
              />
            </View>
          </View>

          {/* Video section */}
          <View className="mb-6">
            <SectionLabel>Playback</SectionLabel>
            <View className="bg-surface-800 rounded-xl overflow-hidden">
              <SettingRow
                label="Cellular Data Playback"
                value="Wi-Fi Only"
                onPress={() => {
                  // Future: Data usage preferences
                }}
              />
            </View>
          </View>

          {/* About section */}
          <View className="mb-6">
            <SectionLabel>About</SectionLabel>
            <View className="bg-surface-800 rounded-xl overflow-hidden">
              <SettingRow label="App" value={`${APP_NAME} v${APP_VERSION}`} disabled />
              <SettingRow label="Platform" value={`${IS_IOS ? "iOS" : IS_ANDROID ? "Android" : "Web"}`} disabled />
              <SettingRow
                label="Website"
                value={SITE_URL}
                onPress={() => {
                  // Future: open in browser
                }}
              />
            </View>
          </View>

          {/* Support section */}
          <View className="mb-6">
            <TouchableOpacity
              className="bg-surface-800 rounded-xl py-3.5 items-center active:bg-surface-700"
              accessibilityRole="button"
            >
              <Text className="text-brand-400 font-semibold">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ErrorBoundary>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="text-surface-400 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
      {children}
    </Text>
  );
}

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}

function SettingRow({ label, value, onPress, disabled }: SettingRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      className="flex-row items-center justify-between px-4 py-3.5 border-b border-surface-700 last:border-b-0 active:bg-surface-700"
      accessibilityRole={onPress && !disabled ? "button" : "text"}
    >
      <Text className="text-white text-sm">{label}</Text>
      <View className="flex-row items-center">
        {value && (
          <Text className="text-surface-400 text-sm mr-2">{value}</Text>
        )}
        {onPress && !disabled && (
          <Text className="text-surface-500">›</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
