import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.pidaka.app",
  appName: "Pidaka",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: [
      "pidaka.in",
      "*.google.com",
      "*.google.co.in",
      "appleid.apple.com",
    ],
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
