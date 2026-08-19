import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteShell } from "@/components/site-shell";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PagedCopy } from "@/components/paged-copy";

interface BurnItem {
  id: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

interface PidakaThread {
  id: string;
  content: string;
  createdAt: string;
  live: boolean;
  burns: BurnItem[];
}

interface InboxResponse {
  threads: PidakaThread[];
}

export default function InboxPage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();

  const { data, isLoading, isError, isFetching, refetch } = useQuery<InboxResponse>({
    queryKey: ["/api/burns/inbox"],
    refetchInterval: 15000,
  });

  const threads = data?.threads ?? [];
  const burns = threads.flatMap((thread) => thread.burns);

  const unreadCount = burns.filter((b) => !b.readAt).length;

  useEffect(() => {
    if (unreadCount === 0) return;
    const t = window.setTimeout(async () => {
      try {
        await apiRequest("POST", "/api/burns/inbox/read");
        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/burns/inbox"] });
      } catch {
        // keep the badge if marking read fails
      }
    }, 1400);
    return () => window.clearTimeout(t);
  }, [unreadCount, refreshUser]);

  return (
    <SiteShell place="burns" fetching={isFetching && !isLoading}>
      <main className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-6">
        {user && !isLoading && (
          <p className="text-xs text-muted-foreground" data-testid="text-inbox-count">
            <span className="font-semibold text-foreground">{user.burnsReceivedCount}</span> received. They will not know it was you.
          </p>
        )}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="composer-glass rounded-xl border px-5 pt-4 pb-4 flex flex-col gap-3">
                <Skeleton className="h-4 w-full bg-foreground/10" />
                <Skeleton className="h-4 w-2/3 bg-foreground/10" />
                <Skeleton className="h-3 w-1/4 bg-foreground/10" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="font-serif text-xl">Burns could not be reached</p>
            <p className="text-sm text-muted-foreground">The room did not answer.</p>
            <Button onClick={() => void refetch()} data-testid="button-retry-inbox">
              Try again
            </Button>
          </div>
        ) : threads.length > 0 ? (
          <AnimatePresence initial={false}>
            {threads.map((thread, index) => (
              <motion.section
                key={thread.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
                className="flex flex-col gap-2"
                data-testid={`thread-pidaka-${thread.id}`}
              >
                <div className="composer-glass own-pidaka rounded-xl border" data-testid={`card-own-pidaka-${thread.id}`}>
                  <div className="px-5 pt-5 pb-4 flex flex-col gap-3">
                    <PagedCopy
                      text={thread.content}
                      className="text-[15px]"
                      testId={`text-own-pidaka-${thread.id}`}
                    />
                    <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="text-primary">yours</span>
                      <span className="normal-case tracking-normal">
                        {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
                        {thread.burns.length === 0
                          ? " · no burns yet"
                          : ` · ${thread.burns.length} ${thread.burns.length === 1 ? "burn" : "burns"}`}
                      </span>
                    </div>
                  </div>
                </div>

                {thread.burns.length > 0 ? (
                  <div className="flex flex-col gap-2 pl-3 sm:pl-5 border-l border-border/70 ml-2">
                    {thread.burns.map((burn) => (
                      <div
                        key={burn.id}
                        className={cn(
                          "composer-glass rounded-xl border",
                          !burn.readAt && "ring-1 ring-primary/35",
                        )}
                        data-testid={`card-burn-${burn.id}`}
                      >
                        <div className="px-5 pt-4 pb-4 flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0 mt-0.5">
                              <BurningCookieIcon className="h-4 w-4 text-primary" />
                            </div>
                            <PagedCopy
                              text={burn.message}
                              className="text-sm"
                              testId={`text-burn-${burn.id}`}
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-11" data-testid={`text-burn-time-${burn.id}`}>
                            <span>{formatDistanceToNow(new Date(burn.createdAt), { addSuffix: true })}</span>
                            <span className="text-muted-foreground/60">from a stranger</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pl-5 text-sm text-muted-foreground">Nobody has answered this one.</p>
                )}
              </motion.section>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16" data-testid="text-empty-inbox">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
            <BurningCookieIcon variant="hero" isLit className="h-16 w-16" />
            </div>
            <div className="text-center flex flex-col gap-2">
              <p className="font-serif text-xl">You have not spoken yet</p>
              <p className="text-sm text-muted-foreground">Paste a pidaka. Burns will wait here.</p>
              <Button className="mt-2" onClick={() => navigate("/")} data-testid="button-inbox-to-wall">
                Drop something on the wall
              </Button>
            </div>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
