import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BurnItem {
  id: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  pidakaExcerpt: string;
}

export default function InboxPage() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();

  const { data: burns, isLoading } = useQuery<BurnItem[]>({
    queryKey: ["/api/burns/inbox"],
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!burns || burns.length === 0) return;
    const hasUnread = burns.some((b) => !b.readAt);
    if (!hasUnread) return;
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
  }, [burns, refreshUser]);

  return (
    <div className="min-h-screen bg-background wall-atmosphere">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5" data-testid="text-inbox-title">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm" />
            <BurningCookieIcon className="h-6 w-6" isLit />
            </div>
            <span className="font-serif text-lg tracking-[0.14em] uppercase">Burns</span>
          </div>
          {user && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-inbox-count">
              <span className="font-semibold text-foreground text-sm">{user.burnsReceivedCount}</span>
              <span>received</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : burns && burns.length > 0 ? (
          <AnimatePresence initial={false}>
            {burns.map((burn, index) => (
              <motion.div
                key={burn.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
              >
                <Card
                  className={cn("overflow-hidden", !burn.readAt && "border-primary/40")}
                  data-testid={`card-burn-${burn.id}`}
                >
                  <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                    {burn.pidakaExcerpt && (
                      <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                        On: “{burn.pidakaExcerpt}”
                      </p>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0 mt-0.5">
                        <BurningCookieIcon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" data-testid={`text-burn-${burn.id}`}>
                        {burn.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-11" data-testid={`text-burn-time-${burn.id}`}>
                      <span>{formatDistanceToNow(new Date(burn.createdAt), { addSuffix: true })}</span>
                      <span className="text-muted-foreground/60">from a stranger</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16" data-testid="text-empty-inbox">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
            <BurningCookieIcon variant="hero" isLit className="h-16 w-16" />
            </div>
            <div className="text-center flex flex-col gap-2">
              <p className="font-serif text-xl">Nobody has answered you</p>
              <p className="text-sm text-muted-foreground">Speak on the wall. Someone might burn it.</p>
              <Button className="mt-2" onClick={() => navigate("/")} data-testid="button-inbox-to-wall">
                Drop something on the wall
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
