import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, LogOut, MessageCircle } from "lucide-react";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { PidakaCard, type PidakaItem } from "@/components/pidaka-card";
import { PidakaComposer } from "@/components/pidaka-composer";
import { BurnRitual } from "@/components/burn-ritual";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";

export default function WallPage() {
  const { user, logout, refreshUser } = useAuth();
  const { showAuth } = useAuthModal();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [newContent, setNewContent] = useState("");
  const [burnTarget, setBurnTarget] = useState<PidakaItem | null>(null);

  const { data: pidakas, isLoading, isError } = useQuery<PidakaItem[]>({
    queryKey: ["/api/pidakas"],
    refetchInterval: 12000,
    retry: 1,
    placeholderData: (previous) => previous,
  });

  const knownIdsRef = useRef<Set<string> | null>(null);
  const seenSent = useRef(new Set<string>());
  const [sessionOrder, setSessionOrder] = useState<string[] | null>(null);

  const arrivingIds = useMemo(() => {
    if (!pidakas) return new Set<string>();
    if (!knownIdsRef.current) return new Set<string>();
    return new Set(pidakas.filter((p) => !knownIdsRef.current!.has(p.id)).map((p) => p.id));
  }, [pidakas]);

  useEffect(() => {
    if (!pidakas) return;
    knownIdsRef.current = new Set(pidakas.map((p) => p.id));
    setSessionOrder((prev) => {
      const liveIds = pidakas.map((p) => p.id);
      if (!prev) return liveIds;
      const known = new Set(prev);
      const newcomers = liveIds.filter((id) => !known.has(id));
      const live = new Set(liveIds);
      return [...newcomers, ...prev.filter((id) => live.has(id))];
    });
  }, [pidakas]);

  const displayPidakas = useMemo(() => {
    if (!pidakas) return pidakas;
    if (!sessionOrder) return pidakas;
    const byId = new Map(pidakas.map((p) => [p.id, p]));
    return sessionOrder
      .map((id) => byId.get(id))
      .filter((p): p is PidakaItem => Boolean(p));
  }, [pidakas, sessionOrder]);

  const handleSeen = useCallback((id: string) => {
    if (seenSent.current.has(id)) return;
    seenSent.current.add(id);
    void apiRequest("POST", `/api/pidakas/${id}/seen`);
  }, []);

  const createPidaka = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/pidakas", { content });
      return res.json();
    },
    onSuccess: () => {
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
      toast({ title: "On the wall", description: "Forty-eight hours. Then it is gone." });
    },
    onError: (err: Error) => {
      toast({ title: "The wall refused it", description: err.message, variant: "destructive" });
    },
  });

  const sendBurn = useMutation({
    mutationFn: async ({ pidakaId, message }: { pidakaId: string; message: string }) => {
      const res = await apiRequest("POST", `/api/burn/${pidakaId}`, { message });
      return res.json();
    },
    onSuccess: () => {
      setBurnTarget(null);
      refreshUser();
      toast({ title: "Burn sent", description: "Gone. They will not know." });
    },
    onError: (err: Error) => {
      toast({ title: "It did not take", description: err.message, variant: "destructive" });
    },
  });

  const handlePost = () => {
    if (!user) {
      showAuth();
      return;
    }
    if (!newContent.trim()) return;
    createPidaka.mutate(newContent.trim());
  };

  const handleBurnClick = (pidakaId: string) => {
    if (!user) {
      showAuth();
      return;
    }
    const target = pidakas?.find((p) => p.id === pidakaId) ?? null;
    setBurnTarget(target);
  };

  const composer = (
    <PidakaComposer
      value={newContent}
      pending={createPidaka.isPending}
      isGuest={!user}
      onChange={setNewContent}
      onSubmit={handlePost}
      onGuestClick={showAuth}
    />
  );

  const unread = user?.unreadCount ?? 0;

  return (
    <div className="min-h-screen bg-background wall-atmosphere">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5" data-testid="text-brand">
            <BurningCookieIcon className="h-7 w-7" />
            <span className="font-serif text-xl tracking-[0.18em] uppercase">Pidaka</span>
          </div>
          <div className="flex items-center gap-0.5 flex-wrap">
            {user ? (
              <>
                <span className="hidden sm:inline mr-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground" data-testid="text-username">
                  {user.anonymousName}
                </span>
                <Button size="icon" variant="ghost" onClick={() => navigate("/inbox")} data-testid="button-inbox" className="relative">
                  <MessageCircle className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" data-testid="badge-unread" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={logout} data-testid="button-logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button size="sm" onClick={showAuth} data-testid="button-drop-mask">
                  Drop your mask
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-36 md:pb-10 flex flex-col gap-5">
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-xl px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:inset-auto md:z-auto md:border-0 md:bg-transparent md:backdrop-blur-none md:p-0 md:pb-0">
          <div className="max-w-2xl mx-auto">
            {composer}
          </div>
        </div>

        {isLoading && !pidakas ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError && !pidakas ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-serif text-xl">The wall is dark tonight</p>
            <p className="text-sm text-muted-foreground">Could not reach the room. Stay. Try again.</p>
          </div>
        ) : displayPidakas && displayPidakas.length > 0 ? (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {displayPidakas.map((pidaka, index) => {
                const arrived = arrivingIds.has(pidaka.id);
                return (
                  <motion.div
                    key={pidaka.id}
                    layout
                    initial={arrived ? { opacity: 0, y: -22 } : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: arrived ? 0 : Math.min(index * 0.04, 0.28),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <PidakaCard
                      pidaka={pidaka}
                      onBurn={handleBurnClick}
                      arrived={arrived}
                      onSeen={handleSeen}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16" data-testid="text-empty-wall">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
            <BurningCookieIcon variant="hero" className="h-16 w-16" />
            </div>
            <div className="text-center flex flex-col gap-2">
              <p className="font-serif text-xl">Nobody has spoken tonight.</p>
              <p className="text-sm text-muted-foreground">The wall is listening. It will not keep your name.</p>
              {user && (
                <Button className="mt-2" onClick={() => document.querySelector<HTMLTextAreaElement>("[data-testid=input-pidaka-content]")?.focus()}>
                  Be the first
                </Button>
              )}
            </div>
          </div>
        )}
      </main>

      <BurnRitual
        pidaka={burnTarget}
        open={Boolean(burnTarget)}
        sending={sendBurn.isPending}
        onClose={() => setBurnTarget(null)}
        onSend={(message) => {
          if (!burnTarget) return;
          sendBurn.mutate({ pidakaId: burnTarget.id, message });
        }}
      />
    </div>
  );
}
