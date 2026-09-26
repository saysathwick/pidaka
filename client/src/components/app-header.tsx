import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, LogOut, Menu, MessageCircle, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PidakaMark } from "@/components/pidaka-logo";
import { AppMenu } from "@/components/app-menu";
import { cn } from "@/lib/utils";

function IconAction({
  label,
  onClick,
  testId,
  children,
  current,
}: {
  label: string;
  onClick: () => void;
  testId: string;
  children: ReactNode;
  current?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          aria-label={label}
          aria-current={current ? "page" : undefined}
          className={cn("h-10 w-10", current && "bg-secondary")}
          data-testid={testId}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export type HeaderPlace = "wall" | "burns" | "legal";

export function AppHeader({
  place,
  fetching,
}: {
  place: HeaderPlace;
  fetching?: boolean;
}) {
  const { user, logout } = useAuth();
  const { showAuth } = useAuthModal();
  const { theme, toggleTheme, accentName, cycleAccent } = useTheme();
  const [location, navigate] = useLocation();
  const unread = user?.unreadCount ?? 0;
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!fetching) {
      setBusy(false);
      return;
    }
    const timer = window.setTimeout(() => setBusy(true), 350);
    return () => window.clearTimeout(timer);
  }, [fetching]);

  return (
    <header className="app-header sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:h-[3.75rem] sm:px-4">
        <div className="flex min-w-0 items-center gap-0.5">
          {place === "burns" && (
            <IconAction
              label="Back to the wall"
              onClick={() => navigate("/")}
              testId="button-back-wall"
            >
              <ArrowLeft className="h-4 w-4" />
            </IconAction>
          )}
          <button
            type="button"
            className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-left hover-elevate"
            onClick={() => navigate("/")}
            data-testid="text-brand"
          >
            <PidakaMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" isLit={place === "burns" || Boolean(user)} />
            <span className="flex min-w-0 flex-col justify-center">
              <span className="font-serif text-lg leading-none tracking-[0.18em] uppercase text-[#3d2a1a] dark:text-[#d4c4a8] sm:text-xl sm:tracking-[0.22em]">
                Pidaka
              </span>
              {place === "wall" && (
                <span className="mt-0.5 hidden font-serif text-[10px] tracking-wide text-[#6b5340] dark:text-[#a89078] sm:mt-1 sm:block">
                  pidaka.in
                </span>
              )}
              {place === "burns" && (
                <span
                  className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                  data-testid="text-inbox-title"
                >
                  Burns
                </span>
              )}
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {user ? (
            <>
              <span
                className="mr-1 hidden max-w-[9rem] truncate rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-foreground lg:inline"
                title="This name is only yours. The wall will never show it."
                data-testid="text-username"
              >
                {user.anonymousName}
              </span>
              <IconAction
                label={unread > 0 ? `Burns, ${unread} new` : "Burns"}
                onClick={() => navigate("/inbox")}
                testId="button-inbox"
                current={location === "/inbox"}
              >
                <span className="relative">
                  <MessageCircle className="h-4 w-4" />
                  {unread > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary"
                      data-testid="badge-unread"
                    />
                  )}
                </span>
              </IconAction>
              <div className="hidden items-center gap-0.5 md:flex">
                <IconAction
                  label={`${accentName}. Next accent`}
                  onClick={cycleAccent}
                  testId="button-accent-cycle"
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-primary ring-1 ring-primary/40" />
                </IconAction>
                <IconAction
                  label={theme === "dark" ? "Light wall" : "Dark wall"}
                  onClick={toggleTheme}
                  testId="button-theme-toggle"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </IconAction>
                <IconAction label="Leave" onClick={() => setLeaveOpen(true)} testId="button-logout">
                  <LogOut className="h-4 w-4" />
                </IconAction>
              </div>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-0.5 md:flex">
                <IconAction
                  label={`${accentName}. Next accent`}
                  onClick={cycleAccent}
                  testId="button-accent-cycle"
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-primary ring-1 ring-primary/40" />
                </IconAction>
                <IconAction
                  label={theme === "dark" ? "Light wall" : "Dark wall"}
                  onClick={toggleTheme}
                  testId="button-theme-toggle"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </IconAction>
              </div>
              <Button
                size="sm"
                className="mr-0.5 h-9 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
                onClick={showAuth}
                data-testid="button-drop-mask"
              >
                <span className="sm:hidden">Sign in</span>
                <span className="hidden sm:inline">Drop your mask</span>
              </Button>
            </>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            data-testid="button-open-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <AppMenu open={menuOpen} onOpenChange={setMenuOpen} />

      <AlertDialog
        open={leaveOpen}
        onOpenChange={(open) => {
          if (leaving) return;
          setLeaveOpen(open);
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
              data-testid="button-leave-cancel"
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
              data-testid="button-leave-confirm"
            >
              {leaving ? "Leaving..." : "Leave"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="h-px w-full overflow-hidden" aria-hidden>
        <div
          className={cn(
            "h-full bg-primary/80 transition-all duration-500",
            busy ? "w-full opacity-100" : "w-0 opacity-0",
          )}
        />
      </div>
    </header>
  );
}
