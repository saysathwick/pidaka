import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, Send, Sun, Moon, LogOut, Zap, MessageCircle } from "lucide-react";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
import { useTheme } from "@/lib/theme";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface PidakaItem {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
}

export default function WallPage() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [newContent, setNewContent] = useState("");
  const [burnDialogOpen, setBurnDialogOpen] = useState(false);
  const [selectedPidakaId, setSelectedPidakaId] = useState<string | null>(null);
  const [burnMessage, setBurnMessage] = useState("");

  const { data: pidakas, isLoading } = useQuery<PidakaItem[]>({
    queryKey: ["/api/pidakas"],
    refetchInterval: 15000,
  });

  const createPidaka = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/pidakas", { content });
      return res.json();
    },
    onSuccess: () => {
      setNewContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
      toast({ title: "Posted", description: "Your pidaka is live on the wall" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const sendBurn = useMutation({
    mutationFn: async ({ pidakaId, message }: { pidakaId: string; message: string }) => {
      const res = await apiRequest("POST", `/api/burn/${pidakaId}`, { message });
      return res.json();
    },
    onSuccess: () => {
      setBurnDialogOpen(false);
      setBurnMessage("");
      setSelectedPidakaId(null);
      refreshUser();
      toast({ title: "Burn sent", description: "Your anonymous message was delivered" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handlePost = () => {
    if (!newContent.trim()) return;
    createPidaka.mutate(newContent.trim());
  };

  const handleBurnClick = (pidakaId: string) => {
    setSelectedPidakaId(pidakaId);
    setBurnMessage("");
    setBurnDialogOpen(true);
  };

  const handleSendBurn = () => {
    if (!selectedPidakaId || !burnMessage.trim()) return;
    sendBurn.mutate({ pidakaId: selectedPidakaId, message: burnMessage.trim() });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5" data-testid="text-brand">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-primary/20 blur-sm" />
              <BurningCookieIcon className="h-6 w-6 text-primary relative" />
            </div>
            <span className="font-bold text-xl tracking-tight">Pidaka</span>
          </div>
          <div className="flex items-center gap-0.5 flex-wrap">
            <Button size="icon" variant="ghost" onClick={() => navigate("/inbox")} data-testid="button-inbox">
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={logout} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <Card className="overflow-visible" data-testid="card-burns-sent">
            <CardContent className="pt-4 pb-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sent</span>
              </div>
              <span className="text-3xl font-bold tracking-tight ml-10" data-testid="text-burns-sent-count">
                {user?.burnsSentCount ?? 0}
              </span>
            </CardContent>
          </Card>
          <Card className="overflow-visible" data-testid="card-burns-received">
            <CardContent className="pt-4 pb-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-destructive/10">
                  <BurningCookieIcon className="h-4 w-4 text-destructive" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Received</span>
              </div>
              <span className="text-3xl font-bold tracking-tight ml-10" data-testid="text-burns-received-count">
                {user?.burnsReceivedCount ?? 0}
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 px-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground" data-testid="text-username">
            {user?.anonymousName}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col gap-3">
            <Textarea
              placeholder="Hey stranger? Wanna share?"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value.slice(0, 500))}
              className="resize-none text-sm min-h-[90px] border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
              data-testid="input-pidaka-content"
            />
            <div className="flex items-center justify-end">
              <Button
                onClick={handlePost}
                disabled={!newContent.trim() || createPidaka.isPending}
                data-testid="button-post-pidaka"
              >
                <Send className="h-4 w-4 mr-1.5" />
                {createPidaka.isPending ? "Pasting..." : "Paste Pidaka"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                    <div className="flex flex-col gap-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pidakas && pidakas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pidakas.map((pidaka) => (
              <Card key={pidaka.id} className="hover-elevate overflow-visible transition-all duration-200" data-testid={`card-pidaka-${pidaka.id}`}>
                <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" data-testid={`text-content-${pidaka.id}`}>
                    {pidaka.content}
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-time-${pidaka.id}`}>
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(pidaka.createdAt), { addSuffix: true })}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBurnClick(pidaka.id)}
                      className="text-primary"
                      data-testid={`button-burn-${pidaka.id}`}
                    >
                      <BurningCookieIcon className="h-3.5 w-3.5 mr-1" />
                      Burn
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-16" data-testid="text-empty-wall">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/5 blur-xl" />
              <BurningCookieIcon className="h-14 w-14 text-muted-foreground/50 relative" />
            </div>
            <div className="text-center flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">The wall is empty</p>
              <p className="text-xs text-muted-foreground/70">Be the first to paste something</p>
            </div>
          </div>
        )}
      </main>

      <Dialog open={burnDialogOpen} onOpenChange={setBurnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5" data-testid="text-burn-dialog-title">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                <BurningCookieIcon className="h-4 w-4 text-primary" />
              </div>
              Send Anonymous Burn
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" data-testid="text-burn-dialog-description">
            Your message will be delivered anonymously. The creator won't know who you are.
          </p>
          <Textarea
            placeholder="Write your anonymous message..."
            value={burnMessage}
            onChange={(e) => setBurnMessage(e.target.value.slice(0, 500))}
            className="resize-none min-h-[100px] border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
            data-testid="input-burn-message"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBurnDialogOpen(false)} data-testid="button-cancel-burn">
              Cancel
            </Button>
            <Button
              onClick={handleSendBurn}
              disabled={!burnMessage.trim() || sendBurn.isPending}
              data-testid="button-send-burn"
            >
              <BurningCookieIcon className="h-4 w-4 mr-1.5" />
              {sendBurn.isPending ? "Sending..." : "Send Burn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
