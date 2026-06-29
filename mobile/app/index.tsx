import { Redirect } from "expo-router";

/**
 * Root index — redirects to the main tabs screen.
 *
 * This ensures that the app opens on the (tabs)/index (Home/24x7) screen
 * rather than showing a blank screen.
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
