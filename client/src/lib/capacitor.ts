import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { useEffect } from "react";
import { useLocation } from "wouter";

export async function initNativeChrome() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add("native-app");
  try {
    // The app is edge-to-edge; CSS --safe-top / --safe-bottom keep chrome clear of the bars.
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch {
    // system bars API unavailable on this device
  }
}

export function useAndroidBackButton() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (location !== "/") {
        navigate("/");
        return;
      }
      if (canGoBack) {
        window.history.back();
        return;
      }
      void CapApp.exitApp();
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [location, navigate]);
}
