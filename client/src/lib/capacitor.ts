import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function isNativeApp() {
  return Capacitor.isNativePlatform();
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
