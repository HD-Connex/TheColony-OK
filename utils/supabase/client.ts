import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL or key for browser SSR client");
      throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) missing for Supabase SSR browser client.");
    }
    console.warn("[supabase-client] env missing — using placeholder (dev only).");
    // Minimal no-op for dev so components don't explode before hydration.
    return { auth: { getSession: async () => ({ data: { session: null }, error: null }) } } as any;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
};
