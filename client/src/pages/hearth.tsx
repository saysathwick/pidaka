import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CowDungCake } from "@/components/burning-cookie-icon";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import {
  clearHearthToken,
  hearthRequest,
} from "@/lib/hearth";
import type { AdminPidaka, AdminStats, AdminUser, PublicWall, WallSettings } from "@shared/wall";

type Overview = {
  settings: WallSettings;
  wall: PublicWall;
  stats: AdminStats;
};

function excerpt(text: string, max = 140) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trim()}…`;
}

export default function HearthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme, accentName, cycleAccent } = useTheme();
  const [secret, setSecret] = useState("");
  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [pidakas, setPidakas] = useState<AdminPidaka[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [nextOverview, nextPidakas, nextUsers] = await Promise.all([
        hearthRequest("GET", "/api/admin/overview") as Promise<Overview>,
        hearthRequest("GET", "/api/admin/pidakas") as Promise<AdminPidaka[]>,
        hearthRequest("GET", "/api/admin/users") as Promise<AdminUser[]>,
      ]);
      setOverview(nextOverview);
      setNotice(nextOverview.settings.notice);
      setPidakas(nextPidakas);
      setUsers(nextUsers);
      setOpen(true);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        clearHearthToken();
        setOpen(false);
        setOverview(null);
        return;
      }
      toast({
        title: "The hearth would not open",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const enter = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("enter");
    try {
      await hearthRequest("POST", "/api/admin/session", { secret });
      setSecret("");
      await load();
    } catch (err) {
      toast({
        title: "That key does not open the hearth",
        description: err instanceof Error ? err.message : "Wrong key",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const patch = async (partial: Partial<WallSettings>) => {
    setBusy("settings");
    try {
      const data = await hearthRequest("PATCH", "/api/admin/settings", partial) as {
        settings: WallSettings;
        wall: PublicWall;
      };
      setOverview((prev) => prev ? { ...prev, settings: data.settings, wall: data.wall } : prev);
      if (partial.notice !== undefined) setNotice(data.settings.notice);
      queryClient.invalidateQueries({ queryKey: ["/api/wall"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
    } catch (err) {
      toast({
        title: "Could not keep that change",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const takeDown = async (id: string) => {
    setBusy(id);
    try {
      await hearthRequest("DELETE", `/api/admin/pidakas/${id}`);
      setPidakas((prev) => prev.filter((row) => row.id !== id));
      setOverview((prev) => prev
        ? { ...prev, stats: { ...prev.stats, pidakas: Math.max(0, prev.stats.pidakas - 1) } }
        : prev);
      queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
      toast({ title: "Taken down" });
    } catch (err) {
      toast({
        title: "It stayed on the wall",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const leave = async () => {
    setLeaving(true);
    clearHearthToken();
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {
      // still leave
    }
    setOpen(false);
    setOverview(null);
    setPidakas([]);
    setUsers([]);
    setLeaving(false);
    setLeaveOpen(false);
  };

  return (
    <div className="min-h-screen bg-background wall-atmosphere">
      <header className="border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" className="text-left" onClick={() => navigate("/")}>
            <p className="font-serif text-lg tracking-[0.18em] uppercase">Pidaka</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Hearth</p>
          </button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={cycleAccent}
              aria-label={`${accentName}. Next accent`}
              title={`${accentName}. Next accent`}
              data-testid="button-hearth-accent"
            >
              <span className="h-3.5 w-3.5 rounded-full bg-primary ring-1 ring-primary/40" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Light hearth" : "Dark hearth"}
              title={theme === "dark" ? "Light hearth" : "Dark hearth"}
              data-testid="button-hearth-theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {open && (
              <Button variant="ghost" size="sm" onClick={() => setLeaveOpen(true)} data-testid="button-hearth-leave">
                Leave
              </Button>
            )}
          </div>
        </div>
      </header>

      <AlertDialog
        open={leaveOpen}
        onOpenChange={(next) => {
          if (leaving) return;
          setLeaveOpen(next);
        }}
      >
        <AlertDialogContent className="!fixed left-1/2 top-[42%] z-[90] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border-border sm:top-1/2">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-normal">Leave the hearth?</AlertDialogTitle>
            <AlertDialogDescription>
              The fire stays. You will need the key to come back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              disabled={leaving}
              onClick={() => setLeaveOpen(false)}
              data-testid="button-hearth-leave-cancel"
            >
              Stay
            </Button>
            <Button
              disabled={leaving}
              onClick={() => void leave()}
              data-testid="button-hearth-leave-confirm"
            >
              {leaving ? "Leaving..." : "Leave"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
        {!open && !loading && (
          <form onSubmit={enter} className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
            <CowDungCake variant="hero" isLit className="h-20 w-20" />
            <div className="text-center">
              <h1 className="font-serif text-3xl">The hearth</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                For the keeper. Not for the wall.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="hearth-key" className="text-xs uppercase tracking-wider">
                Key
              </Label>
              <Input
                id="hearth-key"
                type="password"
                autoComplete="current-password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                data-testid="input-hearth-key"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy === "enter"} data-testid="button-hearth-enter">
              {busy === "enter" ? "Opening..." : "Enter"}
            </Button>
          </form>
        )}

        {loading && !overview && (
          <p className="text-center text-sm text-muted-foreground">Tending the fire...</p>
        )}

        {overview && (
          <>
            <section className="grid grid-cols-3 gap-3">
              <Stat label="Names" value={overview.stats.users} />
              <Stat label="Live pidakas" value={overview.stats.pidakas} />
              <Stat label="Burns" value={overview.stats.burns} />
            </section>

            <section className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-5">
              <div>
                <h2 className="font-serif text-2xl">Doors</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hide a way in without a deploy. Google and Apple stay dark until their keys are on the server.
                </p>
              </div>
              <Door
                label="Google"
                checked={overview.settings.googleLogin}
                ready={overview.wall.googleReady}
                disabled={busy === "settings"}
                onCheckedChange={(googleLogin) => void patch({ googleLogin })}
              />
              <Door
                label="Apple"
                checked={overview.settings.appleLogin}
                ready={overview.wall.appleReady}
                disabled={busy === "settings"}
                onCheckedChange={(appleLogin) => void patch({ appleLogin })}
              />
              <Door
                label="Phone"
                checked={overview.settings.phoneLogin}
                disabled={busy === "settings"}
                onCheckedChange={(phoneLogin) => void patch({ phoneLogin })}
              />
              <Door
                label="Email"
                checked={overview.settings.emailLogin}
                disabled={busy === "settings"}
                onCheckedChange={(emailLogin) => void patch({ emailLogin })}
              />
            </section>

            <section className="flex flex-col gap-4 rounded-xl border border-border bg-card/60 p-5">
              <h2 className="font-serif text-2xl">The wall</h2>
              <Door
                label="New names"
                hint="Existing people can still come back."
                checked={overview.settings.registrationsOpen}
                disabled={busy === "settings"}
                onCheckedChange={(registrationsOpen) => void patch({ registrationsOpen })}
              />
              <Door
                label="Pasting"
                hint="Reading stays free."
                checked={overview.settings.postingOpen}
                disabled={busy === "settings"}
                onCheckedChange={(postingOpen) => void patch({ postingOpen })}
              />
              <Door
                label="Burns"
                checked={overview.settings.burningOpen}
                disabled={busy === "settings"}
                onCheckedChange={(burningOpen) => void patch({ burningOpen })}
              />
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void patch({ notice });
                }}
              >
                <Label htmlFor="wall-notice" className="text-xs uppercase tracking-wider">
                  Notice on the wall
                </Label>
                <Textarea
                  id="wall-notice"
                  value={notice}
                  onChange={(e) => setNotice(e.target.value)}
                  maxLength={280}
                  placeholder="Optional. Shown above the pastes."
                  className="min-h-[88px] bg-background"
                  data-testid="input-wall-notice"
                />
                <Button type="submit" variant="secondary" className="self-start" disabled={busy === "settings"}>
                  Keep the notice
                </Button>
              </form>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-serif text-2xl">Live pidakas</h2>
              {pidakas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing on the plaster.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pidakas.map((row) => (
                    <li key={row.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm leading-relaxed">{excerpt(row.content)}</p>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {row.anonymousName}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy === row.id}
                        onClick={() => void takeDown(row.id)}
                        data-testid={`button-takedown-${row.id}`}
                      >
                        Take down
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="font-serif text-2xl">Names</h2>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nobody has been named yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border/70 rounded-xl border border-border bg-card/60">
                  {users.map((user) => (
                    <li key={user.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="font-serif">{user.anonymousName}</p>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {user.authProvider} · {user.email}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </div>
  );
}

function Door({
  label,
  hint,
  checked,
  ready,
  disabled,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  ready?: boolean;
  disabled?: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  const blocked = ready === false;
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm">{label}</p>
        {blocked && (
          <p className="mt-1 text-xs text-muted-foreground">
            Not wired on this server. The button stays hidden until the keys are set.
          </p>
        )}
        {!blocked && hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}
