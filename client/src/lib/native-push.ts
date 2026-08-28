import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiRequest } from "@/lib/queryClient";
import { apiUrl, isNativeApp } from "@/lib/api-base";

const TOKEN_KEY = "pidaka_fcm_token";

export function nativePushSupported() {
  return isNativeApp();
}

export async function nativePushAlertsReady() {
  if (!nativePushSupported()) return false;
  try {
    const res = await fetch(apiUrl("/api/push/status"), {
      credentials: isNativeApp() ? "omit" : "include",
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { native?: boolean };
    return Boolean(data.native);
  } catch {
    return false;
  }
}

async function persistDeviceToken(token: string) {
  const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
  await apiRequest("POST", "/api/push/device", { token, platform });
  localStorage.setItem(TOKEN_KEY, token);
}

export async function dropNativePushToken() {
  if (!nativePushSupported()) return;
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    try {
      await apiRequest("DELETE", "/api/push/device", { token });
    } catch {
      // server may already have dropped it
    }
    localStorage.removeItem(TOKEN_KEY);
  }
  try {
    await PushNotifications.removeAllListeners();
    await PushNotifications.unregister();
  } catch {
    // leave
  }
}

export async function attachNativePushListeners(handlers: {
  onBurn: () => void;
  onOpenInbox: () => void;
}) {
  if (!nativePushSupported()) return () => {};

  const handles = await Promise.all([
    PushNotifications.addListener("registration", (event) => {
      void persistDeviceToken(event.value);
    }),
    PushNotifications.addListener("registrationError", () => {}),
    PushNotifications.addListener("pushNotificationReceived", () => {
      handlers.onBurn();
    }),
    PushNotifications.addListener("pushNotificationActionPerformed", () => {
      handlers.onOpenInbox();
    }),
  ]);

  return () => {
    for (const handle of handles) void handle.remove();
  };
}

async function permissionGranted() {
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
    const next = await PushNotifications.requestPermissions();
    return next.receive === "granted";
  }
  return perm.receive === "granted";
}

export async function nativePushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!nativePushSupported()) return "unsupported";
  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === "granted") return "granted";
  if (perm.receive === "denied") return "denied";
  return "default";
}

export async function registerNativePush() {
  if (!nativePushSupported()) return false;
  if (!(await permissionGranted())) return false;
  await PushNotifications.register();
  return true;
}

export async function syncNativePush() {
  if (!nativePushSupported()) return false;
  if (!(await nativePushAlertsReady())) return false;
  if (!(await permissionGranted())) return false;
  await PushNotifications.register();
  return true;
}
