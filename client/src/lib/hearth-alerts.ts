import { isNativeApp } from "@/lib/api-base";
import { hearthRequest } from "@/lib/hearth";
import { pushSupported, urlBase64ToUint8Array, vapidKey } from "@/lib/push-client";

/** Own scope so the hearth subscription never replaces a wall user's burn subscription in the same browser. */
const HEARTH_SW_SCOPE = "/hearth/";

export function hearthAlertsSupported() {
  return pushSupported() && !isNativeApp();
}

async function findRegistration() {
  const scope = new URL(HEARTH_SW_SCOPE, window.location.origin).href;
  const registrations = await navigator.serviceWorker.getRegistrations();
  return registrations.find((r) => r.scope === scope) ?? null;
}

async function untilActive(registration: ServiceWorkerRegistration) {
  if (registration.active) return registration;
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return registration;
  await new Promise<void>((resolve) => {
    const check = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", check);
        resolve();
      }
    };
    worker.addEventListener("statechange", check);
    check();
  });
  return registration;
}

export async function hearthAlertsOn(): Promise<boolean> {
  if (!hearthAlertsSupported() || Notification.permission !== "granted") return false;
  const registration = await findRegistration();
  return Boolean(await registration?.pushManager.getSubscription());
}

export async function enableHearthAlerts() {
  if (!hearthAlertsSupported()) throw new Error("This browser cannot take alerts");
  const publicKey = await vapidKey();
  if (!publicKey) throw new Error("Web alerts are not wired on the server");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notifications are blocked for this site. Allow them in the browser's site settings.");
  }

  const registration = await untilActive(
    (await findRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: HEARTH_SW_SCOPE })),
  );
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("The browser gave an incomplete subscription");
  }
  await hearthRequest("POST", "/api/admin/push/subscribe", {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
}

export async function disableHearthAlerts() {
  const registration = await findRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  try {
    await hearthRequest("DELETE", "/api/admin/push/subscribe", { endpoint: subscription.endpoint });
  } finally {
    await subscription.unsubscribe().catch(() => false);
  }
}

export async function sendHearthTestAlert() {
  await hearthRequest("POST", "/api/admin/push/test");
}
