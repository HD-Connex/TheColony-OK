import React from "react";
import { Stack } from "expo-router";

/**
 * Auth layout — wraps sign-in/sign-up screens.
 *
 * Uses a simple stack without tabs. Centered card-style layouts.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0a0a0a" },
        animation: "slide_from_bottom",
      }}
    >
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
