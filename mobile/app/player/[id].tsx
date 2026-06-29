import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { supabase } from "@/lib/supabase";
import { EliteMobile24x7Player } from "@/components/EliteMobile24x7Player";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";
import { PlayerSkeleton } from "@/components/LoadingSkeleton";
import type { Program } from "@/types";

/**
 * Full-screen player modal for individual programs.
 *
 * Triggered when user taps a program from Schedule or Browse screens.
 * Shows the program in full-screen landscape mode with the 24/7 player.
 *
 * Fallback: If the program isn't part of the 24/7 schedule, it still
 * plays as a standalone video using the player's HLS capabilities.
 */
export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (err) throw err;
      setProgram(data as Program | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load program");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  // --- Loading ---
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <PlayerSkeleton />
      </View>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <ErrorState title="Couldn't load program" message={error} onRetry={fetchProgram} />
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityRole="button"
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Not found ---
  if (!program) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Program not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Player ---
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ErrorBoundary>
        <EliteMobile24x7Player
          showInfo={true}
          onFullscreenChange={(fs) => {
            // Orientation locking is handled by the device/player
          }}
        />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 50,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  notFoundTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
});
