import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { useLocation } from "wouter";

export async function initNativeChrome() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add("native-app");
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#070709" });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    // status bar API unavailable on this device
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
