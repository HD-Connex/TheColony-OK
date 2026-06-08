"use client";

// Browser-side Supabase auth (magic-link / OTP). Sessions persist in
// localStorage; detectSessionInUrl lets the magic-link land on any page and
// establish the session automatically — no custom callback route needed.
// Entitlement ("is this a paid member?") comes from the `members` table, set
// exclusively by the Stripe webhook (after verified checkout.session.completed /
// invoice.paid / subscription.* events) or admin. Signed-in ≠ paid. Real sync
// now wired; isMember reflects is_member && status==='active' from DB.

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

let browser: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (browser) return browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
  browser = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return browser;
}

export interface AuthState {
  user: User | null;
  isMember: boolean; // true for paying members OR signed-in admins (full access)
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
    if (!user) {
      setMemberFlag(false);
      return;
    }
    let active = true;
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

  const signInWithEmail = useCallback(async (email: string) => {
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/membership/account` },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseBrowser().auth.signOut();
    setUser(null);
    setMemberFlag(false);
  }, []);

  return { user, isMember: memberFlag || isAdmin, isAdmin, loading, signInWithEmail, signOut };
}
