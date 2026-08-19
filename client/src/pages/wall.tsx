import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { SiteShell } from "@/components/site-shell";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { PidakaCard, type PidakaItem } from "@/components/pidaka-card";
import { ComposeFab, ComposeOverlay, PidakaComposer } from "@/components/pidaka-composer";
import { BurnRitual } from "@/components/burn-ritual";
import { AnimatePresence, motion } from "framer-motion";

export default function WallPage() {
  const { user, refreshUser } = useAuth();
  const { showAuth } = useAuthModal();
  const { toast } = useToast();

  const [newContent, setNewContent] = useState("");
  const [burnTarget, setBurnTarget] = useState<PidakaItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composerInView, setComposerInView] = useState(true);
  const composerRef = useRef<HTMLDivElement>(null);

  const { data: pidakas, isLoading, isError, isFetching, refetch } = useQuery<PidakaItem[]>({
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
      setComposeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
      toast({ title: "On the wall" });
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

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setComposerInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.35, rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePost = () => {
    if (!user) {
      showAuth();
      return;
    }
    if (!newContent.trim()) return;
    createPidaka.mutate(newContent.trim());
  };

  const openCompose = () => {
    if (!user) {
      showAuth();
      return;
    }
    setComposeOpen(true);
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

  return (
    <SiteShell place="wall" fetching={isFetching && !isLoading} paddedFooter>
      <main className="max-w-6xl mx-auto px-4 pt-6 pb-28 sm:pb-12 flex flex-col gap-5">
        <div ref={composerRef} className="max-w-2xl mx-auto md:mx-0 md:max-w-none">
          {composer}
        </div>

        {isLoading && !pidakas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="composer-glass h-56 rounded-xl border px-5 pt-4 pb-4 flex flex-col gap-3">
                <Skeleton className="h-4 w-full bg-foreground/10" />
                <Skeleton className="h-4 w-3/4 bg-foreground/10" />
                <Skeleton className="h-2 w-full bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : isError && !pidakas ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-serif text-xl">The wall is dark tonight</p>
            <p className="text-sm text-muted-foreground">Could not reach the room.</p>
            <Button onClick={() => void refetch()} data-testid="button-retry-wall">
              Try again
            </Button>
          </div>
        ) : displayPidakas && displayPidakas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence initial={false}>
              {displayPidakas.map((pidaka, index) => {
                const arrived = arrivingIds.has(pidaka.id);
                return (
                  <motion.div
                    key={pidaka.id}
                    layout
                    className="min-w-0"
                    initial={arrived ? { opacity: 0, y: -22 } : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
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

      <ComposeFab
        visible={!composerInView && !composeOpen && !burnTarget}
        onClick={openCompose}
      />
      <ComposeOverlay
        open={composeOpen}
        value={newContent}
        pending={createPidaka.isPending}
        onChange={setNewContent}
        onSubmit={handlePost}
        onClose={() => setComposeOpen(false)}
      />

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
    </SiteShell>
  );
}
