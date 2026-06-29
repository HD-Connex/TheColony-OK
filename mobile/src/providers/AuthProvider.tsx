import React, { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AuthState } from "@/types";

const AuthContext = createContext<AuthState | null>(null);

/**
 * AuthProvider — Makes auth state available to all screens.
 *
 * Wraps the app root layout. Uses the same useAuth hook consumed by screens.
 * This pattern avoids prop drilling and ensures every screen can check
 * authentication status.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth state anywhere in the component tree.
 * Throws if used outside AuthProvider.
 */
export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
