import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthState } from "@/types";

/**
 * useAuth — Supabase auth for mobile.
 *
 * Ported from web's lib/auth-client.ts with these mobile-specific changes:
 * - No fetch-based admin check (mobile uses RLS or a dedicated endpoint)
 * - Uses expo-secure-store for session persistence (via supabase.ts config)
 * - Handles deep link redirects for magic link / OAuth callbacks
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [memberFlag, setMemberFlag] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  // Restore session on mount and listen for auth state changes
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      setInitialized(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setMemberFlag(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Fetch membership status from members table (same as web)
  useEffect(() => {
    if (!user) {
      setMemberFlag(false);
      return;
    }

    let active = true;
    supabase
      .from("members")
      .select("is_member, status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          const row = data as { is_member?: boolean; status?: string } | null;
          setMemberFlag(Boolean(row?.is_member) && row?.status === "active");
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const signInWithEmail = useCallback(
    async (email: string, opts?: { redirectTo?: string }) => {
      const redirectPath = opts?.redirectTo || "/profile";
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `thecolony://auth/callback?redirect_to=${encodeURIComponent(redirectPath)}`,
        },
      });
      return { error: error?.message ?? null };
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemberFlag(false);
  }, []);

  const refreshMembership = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("members")
      .select("is_member, status")
      .eq("user_id", user.id)
      .maybeSingle();
    const row = data as { is_member?: boolean; status?: string } | null;
    setMemberFlag(Boolean(row?.is_member) && row?.status === "active");
  }, [user]);

  return {
    user,
    isMember: memberFlag || isAdmin,
    isAdmin,
    loading,
    initialized,
    signInWithEmail,
    signOut,
    refreshMembership,
  };
}