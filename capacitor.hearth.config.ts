import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.pidaka.hearth",
  appName: "Hearth",
  webDir: "dist/hearth-public",
  android: {
    path: "android-hearth",
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
