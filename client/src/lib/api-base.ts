import { Capacitor } from "@capacitor/core";

/** Production API origin for the native app (bundled UI, remote backend). */
export const NATIVE_API_ORIGIN = "https://pidaka.in";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/** Resolve an app API path for the current platform. */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  if (!isNativeApp()) return path;
  return `${NATIVE_API_ORIGIN}${path}`;
}
