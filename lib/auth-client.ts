"use client";

// Browser-side Supabase auth (magic-link / OTP). Sessions persist in
// localStorage; detectSessionInUrl lets the magic-link land on any page and
// establish the session automatically — no custom callback route needed.
// Entitlement ("is this a paid member?") comes from the `members` table, set
// exclusively by the Stripe webhook (after verified checkout.session.completed /
// invoice.paid / subscription.* events) or admin. Signed-in ≠ paid. Real sync
// now wired; isMember reflects is_member && status==='active' from DB.

import type { SupabaseClient, User } from "@supabase/supabase-js"; // PHASE 8 self-verif: fixed double 'type' modifier (TS syntax error blocking build). Pre-existing; no relation to P1-7 content fixes. Enables clean build/grep verif.
import { useCallback, useEffect, useState } from "react";

// P5 + P2 CONSOLIDATION: Reuse the *single* browser client singleton.
// Previously this file did its own `let browser = null; createClient(...) from @supabase/supabase-js`
// while utils/supabase/client.ts + component calls did separate createBrowserClient() — causing
// "Multiple GoTrueClient instances" warnings in browser console (each init a fresh auth GoTrueClient).
// Now: supabaseBrowser() is a thin delegator to the cached createClient() (which uses createBrowserClient + full auth opts).
// This matches lib/supabase.ts caching pattern exactly (if (x) return x; ...).
// All calls (LiveChat, LivePoll, LiveStage, ThreadedComments, useAuth, WatchlistButton, ClipsUploadForm,
// FollowButton, Billing..., Checkout..., backroom, my-counties duals, clips, ContinueRail via client, live-polls dynamic etc)
// now hit the exact same instance. Dynamic import in lib/live-polls.ts continues to work.
import { createClient } from "@/utils/supabase/client";

export function supabaseBrowser(): SupabaseClient {
  // Delegates to the shared cached singleton (P5 fix). Provides same API surface.
  // The underlying createBrowserClient (with persist/autoRefresh/detect) handles magic-link/OTP flows.
  // No local cache here anymore; central one in utils/supabase/client.ts prevents multiples even on
  // repeated top-of-FC `const sb = supabaseBrowser()` or `createClient()` or mixed imports.
  return createClient() as SupabaseClient;
}

export interface AuthState {
  user: User | null;
  isMember: boolean; // true for paying members OR signed-in admins (full access)
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, options?: { redirectTo?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [memberFlag, setMemberFlag] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin session (httpOnly cookie) grants full member access across the site.
  useEffect(() => {
    let active = true;
    fetch("/api/admin/status")
      .then((r) => (r.ok ? r.json() : { admin: false }))
      .then((d) => { if (active) setIsAdmin(Boolean(d?.admin)); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const sb = supabaseBrowser();
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      // memberFlag defaults to false; no setState needed on null user
      return;
    }
    supabaseBrowser()
      .from("members")
      .select("is_member, status")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setMemberFlag(Boolean(data?.is_member) && data?.status === "active");
      });
    return () => { active = false; };
  }, [user]);

  const signInWithEmail = useCallback(async (email: string, opts?: { redirectTo?: string }) => {
    const sb = supabaseBrowser();
    const redirectPath = opts?.redirectTo || "/membership/account";
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${redirectPath}` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseBrowser().auth.signOut();
    setUser(null);
    setMemberFlag(false);
  }, []);

  const refreshMembership = useCallback(async () => {
    if (!user) return;
    const { data } = await supabaseBrowser()
      .from("members")
      .select("is_member, status")
      .eq("user_id", user.id)
      .maybeSingle();
    setMemberFlag(Boolean(data?.is_member) && data?.status === "active");
  }, [user]);

  return { user, isMember: memberFlag || isAdmin, isAdmin, loading, signInWithEmail, signOut, refreshMembership };
}
