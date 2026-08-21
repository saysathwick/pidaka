import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import {
  persistSubscription,
  pushSupported,
  urlBase64ToUint8Array,
  vapidKey,
} from "@/lib/push-client";

const SKIP_KEY = "pidaka_push_skip";

type Permission = NotificationPermission | "unsupported";

interface BurnAlertContextType {
  supported: boolean;
  permission: Permission;
  prompt: boolean;
  busy: boolean;
  enable: () => Promise<void>;
  skip: () => void;
}

const BurnAlertContext = createContext<BurnAlertContextType | null>(null);

export function BurnAlertProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const supported = pushSupported();
  const [permission, setPermission] = useState<Permission>(() =>
    supported ? Notification.permission : "unsupported",
  );
  const [prompt, setPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  const sync = useCallback(async () => {
    if (!supported || !user) {
      setPrompt(false);
      return;
    }
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch {
      setPrompt(false);
      return;
    }
    const current = Notification.permission;
    setPermission(current);
    if (current === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await persistSubscription(existing);
        } else {
          const publicKey = await vapidKey();
          if (!publicKey) return;
          const next = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
          await persistSubscription(next);
        }
      } catch {
        // permission is granted but subscribe can still fail offline
      }
      setPrompt(false);
      return;
    }
    if (current === "denied") {
      setPrompt(false);
      return;
    }
    setPrompt(localStorage.getItem(SKIP_KEY) !== "1");
  }, [supported, user]);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (!user || !supported) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.kind !== "burn") return;
      void refreshUser();
      void queryClient.invalidateQueries({ queryKey: ["/api/burns/inbox"] });
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshUser();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, supported, refreshUser]);

  const enable = useCallback(async () => {
    if (!supported || busy) return;
    setBusy(true);
    try {
      localStorage.removeItem(SKIP_KEY);
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setPrompt(false);
        return;
      }
      await sync();
    } finally {
      setBusy(false);
    }
  }, [supported, busy, sync]);

  const skip = useCallback(() => {
    localStorage.setItem(SKIP_KEY, "1");
    setPrompt(false);
  }, []);

  return (
    <BurnAlertContext.Provider value={{ supported, permission, prompt: Boolean(user) && prompt, busy, enable, skip }}>
      {children}
    </BurnAlertContext.Provider>
  );
}

export function useBurnAlerts() {
  const context = useContext(BurnAlertContext);
  if (!context) {
    throw new Error("useBurnAlerts must be used within a BurnAlertProvider");
  }
  return context;
}
