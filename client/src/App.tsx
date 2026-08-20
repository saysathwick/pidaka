import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AuthModalProvider, useAuthModal } from "@/lib/auth-modal";
import { ThemeProvider } from "@/lib/theme";
import { AuthDialog } from "@/pages/auth";
import WallPage from "@/pages/wall";
import InboxPage from "@/pages/inbox";
import NotFound from "@/pages/not-found";
import AboutPage from "@/pages/about";
import HearthPage from "@/pages/hearth";
import { usePageMeta } from "@/lib/page-meta";
import { CinematicIntro, shouldPlayIntro } from "@/components/cinematic-intro";
import { NameReveal } from "@/components/name-reveal";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { AnimatePresence, motion } from "framer-motion";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { showAuth } = useAuthModal();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      showAuth();
      navigate("/");
    }
  }, [isLoading, user, showAuth, navigate]);

  if (!user) return <WallPage />;
  return <>{children}</>;
}

function AppContent() {
  const { isLoading, justNamed, clearJustNamed } = useAuth();
  const [location] = useLocation();
  const [introDone, setIntroDone] = useState(() => !shouldPlayIntro());
  usePageMeta(location);
  const onHearth = location === "/hearth";

  if (onHearth) {
    return <HearthPage />;
  }

  if (!introDone) {
    return <CinematicIntro onComplete={() => setIntroDone(true)} />;
  }

  if (justNamed) {
    return <NameReveal name={justNamed} onComplete={clearJustNamed} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background wall-atmosphere">
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-primary/20 blur-2xl ember-breathe" />
          <BurningCookieIcon variant="hero" isLit className="h-20 w-20 relative" />
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={
            location === "/privacy" || location === "/terms" || location === "/contact" || location === "/about"
              ? "/about"
              : location
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Switch>
            <Route path="/" component={WallPage} />
            <Route path="/inbox">
              <RequireAuth>
                <InboxPage />
              </RequireAuth>
            </Route>
            <Route path="/about" component={AboutPage} />
            <Route path="/privacy" component={AboutPage} />
            <Route path="/terms" component={AboutPage} />
            <Route path="/contact" component={AboutPage} />
            <Route path="/hearth" component={HearthPage} />
            <Route component={NotFound} />
          </Switch>
        </motion.div>
      </AnimatePresence>
      <AuthDialog />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <ThemeProvider>
          <AuthProvider>
            <AuthModalProvider>
              <div className="pointer-events-none fixed inset-0 z-[80] film-grain opacity-[0.07] mix-blend-overlay" />
              <AppContent />
              <Toaster />
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
