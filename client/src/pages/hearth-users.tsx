import { Fragment, useEffect, useMemo, useState } from "react";
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
import { parseDeviceJson, summarizeDevice } from "@/lib/device-details";
import type { AdminArchivedAccount, AdminUser } from "@shared/wall";

type DoorKey = "google" | "apple" | "phone" | "email" | "guest" | "other";

const DOORS: Array<{ key: DoorKey; label: string; match: (provider: string) => boolean }> = [
  { key: "google", label: "Google", match: (p) => p === "google" },
  { key: "apple", label: "Apple", match: (p) => p === "apple" },
  { key: "phone", label: "Phone", match: (p) => p === "phone" },
  { key: "email", label: "Email", match: (p) => p === "password" || p === "email" },
  { key: "guest", label: "Guest", match: (p) => p === "guest" },
  {
    key: "other",
    label: "Other",
    match: (p) => !["google", "apple", "phone", "password", "email", "guest"].includes(p),
  },
];

function userHaystack(user: AdminUser) {
  return [
    user.anonymousName,
    user.email,
    user.authProvider,
    user.saidOrigin ?? "",
    user.locationJson ?? "",
    user.deviceJson ?? "",
    user.createdAt,
  ]
    .join(" ")
    .toLowerCase();
}

function matchesQuery(user: AdminUser, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return userHaystack(user).includes(q);
}

function DeviceLine({ raw }: { raw: string }) {
  const device = parseDeviceJson(raw);
  const summary = device ? summarizeDevice(device) : "";
  const lookup = device?.model && device.model.length > 3 && !/^(iPhone|iPad|Mac)$/.test(device.model)
    ? `https://www.google.com/search?q=${encodeURIComponent([device.brand, device.model].filter(Boolean).join(" "))}`
    : "";
  return (
    <details className="mt-0.5 text-[10px] text-muted-foreground/80">
      <summary className="cursor-pointer select-none">
        Device: <span className="text-foreground/80">{summary || "Unknown"}</span>
        {lookup ? (
          <a
            href={lookup}
            target="_blank"
            rel="noreferrer"
            className="ml-1.5 underline underline-offset-2 hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            look up
          </a>
        ) : null}
      </summary>
      {device ? (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 break-all">
          {Object.entries(device)
            .filter(([, value]) => value !== "" && value != null)
            .map(([key, value]) => (
              <Fragment key={key}>
                <dt className="uppercase tracking-[0.12em]">{key}</dt>
                <dd className="text-foreground/70">{String(value)}</dd>
              </Fragment>
            ))}
        </dl>
      ) : (
        <p className="mt-1 break-all">{raw}</p>
      )}
    </details>
  );
}

function UserRow({
  user,
  busy,
  onSuspend,
}: {
  user: AdminUser;
  busy: boolean;
  onSuspend: (user: AdminUser) => void;
}) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
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
        {user.deviceJson ? <DeviceLine raw={user.deviceJson} /> : null}
        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {user.authProvider} · {user.email}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={busy}
        onClick={() => onSuspend(user)}
        data-testid={`button-suspend-${user.id}`}
      >
        Suspend
      </Button>
    </li>
  );
}

function DoorSection({
  label,
  users,
  query,
  onQueryChange,
  busyId,
  onSuspend,
}: {
  label: string;
  users: AdminUser[];
  query: string;
  onQueryChange: (value: string) => void;
  busyId: string | null;
  onSuspend: (user: AdminUser) => void;
}) {
  const filtered = useMemo(
    () => users.filter((user) => matchesQuery(user, query)),
    [users, query],
  );

  if (users.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="font-serif text-xl">{label}</h3>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {filtered.length}
            {query.trim() ? ` of ${users.length}` : ""} named
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}…`}
          className="sm:max-w-xs"
          aria-label={`Search ${label}`}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No names match this search.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/70 rounded-xl border border-border bg-card/60">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              busy={busyId === user.id}
              onSuspend={onSuspend}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function HearthUsersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme, accentName, cycleAccent } = useTheme();
  const [secret, setSecret] = useState("");
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [archived, setArchived] = useState<AdminArchivedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [globalQuery, setGlobalQuery] = useState("");
  const [doorQueries, setDoorQueries] = useState<Record<DoorKey, string>>({
    google: "",
    apple: "",
    phone: "",
    email: "",
    guest: "",
    other: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [rows, archivedRows] = await Promise.all([
        hearthUsersRequest("GET", "/api/admin/users") as Promise<AdminUser[]>,
        hearthUsersRequest("GET", "/api/admin/archived-accounts") as Promise<AdminArchivedAccount[]>,
      ]);
      setUsers(rows);
      setArchived(archivedRows);
      setOpen(true);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401 || status === 403) {
        setOpen(false);
        setUsers([]);
        setArchived([]);
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
    setArchived([]);
    setGlobalQuery("");
    setDoorQueries({ google: "", apple: "", phone: "", email: "", guest: "", other: "" });
    setLeaving(false);
    setLeaveOpen(false);
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    const target = suspendTarget;
    setBusy(target.id);
    try {
      const result = (await hearthUsersRequest("POST", `/api/admin/users/${target.id}/suspend`)) as {
        archived: AdminArchivedAccount;
      };
      setUsers((prev) => prev.filter((row) => row.id !== target.id));
      setArchived((prev) => [result.archived, ...prev]);
      setSuspendTarget(null);
      toast({ title: "Suspended", description: `${target.anonymousName} moved to the archive.` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not suspend",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const unsuspend = async (row: AdminArchivedAccount) => {
    setBusy(row.id);
    try {
      await hearthUsersRequest("POST", `/api/admin/archived-accounts/${row.id}/unsuspend`);
      setArchived((prev) => prev.filter((item) => item.id !== row.id));
      await load();
      toast({ title: "Unsuspended", description: `${row.anonymousName} is live again.` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not unsuspend",
        description: err instanceof Error ? err.message : "Try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  const backToHearth = () => {
    if (isHearthApp()) {
      navigate("/");
      return;
    }
    navigate("/hearth");
  };

  const globallyFiltered = useMemo(
    () => users.filter((user) => matchesQuery(user, globalQuery)),
    [users, globalQuery],
  );

  const grouped = useMemo(() => {
    const bags: Record<DoorKey, AdminUser[]> = {
      google: [],
      apple: [],
      phone: [],
      email: [],
      guest: [],
      other: [],
    };
    for (const user of globallyFiltered) {
      const provider = (user.authProvider || "").toLowerCase();
      const door = DOORS.find((d) => d.match(provider)) ?? DOORS[DOORS.length - 1];
      bags[door.key].push(user);
    }
    return bags;
  }, [globallyFiltered]);

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
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <div>
                <h2 className="font-serif text-2xl">Names</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {users.length} on the wall
                  {globalQuery.trim() ? ` · ${globallyFiltered.length} match` : ""}. Split by door.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="names-global-search" className="text-xs uppercase tracking-wider">
                  Search all
                </Label>
                <Input
                  id="names-global-search"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder="Name, email, place, provider…"
                  data-testid="input-names-global-search"
                />
              </div>
            </section>

            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has been named yet.</p>
            ) : globallyFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No names match that search.</p>
            ) : (
              DOORS.map((door) => (
                <DoorSection
                  key={door.key}
                  label={door.label}
                  users={grouped[door.key]}
                  query={doorQueries[door.key]}
                  onQueryChange={(value) =>
                    setDoorQueries((prev) => ({ ...prev, [door.key]: value }))
                  }
                  busyId={busy}
                  onSuspend={setSuspendTarget}
                />
              ))
            )}

            <section className="flex flex-col gap-3">
              <div>
                <h2 className="font-serif text-2xl">Archive</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Suspended, deactivated, and deleted names kept off the live wall.
                </p>
              </div>
              {archived.length === 0 ? (
                <p className="text-sm text-muted-foreground">Archive is empty.</p>
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border bg-card/40">
                  {archived.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-serif">{row.anonymousName}</p>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          {row.status} · {row.authProvider}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{row.archivedAt}</p>
                      </div>
                      {row.status === "suspended" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                          disabled={busy === row.id}
                          onClick={() => void unsuspend(row)}
                          data-testid={`button-unsuspend-${row.id}`}
                        >
                          Unsuspend
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      <AlertDialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => {
          if (busy) return;
          if (!open) setSuspendTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl font-normal">
              Suspend {suspendTarget?.anonymousName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They cannot sign in until a keeper unsuspends them. The name moves to the archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              disabled={Boolean(busy)}
              onClick={() => setSuspendTarget(null)}
            >
              Keep
            </Button>
            <Button disabled={Boolean(busy)} onClick={() => void confirmSuspend()}>
              {busy ? "Suspending..." : "Suspend"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
