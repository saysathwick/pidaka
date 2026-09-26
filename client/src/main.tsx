import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App";
import "./index.css";

// Apply before first paint so safe-area CSS is ready on native
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("native-app");
}

createRoot(document.getElementById("root")!).render(<App />);
