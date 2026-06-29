import React, { type ReactNode } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";

interface AuthGuardProps {
  children: ReactNode;
  requiredTier?: "member" | "admin" | "any";
  fallback?: ReactNode;
}

/**
 * Route guard for authenticated/protected content.
 *
 * Wraps screens or components that require authentication.
 * - "any": user must be signed in
 * - "member": user must be signed in AND have active membership
 * - "admin": user must be an admin
 *
 * Shows a sign-in prompt if the user isn't authenticated.
 */
export function AuthGuard({
  children,
  requiredTier = "any",
  fallback,
}: AuthGuardProps) {
  const { user, isMember, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-950">
        <Text className="text-surface-400">Checking access...</Text>
      </View>
    );
  }

  const hasAccess =
    requiredTier === "any"
      ? !!user
      : requiredTier === "member"
        ? !!user && (isMember || isAdmin)
        : requiredTier === "admin"
          ? !!user && isAdmin
          : !!user;

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <View className="flex-1 items-center justify-center bg-surface-950 px-8">
        <Text className="text-white text-xl font-semibold text-center mb-2">
          {!user
            ? "Sign in to continue"
            : "Membership required"}
        </Text>
        <Text className="text-surface-400 text-sm text-center mb-6 max-w-xs">
          {!user
            ? "Create an account or sign in to access this content."
            : "Become a member to access premium content."}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-in")}
          className="bg-brand-600 px-6 py-3 rounded-lg active:bg-brand-700"
          accessibilityRole="button"
        >
          <Text className="text-white font-semibold">
            {!user ? "Sign In" : "View Membership"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}
