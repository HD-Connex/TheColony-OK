import React from "react";
import { Tabs } from "expo-router";
import { View, Text } from "react-native";

/**
 * Bottom tab navigator — mirrors main web sections.
 *
 * Tabs:
 * - Home (24/7 player) — "play" icon
 * - Browse — "grid/search" icon
 * - Schedule — "calendar/list" icon
 * - Profile — "person" icon
 *
 * Each tab uses unicode symbols as lightweight icons to avoid
 * needing an icon library (production: replace with lucide-react-native
 * or expo-vector-icons).
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#171717",
          borderTopColor: "#262626",
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: "#0c8ee7",
        tabBarInactiveTintColor: "#737373",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>▶</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Browse",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⊞</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>☰</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>◎</Text>
          ),
        }}
      />
    </Tabs>
  );
}
