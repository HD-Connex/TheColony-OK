import Constants from "expo-constants";
import { Platform } from "react-native";

export const APP_NAME = "The Colony";
export const APP_SCHEME = "thecolony";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? "https://thecolonyok.com";

export const MUX_DOMAIN = "https://stream.mux.com";
export const MUX_THUMBNAIL_BASE = "https://image.mux.com";

export const DEEP_LINK_SCHEME = "thecolony://";
export const AUTH_REDIRECT_URL = `${DEEP_LINK_SCHEME}auth/callback`;

export const IS_IOS = Platform.OS === "ios";
export const IS_ANDROID = Platform.OS === "android";
export const IS_WEB = Platform.OS === "web";

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
export const BUILD_NUMBER = String(
  Platform.select({
    ios: Constants.expoConfig?.ios?.buildNumber ?? "1",
    android: String(Constants.expoConfig?.android?.versionCode ?? "1"),
    default: "1" as string,
  }) ?? "1"
);

// HLS URL builder (same as web platform)
export function buildHlsUrl(playbackId: string): string {
  return `${MUX_DOMAIN}/${playbackId}.m3u8`;
}

export function buildThumbnailUrl(
  playbackId: string,
  width: number = 640
): string {
  return `${MUX_THUMBNAIL_BASE}/${playbackId}/thumbnail.webp?width=${width}&fit_mode=smartcrop`;
}

export function buildAnimatedThumbnailUrl(
  playbackId: string,
  width: number = 640
): string {
  return `${MUX_THUMBNAIL_BASE}/${playbackId}/animated.webp?width=${width}`;
}