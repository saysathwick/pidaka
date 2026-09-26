import { Capacitor } from "@capacitor/core";
import { Geolocation, type Position } from "@capacitor/geolocation";

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

import { collectDeviceDetails, type DeviceDetails } from "@/lib/device-details";

export { collectDeviceDetails, readDeviceDetails, type DeviceDetails } from "@/lib/device-details";

const DEVICE_STASH_KEY = "pidaka_pending_device";

/** Stash before OAuth redirect / Custom Tab so we can save it after the session returns. */
export async function stashAuthDeviceDetails() {
  try {
    const device = await collectDeviceDetails();
    sessionStorage.setItem(DEVICE_STASH_KEY, JSON.stringify(device));
  } catch {
    // private mode / unavailable
  }
}

export async function flushAuthDeviceDetails(
  post: (device: DeviceDetails) => Promise<unknown>,
) {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(DEVICE_STASH_KEY);
    if (raw) sessionStorage.removeItem(DEVICE_STASH_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const device = JSON.parse(raw) as DeviceDetails;
    if (!device || typeof device !== "object") return;
    await post(device);
  } catch {
    // best-effort; naming still works without device
  }
}

export type GuestLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type GuestLocationResult =
  | { ok: true; location: GuestLocation }
  | { ok: false; reason: "unsupported" | "denied" | "timeout" | "unavailable"; permissionGranted?: boolean };

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function toGuestLocation(pos: Position): GuestLocation {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : undefined,
  };
}

function isTimeoutError(err: unknown) {
  const message = String((err as { message?: string; code?: string })?.message || err || "").toLowerCase();
  const code = String((err as { code?: string })?.code || "").toLowerCase();
  return message.includes("timeout") || message.includes("in time") || code.includes("gloc-0010");
}

async function watchNativePosition(ms: number, enableHighAccuracy: boolean): Promise<Position> {
  return new Promise(async (resolve, reject) => {
    let settled = false;
    let watchId = "";
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      if (watchId) void Geolocation.clearWatch({ id: watchId });
      reject(new Error("Location request timed out"));
    }, ms);

    try {
      watchId = await Geolocation.watchPosition(
        { enableHighAccuracy, timeout: ms, maximumAge: 5 * 60_000 },
        (pos, err) => {
          if (settled) return;
          if (err || !pos) return;
          settled = true;
          window.clearTimeout(timer);
          void Geolocation.clearWatch({ id: watchId });
          resolve(pos);
        },
      );
    } catch (err) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(err);
    }
  });
}

async function readNativePosition(): Promise<Position> {
  const attempts: Array<{ enableHighAccuracy: boolean; timeout: number; maximumAge: number }> = [
    { enableHighAccuracy: false, timeout: 20_000, maximumAge: 10 * 60_000 },
    { enableHighAccuracy: false, timeout: 30_000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 35_000, maximumAge: 0 },
  ];

  let lastErr: unknown;
  for (const opts of attempts) {
    try {
      return await Geolocation.getCurrentPosition(opts);
    } catch (err) {
      lastErr = err;
      if (!isTimeoutError(err)) throw err;
    }
  }

  try {
    return await watchNativePosition(25_000, false);
  } catch (err) {
    lastErr = err;
  }

  throw lastErr;
}

async function requestNativeLocation(): Promise<GuestLocationResult> {
  let permissionGranted = false;
  try {
    const permission = await Geolocation.checkPermissions();
    let receive = permission.location;
    let coarse = permission.coarseLocation;
    if (receive === "prompt" || receive === "prompt-with-rationale" || coarse === "prompt" || coarse === "prompt-with-rationale") {
      const next = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
      receive = next.location;
      coarse = next.coarseLocation;
      // Android often needs a beat after the dialog before providers are ready.
      await sleep(800);
    }
    permissionGranted = receive === "granted" || coarse === "granted";
    if (receive === "denied" && coarse === "denied") return { ok: false, reason: "denied" };
    if (!permissionGranted) return { ok: false, reason: "unavailable" };

    const pos = await readNativePosition();
    return { ok: true, location: toGuestLocation(pos) };
  } catch (err) {
    const message = String((err as { message?: string })?.message || err || "").toLowerCase();
    if (message.includes("denied") || message.includes("permission")) {
      return { ok: false, reason: "denied", permissionGranted };
    }
    if (isTimeoutError(err)) return { ok: false, reason: "timeout", permissionGranted };
    return { ok: false, reason: "unavailable", permissionGranted };
  }
}

function requestWebLocation(): Promise<GuestLocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve({ ok: false, reason: "unsupported" });
  }

  const tryOnce = (options: PositionOptions) =>
    new Promise<GuestLocationResult>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ ok: true, location: toGuestLocation(pos as unknown as Position) }),
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
        options,
      );
    });

  return (async () => {
    const first = await tryOnce({
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 5 * 60_000,
    });
    if (first.ok || first.reason === "denied" || first.reason === "unsupported") return first;
    return tryOnce({
      enableHighAccuracy: true,
      timeout: 25_000,
      maximumAge: 0,
    });
  })();
}

/** Must be called directly from a user gesture (click/submit) so the browser can show the prompt. */
export function requestGuestLocation(): Promise<GuestLocationResult> {
  if (Capacitor.isNativePlatform()) {
    return requestNativeLocation();
  }
  return requestWebLocation();
}
