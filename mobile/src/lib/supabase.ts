import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// SecureStore-based adapter for Supabase auth session persistence.
const ExpoSecureStoreAdapter = Platform.select({
  web: {
    getItem: (key: string) => {
      try {
        return Promise.resolve(localStorage.getItem(key));
      } catch {
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {}
      return Promise.resolve();
    },
  },
  default: {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  },
});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

// Singleton pattern. Always returns a valid client (dev no-op if env missing).
let _client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (__DEV__) {
      console.warn("[supabase] Missing env vars — returning no-op client (dev only)");
    }
    // Return a typed client that won't crash but also won't authenticate
    return createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }) as SupabaseClient;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseClient();
  }
  return _client;
}

export const supabase: SupabaseClient = getSupabaseClient();