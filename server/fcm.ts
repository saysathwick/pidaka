import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import type { BurnAlertPayload } from "@shared/burn-alert";
import { storage } from "./storage";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }
}

const serviceAccount = loadServiceAccount();
let messaging: Messaging | null = null;

if (serviceAccount) {
  try {
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }
    messaging = getMessaging();
  } catch (err) {
    console.error("Firebase Admin failed to initialize", err);
    messaging = null;
  }
}

export function fcmReady() {
  return Boolean(messaging);
}

const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export async function notifyBurnViaFcm(userId: string, alert: BurnAlertPayload) {
  if (!messaging) return;
  const tokens = await storage.listDevicePushTokens(userId);
  if (tokens.length === 0) return;

  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((row) => row.token),
    notification: { title: alert.title, body: alert.body },
    data: {
      kind: alert.kind,
      n: String(alert.n),
      title: alert.title,
      body: alert.body,
    },
    android: { priority: "high" },
  });

  await Promise.all(
    response.responses.map(async (result, index) => {
      if (result.success) return;
      const code = result.error?.code;
      if (code && INVALID_TOKEN_CODES.has(code)) {
        await storage.deleteDevicePushTokenByToken(tokens[index]!.token);
      }
    }),
  );
}
