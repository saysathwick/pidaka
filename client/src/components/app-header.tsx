import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LogOut, MessageCircle, Moon, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";
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
          className={cn(current && "bg-secondary")}
          data-testid={testId}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function AppHeader({
  place,
  fetching,
}: {
  place: "wall" | "burns";
  fetching?: boolean;
}) {
  const { user, logout } = useAuth();
  const { showAuth } = useAuthModal();
  const { theme, toggleTheme, accentName, cycleAccent } = useTheme();
  const [location, navigate] = useLocation();
  const unread = user?.unreadCount ?? 0;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!fetching) {
      setBusy(false);
      return;
    }
    const timer = window.setTimeout(() => setBusy(true), 350);
    return () => window.clearTimeout(timer);
  }, [fetching]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 px-4 py-2.5">
        <button
          type="button"
          className="flex min-w-0 items-center gap-2.5 rounded-md px-1 py-1 text-left hover-elevate"
          onClick={() => navigate("/")}
          data-testid="text-brand"
        >
          <BurningCookieIcon className="h-7 w-7 shrink-0" isLit={place === "burns" || Boolean(user)} />
          <span className="font-serif text-xl tracking-[0.18em] uppercase">Pidaka</span>
          {place === "wall" && (
            <span className="hidden sm:inline-flex items-center gap-1.5 pl-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary ember-breathe" />
              Listening
            </span>
          )}
          {place === "burns" && (
            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] text-muted-foreground" data-testid="text-inbox-title">
              Burns
            </span>
          )}
        </button>

        <div className="flex items-center gap-0.5">
          {user ? (
            <>
              <span
                className="mr-1 hidden max-w-[9rem] truncate rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-foreground sm:inline"
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
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" data-testid="badge-unread" />
                  )}
                </span>
              </IconAction>
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
              <IconAction label="Leave" onClick={logout} testId="button-logout">
                <LogOut className="h-4 w-4" />
              </IconAction>
            </>
          ) : (
            <>
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
              <Button size="sm" onClick={showAuth} data-testid="button-drop-mask">
                Drop your mask
              </Button>
            </>
          )}
        </div>
      </div>
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
