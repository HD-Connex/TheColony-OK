import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME, SITE_URL } from "@/lib/constants";

/**
 * Sign In screen — Email magic link / OTP sign in.
 *
 * Mirrors the web's auth flow:
 * - User enters email
 * - Supabase sends magic link (OTP)
 * - User clicks link in email → deep link opens app → session established
 *
 * States: idle → sending → sent (success) → error
 *
 * Deep linking: The magic link redirects to thecolony://auth/callback
 * which is handled by the root layout's deep link handler.
 * The handler extracts the access_token and sets the Supabase session.
 */
export default function SignInScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const { error } = await signInWithEmail(email.trim(), {
        redirectTo: "/profile",
      });

      if (error) {
        setErrorMessage(error);
        setIsSending(false);
        return;
      }

      // Success — show confirmation
      setIsSent(true);
      setIsSending(false);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setIsSending(false);
    }
  };

  // ── Success State ──
  if (isSent) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">✉</Text>
          <Text className="text-white text-xl font-semibold text-center mb-2">
            Check your email
          </Text>
          <Text className="text-surface-400 text-sm text-center mb-6 max-w-xs leading-5">
            We sent a magic link to{" "}
            <Text className="text-white font-medium">{email}</Text>. Click the
            link to sign in.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsSent(false);
              setEmail("");
            }}
            className="bg-surface-800 px-6 py-3 rounded-lg active:bg-surface-700"
            accessibilityRole="button"
          >
            <Text className="text-brand-400 font-semibold">
              Use a different email
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Sign In Form ──
  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-white text-2xl font-bold mb-2">
              Sign in to {APP_NAME}
            </Text>
            <Text className="text-surface-400 text-sm leading-5">
              Enter your email and we'll send you a magic link to sign in
              instantly. No password needed.
            </Text>
          </View>

          {/* Email input */}
          <View className="mb-4">
            <Text className="text-surface-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Email address
            </Text>
            <TextInput
              className="bg-surface-800 text-white rounded-xl px-4 py-3.5 text-base border border-surface-700 focus:border-brand-500"
              placeholder="you@example.com"
              placeholderTextColor="#525252"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                setErrorMessage(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isSending}
            />
          </View>

          {/* Error message */}
          {errorMessage && (
            <View className="bg-red-600/20 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-400 text-sm">{errorMessage}</Text>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isSending || !email.trim()}
            className={`rounded-xl py-3.5 items-center ${
              isSending || !email.trim()
                ? "bg-surface-700"
                : "bg-brand-600 active:bg-brand-700"
            }`}
            accessibilityRole="button"
          >
            <Text
              className={`font-semibold text-base ${
                isSending || !email.trim()
                  ? "text-surface-500"
                  : "text-white"
              }`}
            >
              {isSending ? "Sending..." : "Send Magic Link"}
            </Text>
          </TouchableOpacity>

          {/* Back to home */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 items-center"
            accessibilityRole="button"
          >
            <Text className="text-surface-400 text-sm">Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
