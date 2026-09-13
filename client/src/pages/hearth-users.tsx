import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, isNativeApp } from "@/lib/api-base";
import { useTheme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { clearHearthUsersToken, hearthUsersRequest } from "@/lib/hearth-users";
import { isHearthApp } from "@/lib/app-mode";
import type { AdminUser } from "@shared/wall";

export default function HearthUsersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme, accentName, cycleAccent } = useTheme();
  const [secret, setSecret] = useState("");
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = (await hearthUsersRequest("GET", "/api/admin/users")) as AdminUser[];
      setUsers(rows);
      setOpen(true);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401 || status === 403) {
        setOpen(false);
        setUsers([]);
      } else {
        toast({
          variant: "destructive",
          title: "The vault would not open",
          description: err instanceof Error ? err.message : "Try again.",
        });
      }
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
      await hearthUsersRequest("POST", "/api/admin/users/session", { secret });
      setSecret("");
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "That key does not open the vault",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const leave = async () => {
    setLeaving(true);
    clearHearthUsersToken();
    try {
      await fetch(apiUrl("/api/admin/users/logout"), {
        method: "POST",
        credentials: isNativeApp() ? "omit" : "include",
      });
    } catch {
      // still leave
    }
    setOpen(false);
    setUsers([]);
    setLeaving(false);
    setLeaveOpen(false);
  };

  const backToHearth = () => {
    if (isHearthApp()) {
      navigate("/");
      return;
    }
    navigate("/hearth");
  };

  return (
    <div className="min-h-screen bg-background wall-atmosphere">
      <header className="border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" className="text-left" onClick={backToHearth}>
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
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {open && (
              <Button variant="ghost" size="sm" onClick={() => setLeaveOpen(true)}>
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
            <AlertDialogTitle className="font-serif text-2xl font-normal">Leave the vault?</AlertDialogTitle>
            <AlertDialogDescription>
              Names stay on the wall. You will need the vault key to read them again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" disabled={leaving} onClick={() => setLeaveOpen(false)}>
              Stay
            </Button>
            <Button disabled={leaving} onClick={() => void leave()}>
              {leaving ? "Leaving..." : "Leave"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        {!open && !loading && (
          <form className="mx-auto flex w-full max-w-sm flex-col gap-5" onSubmit={(e) => void enter(e)}>
            <div className="text-center">
              <h1 className="font-serif text-3xl">The hearth</h1>
              <p className="mt-2 text-sm text-muted-foreground">A second key opens here.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="vault-key" className="text-xs uppercase tracking-wider">
                Vault key
              </Label>
              <Input
                id="vault-key"
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy === "enter"}>
              {busy === "enter" ? "Opening..." : "Open"}
            </Button>
          </form>
        )}

        {loading && !open && (
          <p className="text-center text-sm text-muted-foreground">Listening...</p>
        )}

        {open && (
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-2xl">Names</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {users.length} on the wall. Email, place, and device stay here.
              </p>
            </div>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has been named yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/70 rounded-xl border border-border bg-card/60">
                {users.map((user) => (
                  <li key={user.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-serif">{user.anonymousName}</p>
                      {user.saidOrigin ? (
                        <p className="mt-1 text-xs text-muted-foreground">Said: {user.saidOrigin}</p>
                      ) : null}
                      {user.locationJson ? (
                        <p className="mt-0.5 break-all text-[10px] text-muted-foreground/80">
                          Place: {user.locationJson}
                        </p>
                      ) : null}
                      {user.deviceJson ? (
                        <p className="mt-0.5 break-all text-[10px] text-muted-foreground/80">
                          Device: {user.deviceJson}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {user.authProvider} · {user.email}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
