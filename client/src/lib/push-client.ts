import { apiRequest } from "@/lib/queryClient";

export function pushSupported() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function vapidKey() {
  const res = await fetch("/api/push/vapid", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { publicKey?: string };
  return data.publicKey || null;
}

export async function persistSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
  await apiRequest("POST", "/api/push/subscribe", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
}

export async function dropBurnSubscription() {
  if (!pushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await apiRequest("DELETE", "/api/push/subscribe", { endpoint: subscription.endpoint });
  } catch {
    // still drop the browser subscription
  }
  try {
    await subscription.unsubscribe();
  } catch {
    // leave
  }
}
