import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { renderBurnAlert } from "@shared/burn-alert";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePublicWall } from "@/lib/wall";
import {
  attachNativePushListeners,
  nativePushAlertsReady,
  nativePushPermission,
  nativePushSupported,
  registerNativePush,
  syncNativePush,
  type BurnAlertNotice,
} from "@/lib/native-push";
import {
  persistSubscription,
  pushSupported as webPushSupported,
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
  const { data: wall } = usePublicWall();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isNative = nativePushSupported();
  const supported = isNative || webPushSupported();
  const prevUnread = useRef<number | null>(null);
  const [permission, setPermission] = useState<Permission>(() =>
    supported && !isNative && typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported",
  );
  const [prompt, setPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  const showInAppBurnAlert = useCallback(
    (alert: BurnAlertNotice) => {
      if (document.visibilityState !== "visible") return;
      const unread = Number.isFinite(alert.n) ? Math.max(1, alert.n!) : user?.unreadCount ?? 1;
      const rendered =
        alert.title && alert.body
          ? { title: alert.title, body: alert.body }
          : wall
            ? renderBurnAlert(wall, unread)
            : { title: "Pidaka", body: "A burn arrived." };
      toast({
        title: rendered.title,
        description: rendered.body,
      });
    },
    [toast, user?.unreadCount, wall],
  );

  const refreshBurnData = useCallback(() => {
    void refreshUser();
    void queryClient.invalidateQueries({ queryKey: ["/api/burns/inbox"] });
  }, [refreshUser]);

  const handleBurnArrived = useCallback(
    (alert: BurnAlertNotice = {}) => {
      if (Number.isFinite(alert.n)) {
        prevUnread.current = Math.max(alert.n!, prevUnread.current ?? 0);
      }
      refreshBurnData();
      showInAppBurnAlert(alert);
    },
    [refreshBurnData, showInAppBurnAlert],
  );

  useEffect(() => {
    if (!user) {
      prevUnread.current = null;
      return;
    }
    const current = user.unreadCount ?? 0;
    const pushActive = supported && permission === "granted";
    if (prevUnread.current !== null && current > prevUnread.current && !pushActive) {
      handleBurnArrived({ n: current });
    }
    prevUnread.current = current;
  }, [user, user?.unreadCount, handleBurnArrived, permission, supported]);

  const syncWeb = useCallback(async () => {
    if (!webPushSupported() || !user) {
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
  }, [user]);

  const syncNative = useCallback(async () => {
    if (!isNative || !user) {
      setPrompt(false);
      return;
    }
    if (!(await nativePushAlertsReady())) {
      setPrompt(false);
      return;
    }
    const current = await nativePushPermission();
    setPermission(current);
    if (current === "granted") {
      try {
        await syncNativePush();
      } catch {
        // register can fail when offline
      }
      setPrompt(false);
      return;
    }
    if (current === "denied") {
      setPrompt(false);
      return;
    }
    setPrompt(localStorage.getItem(SKIP_KEY) !== "1");
  }, [isNative, user]);

  const sync = useCallback(async () => {
    if (isNative) {
      await syncNative();
      return;
    }
    await syncWeb();
  }, [isNative, syncNative, syncWeb]);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (!user || !supported) return;

    if (isNative) {
      let active = true;
      let cleanup = () => {};
      void (async () => {
        const remove = await attachNativePushListeners({
          onBurn: handleBurnArrived,
          onOpenInbox: () => {
            navigate("/inbox");
            refreshBurnData();
          },
        });
        if (!active) {
          remove();
          return;
        }
        cleanup = remove;
      })();
      return () => {
        active = false;
        cleanup();
      };
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.kind !== "burn") return;
      handleBurnArrived({
        title: event.data.title,
        body: event.data.body,
        n: event.data.n,
      });
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
  }, [user, supported, isNative, handleBurnArrived, refreshBurnData, refreshUser, navigate]);

  const enable = useCallback(async () => {
    if (!supported || busy) return;
    setBusy(true);
    try {
      localStorage.removeItem(SKIP_KEY);
      if (isNative) {
        const granted = await registerNativePush();
        setPermission(granted ? "granted" : "denied");
        setPrompt(false);
        return;
      }
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setPrompt(false);
        return;
      }
      await syncWeb();
    } finally {
      setBusy(false);
    }
  }, [supported, busy, isNative, syncWeb]);

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
