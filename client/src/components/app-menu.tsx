import { useState } from "react";
import { useLocation } from "wouter";
import {
  FileText,
  HeartHandshake,
  Info,
  LogOut,
  Mail,
  Moon,
  Shield,
  Sun,
  Trash2,
  UserX,
  Flame,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { useTheme } from "@/lib/theme";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { requestDropIt } from "@/components/global-drop-fab";

const LEGAL_LINKS = [
  { href: "/about", label: "About", icon: Info },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/terms", label: "Terms", icon: FileText },
  { href: "/contact", label: "Contact", icon: Mail },
  { href: "/child-safety", label: "Child safety", icon: HeartHandshake },
] as const;

function MenuRow({
  label,
  onClick,
  testId,
  icon: Icon,
  danger,
}: {
  label: string;
  onClick: () => void;
  testId: string;
  icon: typeof Info;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors",
        "hover:bg-secondary/80 active:bg-secondary",
        danger ? "text-destructive" : "text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <span>{label}</span>
    </button>
  );
}

export function AppMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const { showAuth } = useAuthModal();
  const { theme, toggleTheme, accentName, cycleAccent } = useTheme();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [confirmKind, setConfirmKind] = useState<"deactivate" | "delete" | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const close = () => onOpenChange(false);

  const submitAccountRequest = async (kind: "deactivate" | "delete") => {
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/account/request", { kind });
      const data = (await res.json()) as { message?: string };
      await logout();
      setConfirmKind(null);
      close();
      toast({
        title: kind === "delete" ? "Delete requested" : "Deactivate requested",
        description: data.message || (kind === "delete"
          ? "Your account will be permanently deleted."
          : "Your account will be archived."),
      });
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not send that request";
      toast({ title: "Request failed", description: message.replace(/^\d{3}:\s*/, ""), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="z-[60] flex w-[min(100%,20rem)] flex-col gap-0 border-border bg-card p-0 pt-[max(0.75rem,var(--safe-top,env(safe-area-inset-top,0px)))] sm:max-w-sm"
        >
          <SheetHeader className="border-b border-border/60 px-5 pb-5 pt-4 pr-12 text-left">
            <SheetTitle className="font-serif text-xl font-normal tracking-[0.18em] uppercase">
              Menu
            </SheetTitle>
            <SheetDescription className="text-xs leading-relaxed">
              {user
                ? `Signed in as ${user.anonymousName}. This name is only yours.`
                : "Read free, or take a name to paste and burn."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            {!user && (
              <div className="mb-3 px-2">
                <Button
                  className="h-11 w-full"
                  onClick={() => {
                    close();
                    showAuth();
                  }}
                  data-testid="button-menu-drop-mask"
                >
                  Drop your mask
                </Button>
              </div>
            )}

            <p className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Wall
            </p>
            <MenuRow
              label="Drop it"
              icon={Flame}
              testId="button-menu-drop-it"
              onClick={() => {
                close();
                requestDropIt(navigate, location);
              }}
            />

            <div className="my-3 h-px bg-border/70" />
            <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Legal
            </p>
            {LEGAL_LINKS.map((link) => (
              <MenuRow
                key={link.href}
                label={link.label}
                icon={link.icon}
                testId={`button-menu-${link.href.slice(1)}`}
                onClick={() => go(link.href)}
              />
            ))}

            {user && (
              <>
                <div className="my-3 h-px bg-border/70" />
                <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Account
                </p>
                <MenuRow
                  label="Leave"
                  icon={LogOut}
                  testId="button-menu-leave"
                  onClick={() => {
                    close();
                    setLeaveOpen(true);
                  }}
                />
                <MenuRow
                  label="Deactivate"
                  icon={UserX}
                  testId="button-menu-deactivate"
                  onClick={() => {
                    close();
                    setConfirmKind("deactivate");
                  }}
                />
                <MenuRow
                  label="Delete account"
                  icon={Trash2}
                  danger
                  testId="button-menu-delete"
                  onClick={() => {
                    close();
                    setConfirmKind("delete");
                  }}
                />
              </>
            )}

            <div className="my-3 h-px bg-border/70" />

            <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Look
            </p>
            <MenuRow
              label={theme === "dark" ? "Light wall" : "Dark wall"}
              icon={theme === "dark" ? Sun : Moon}
              testId="button-menu-theme"
              onClick={toggleTheme}
            />
            <button
              type="button"
              onClick={cycleAccent}
              data-testid="button-menu-accent"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-foreground hover:bg-secondary/80 active:bg-secondary"
            >
              <span className="h-4 w-4 shrink-0 rounded-full bg-primary ring-1 ring-primary/40" />
              <span>{accentName}</span>
            </button>
          </div>

          <div className="border-t border-border/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="font-serif text-[10px] tracking-[0.16em] uppercase text-muted-foreground">
              pidaka.in
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={leaveOpen}
        onOpenChange={(next) => {
          if (leaving) return;
          setLeaveOpen(next);
        }}
      >
        <AlertDialogContent className="!fixed left-1/2 top-[42%] z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border-border sm:top-1/2">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-normal">
              Leave the wall?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your name stays. You will have to sign in again to paste or burn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              disabled={leaving}
              onClick={() => setLeaveOpen(false)}
              data-testid="button-menu-leave-cancel"
            >
              Stay
            </Button>
            <Button
              disabled={leaving}
              onClick={async () => {
                setLeaving(true);
                await logout();
                setLeaving(false);
                setLeaveOpen(false);
                if (location === "/inbox") navigate("/");
              }}
              data-testid="button-menu-leave-confirm"
            >
              {leaving ? "Leaving..." : "Leave"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmKind !== null}
        onOpenChange={(next) => {
          if (busy) return;
          if (!next) setConfirmKind(null);
        }}
      >
        <AlertDialogContent className="!fixed left-1/2 top-[42%] z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border-border sm:top-1/2">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-normal">
              {confirmKind === "delete" ? "Delete this name?" : "Deactivate this name?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmKind === "delete"
                ? "Your account will be permanently deleted. You will be signed out. This cannot be undone."
                : "Your account will be archived. You will be signed out. Sign in later to ask the keepers to open it again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setConfirmKind(null)}
              data-testid="button-account-request-cancel"
            >
              Stay
            </Button>
            <Button
              variant={confirmKind === "delete" ? "destructive" : "default"}
              disabled={busy || !confirmKind}
              onClick={() => confirmKind && void submitAccountRequest(confirmKind)}
              data-testid="button-account-request-confirm"
            >
              {busy ? "Sending..." : confirmKind === "delete" ? "Delete permanently" : "Archive account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
