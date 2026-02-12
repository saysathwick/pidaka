import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Flame, Clock, Inbox as InboxIcon } from "lucide-react";
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
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2" data-testid="text-inbox-title">
            <InboxIcon className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">Burn Inbox</span>
          </div>
          {user && (
            <Badge variant="outline" className="ml-auto" data-testid="badge-inbox-count">
              {user.burnsReceivedCount} received
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : burns && burns.length > 0 ? (
          burns.map((burn) => (
            <Card key={burn.id} data-testid={`card-burn-${burn.id}`}>
              <CardContent className="pt-4 flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <Flame className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm whitespace-pre-wrap break-words" data-testid={`text-burn-${burn.id}`}>
                    {burn.message}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-burn-time-${burn.id}`}>
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(burn.createdAt), { addSuffix: true })}</span>
                  <span className="ml-1">from an anonymous stranger</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12" data-testid="text-empty-inbox">
            <InboxIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No burns yet. When someone responds to your pidakas, they'll appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}
