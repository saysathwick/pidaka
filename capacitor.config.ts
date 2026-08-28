import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.pidaka.app",
  appName: "Pidaka",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    hostname: "pidaka.in",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
