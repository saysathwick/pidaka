import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface BurnItem {
  id: string;
  message: string;
  createdAt: string;
}

export default function InboxPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: burns, isLoading } = useQuery<BurnItem[]>({
    queryKey: ["/api/burns/inbox"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5" data-testid="text-inbox-title">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm" />
              <BurningCookieIcon className="h-5 w-5 text-primary relative" />
            </div>
            <span className="font-bold text-lg tracking-tight">Burns</span>
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
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : burns && burns.length > 0 ? (
          burns.map((burn) => (
            <Card key={burn.id} className="overflow-visible" data-testid={`card-burn-${burn.id}`}>
              <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 shrink-0 mt-0.5">
                    <BurningCookieIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" data-testid={`text-burn-${burn.id}`}>
                    {burn.message}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-11" data-testid={`text-burn-time-${burn.id}`}>
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(burn.createdAt), { addSuffix: true })}</span>
                  <span className="text-muted-foreground/60">from a stranger</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center gap-4 py-16" data-testid="text-empty-inbox">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
              <MessageCircle className="h-14 w-14 text-muted-foreground/50 relative" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">No burns yet</p>
              <p className="text-xs text-muted-foreground/70">When someone responds to your pidakas, they'll show up here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
