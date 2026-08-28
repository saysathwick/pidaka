import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ThemeProvider } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import HearthPage from "@/pages/hearth";
import { initNativeChrome, useAndroidBackButton } from "@/lib/capacitor";
import "./index.css";

function HearthApp() {
  useAndroidBackButton();

  useEffect(() => {
    void initNativeChrome();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <ThemeProvider>
          <div className="app-shell min-h-screen bg-background wall-atmosphere">
            <HearthPage />
          </div>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<HearthApp />);
