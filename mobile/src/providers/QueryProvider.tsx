import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,  // 30s — matches the schedule cache TTL
      gcTime: 5 * 60_000, // 5min — keep cached data in memory
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
      refetchOnWindowFocus: false, // Mobile: no window focus concept, but foreground detection could be added
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query provider for the mobile app.
 *
 * Provides a shared QueryClient to all screens for consistent
 * data fetching, caching, and invalidation.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
