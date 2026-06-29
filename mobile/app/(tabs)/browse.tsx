import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { ProgramCard } from "@/components/ProgramCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ProgramCardSkeleton } from "@/components/LoadingSkeleton";
import type { Program } from "@/types";

type Category = string;

const CATEGORIES: Category[] = [
  "All",
  "News",
  "Opinion",
  "Politics",
  "Podcast",
  "Documentary",
  "Interview",
  "Commentary",
];

/**
 * Browse Tab — Discover programs with filters and search.
 *
 * Mirrors the web's /watch page (unified video hub).
 * Shows a grid of programs with:
 * - Horizontal category filter chips
 * - Search bar
 * - Grid of program cards (FlashList for performance)
 *
 * Data: Fetches from public.programs table directly (same as web).
 * Shows loading, error, and empty states.
 */
export default function BrowseScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("programs")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      const programsData = (data ?? []) as Program[];
      setPrograms(programsData);
      setFilteredPrograms(programsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // Filter by category and search
  useEffect(() => {
    let result = programs;

    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }

    setFilteredPrograms(result);
  }, [programs, selectedCategory, searchQuery]);

  const handleProgramPress = useCallback((program: Program) => {
    router.push(`/program/${program.id}`);
  }, []);

  // --- Loading State ---
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Browse</Text>
        </View>
        <View className="px-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <ProgramCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Browse</Text>
        </View>
        <ErrorState
          title="Couldn't load programs"
          message={error}
          onRetry={fetchPrograms}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-950" edges={["top"]}>
      <ErrorBoundary>
        {/* Header */}
        <View className="px-4 py-3">
          <Text className="text-white text-xl font-bold">Browse</Text>
        </View>

        {/* Search bar */}
        <View className="px-4 mb-3">
          <View className="bg-surface-800 rounded-xl px-4 py-3 flex-row items-center">
            <Text className="text-surface-400 mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-white text-sm"
              placeholder="Search programs..."
              placeholderTextColor="#737373"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                accessibilityLabel="Clear search"
              >
                <Text className="text-surface-400">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category filters */}
        <View className="mb-3">
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === item
                    ? "bg-brand-600"
                    : "bg-surface-800"
                }`}
                accessibilityLabel={`Filter by ${item}`}
                accessibilityRole="button"
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === item
                      ? "text-white"
                      : "text-surface-300"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Program grid */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <FlashList
          data={filteredPrograms}
          estimatedItemSize={200 as any}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: any) => (
            <View className="flex-1 px-2">
              <ProgramCard
                program={item}
                onPress={() => handleProgramPress(item)}
                size="medium"
              />
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
          ListEmptyComponent={
            <EmptyState
              icon="🎬"
              title="No programs found"
              message={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No programs available in this category"
              }
            />
          }
        />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
