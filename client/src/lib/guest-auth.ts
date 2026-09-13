import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

const GUEST_KEY = "pidaka_guest_key";

function randomGuestKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  }
  return `guest${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function guestKey() {
  const existing = localStorage.getItem(GUEST_KEY);
  if (existing && existing.length >= 16) return existing;
  const next = randomGuestKey();
  localStorage.setItem(GUEST_KEY, next);
  return next;
}

export function readDeviceDetails() {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const screenSize =
    typeof window !== "undefined" ? `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}` : "";
  return {
    platform: nav?.platform || "",
    language: nav?.language || "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    userAgent: (nav?.userAgent || "").slice(0, 512),
    screen: screenSize,
  };
}

export type GuestLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type GuestLocationResult =
  | { ok: true; location: GuestLocation }
  | { ok: false; reason: "unsupported" | "denied" | "timeout" | "unavailable" };

async function requestNativeLocation(): Promise<GuestLocationResult> {
  try {
    const permission = await Geolocation.checkPermissions();
    let receive = permission.location;
    let coarse = permission.coarseLocation;
    if (receive === "prompt" || receive === "prompt-with-rationale" || coarse === "prompt" || coarse === "prompt-with-rationale") {
      const next = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
      receive = next.location;
      coarse = next.coarseLocation;
    }
    if (receive === "denied" && coarse === "denied") return { ok: false, reason: "denied" };
    if (receive !== "granted" && coarse !== "granted") return { ok: false, reason: "unavailable" };

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 60_000,
    });
    return {
      ok: true,
      location: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined,
      },
    };
  } catch (err) {
    const message = String((err as { message?: string })?.message || err || "").toLowerCase();
    if (message.includes("denied") || message.includes("permission")) {
      return { ok: false, reason: "denied" };
    }
    if (message.includes("timeout")) return { ok: false, reason: "timeout" };
    return { ok: false, reason: "unavailable" };
  }
}

function requestWebLocation(): Promise<GuestLocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined,
          },
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          resolve({ ok: false, reason: "denied" });
          return;
        }
        if (err.code === err.TIMEOUT) {
          resolve({ ok: false, reason: "timeout" });
          return;
        }
        resolve({ ok: false, reason: "unavailable" });
      },
      {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 0,
      },
    );
  });
}

/** Must be called directly from a user gesture (click/submit) so the browser can show the prompt. */
export function requestGuestLocation(): Promise<GuestLocationResult> {
  if (Capacitor.isNativePlatform()) {
    return requestNativeLocation();
  }
  return requestWebLocation();
}
