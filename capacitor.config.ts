import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shadowplayer.app",
  appName: "Shadow Player",
  webDir: "dist/client",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#0b0e14",
  },
};

export default config;
