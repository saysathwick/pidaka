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

export function requestGuestLocation(): Promise<GuestLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 60_000,
      },
    );
  });
}
