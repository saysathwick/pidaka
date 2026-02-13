import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Clock, Send, Inbox, Sun, Moon, LogOut, ArrowUp, ArrowDown } from "lucide-react";
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

  const charCount = newContent.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2" data-testid="text-brand">
            <BurningCookieIcon className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">Pidaka</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="secondary" className="text-xs" data-testid="badge-username">
              {user?.anonymousName}
            </Badge>
            <Button size="icon" variant="ghost" onClick={() => navigate("/inbox")} data-testid="button-inbox">
              <Inbox className="h-4 w-4" />
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

      <main className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <ArrowUp className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Burns sent</span>
            <Badge variant="outline" data-testid="badge-burns-sent">{user?.burnsSentCount ?? 0}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDown className="h-4 w-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Burns received</span>
            <Badge variant="outline" data-testid="badge-burns-received">{user?.burnsReceivedCount ?? 0}</Badge>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4 flex flex-col gap-3">
            <Textarea
              placeholder="What's on your mind? Stay anonymous..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value.slice(0, 500))}
              className="resize-none text-sm min-h-[80px]"
              data-testid="input-pidaka-content"
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`text-xs ${charCount > 450 ? "text-destructive" : "text-muted-foreground"}`} data-testid="text-char-count">
                {charCount}/500
              </span>
              <Button
                onClick={handlePost}
                disabled={!newContent.trim() || createPidaka.isPending}
                data-testid="button-post-pidaka"
              >
                <Send className="h-4 w-4 mr-1.5" />
                {createPidaka.isPending ? "Posting..." : "Post Pidaka"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 flex flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pidakas && pidakas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {pidakas.map((pidaka) => (
              <Card key={pidaka.id} data-testid={`card-pidaka-${pidaka.id}`}>
                <CardContent className="pt-4 flex flex-col gap-3">
                  <p className="text-sm whitespace-pre-wrap break-words" data-testid={`text-content-${pidaka.id}`}>
                    {pidaka.content}
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-time-${pidaka.id}`}>
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(pidaka.createdAt), { addSuffix: true })}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBurnClick(pidaka.id)}
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
          <div className="text-center py-12" data-testid="text-empty-wall">
            <BurningCookieIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No pidakas yet. Be the first to post.</p>
          </div>
        )}
      </main>

      <Dialog open={burnDialogOpen} onOpenChange={setBurnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-burn-dialog-title">
              <BurningCookieIcon className="h-5 w-5 text-primary" />
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
            className="resize-none min-h-[100px]"
            data-testid="input-burn-message"
          />
          <div className="flex justify-between items-center">
            <span className={`text-xs ${burnMessage.length > 450 ? "text-destructive" : "text-muted-foreground"}`} data-testid="text-burn-char-count">
              {burnMessage.length}/500
            </span>
          </div>
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
