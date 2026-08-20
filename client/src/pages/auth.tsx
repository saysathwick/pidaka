import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { CowDungCake } from "@/components/burning-cookie-icon";
import { ArrowLeft, Mail } from "lucide-react";
import { Link } from "wouter";
import { usePublicWall } from "@/lib/wall";

function formMessage(err: unknown, fallback: string) {
  const raw = err instanceof Error ? err.message : fallback;
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      // keep the raw error
    }
  }
  return raw.replace(/^\d{3}:\s*/, "") || fallback;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.6 3.6v3h4.2c2.4-2.2 3.8-5.5 3.8-9.7z" />
      <path fill="#34A853" d="M12 24c3.5 0 6.4-1.2 8.5-3.1l-4.2-3.2c-1.2.8-2.7 1.3-4.3 1.3-3.3 0-6.1-2.2-7.1-5.2H.6v3.3C2.7 21.5 7 24 12 24z" />
      <path fill="#FBBC05" d="M4.9 13.8c-.3-.8-.4-1.6-.4-2.5s.1-1.7.4-2.5V5.5H.6C.2 7.2 0 9.1 0 11.3s.2 4.1.6 5.8l4.3-3.3z" />
      <path fill="#EA4335" d="M12 4.8c1.9 0 3.6.7 5 1.9l3.7-3.7C18.4 1.1 15.5 0 12 0 7 0 2.7 2.5.6 6.2l4.3 3.3C5.9 6.9 8.7 4.8 12 4.8z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-1-3-.9c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1.2 1-2.3 1-2.4-.1 0-1.9-.7-1.9-3.9zM14.7 5.8c.6-.8 1.1-1.8.9-2.8-1 .1-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.8 1.1.1 2.2-.6 2.9-1.5z" />
    </svg>
  );
}

export function AuthForm() {
  const [step, setStep] = useState<"choose" | "phone" | "code" | "email">("choose");
  const [emailMode, setEmailMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState<"google" | "apple" | "phone" | "email" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { completeSession, authError, clearAuthError } = useAuth();
  const { toast } = useToast();
  const { hideAuth } = useAuthModal();
  const { data: wall } = usePublicWall();

  useEffect(() => {
    if (!authError) return;
    setFormError(authError);
    toast({ title: "Sign-in did not take", description: authError, variant: "destructive" });
    clearAuthError();
  }, [authError, clearAuthError, toast]);

  const afterSession = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading("email");
    try {
      const path = emailMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const res = await apiRequest("POST", path, { email, password });
      const data = await res.json();
      completeSession({
        ...data,
        created: emailMode === "register" ? true : data.created,
      });
      afterSession();
    } catch (err: unknown) {
      const message = formMessage(err, emailMode === "register" ? "Could not create that account" : "Could not sign in");
      setFormError(message);
      toast({
        title: emailMode === "register" ? "Could not create that account" : "Could not sign in",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const startPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading("phone");
    try {
      const res = await apiRequest("POST", "/api/auth/phone/start", { phone });
      const data = await res.json() as { demoCode?: string };
      setStep("code");
      setCode("");
      toast({
        title: "Code sent",
        description: data.demoCode
          ? `On this local wall the code is ${data.demoCode}`
          : "Check your messages.",
      });
    } catch (err: unknown) {
      const message = formMessage(err, "Could not send a code");
      setFormError(message);
      toast({ title: "Could not send a code", description: message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const verifyPhone = async (value: string) => {
    if (value.length !== 6) return;
    setFormError(null);
    setLoading("phone");
    try {
      const res = await apiRequest("POST", "/api/auth/phone/verify", { phone, code: value });
      const data = await res.json();
      completeSession(data);
      afterSession();
    } catch (err: unknown) {
      const message = formMessage(err, "That code did not work");
      setFormError(message);
      toast({ title: "That code did not work", description: message, variant: "destructive" });
      setCode("");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <CowDungCake variant="hero" isLit={false} className="h-24 w-24" />
        <p className="text-sm text-foreground/70 text-center leading-relaxed max-w-[260px]">
          We will name you. You will not pick it.
        </p>
      </div>

      {formError && (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
          role="alert"
          data-testid="text-auth-error"
        >
          {formError}
        </p>
      )}

      {step === "choose" && (
        <div className="flex flex-col gap-2.5">
          {wall && !wall.google && !wall.apple && !wall.phone && !wall.email && (
            <p className="text-center text-sm text-muted-foreground">
              The wall is not taking anyone in tonight.
            </p>
          )}
          {wall?.google && (
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-start gap-3 bg-background text-foreground border-input"
              disabled={loading !== null}
              onClick={() => {
                setLoading("google");
                window.location.href = "/api/auth/google";
              }}
              data-testid="button-auth-google"
            >
              <GoogleMark />
              Continue with Google
            </Button>
          )}
          {wall?.apple && (
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-start gap-3 bg-background text-foreground border-input"
              disabled={loading !== null}
              onClick={() => {
                setLoading("apple");
                window.location.href = "/api/auth/apple";
              }}
              data-testid="button-auth-apple"
            >
              <AppleMark />
              Continue with Apple
            </Button>
          )}
          {(!wall || wall.phone) && (
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-start gap-3 bg-background text-foreground border-input"
              disabled={loading !== null}
              onClick={() => setStep("phone")}
              data-testid="button-auth-phone"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center text-[13px] font-semibold">+</span>
              Continue with phone
            </Button>
          )}
          {(!wall || wall.email) && (
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-start gap-3 bg-background text-foreground border-input"
              disabled={loading !== null}
              onClick={() => {
                setEmailMode(wall?.registrations === false ? "login" : "register");
                setFormError(null);
                setStep("email");
              }}
              data-testid="button-auth-email"
            >
              <Mail className="h-4 w-4" />
              Continue with email
            </Button>
          )}
        </div>
      )}

      {step === "email" && (
        <form onSubmit={submitEmail} className="flex flex-col gap-4">
          <button
            type="button"
            className="self-start inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            onClick={() => setStep("choose")}
          >
            <ArrowLeft className="h-3 w-3" />
            Other ways
          </button>
          <div className="flex rounded-lg border border-input p-0.5 bg-background">
            <button
              type="button"
              className={`flex-1 h-8 rounded-md text-xs uppercase tracking-[0.14em] ${
                emailMode === "register" ? "bg-secondary text-foreground" : "text-muted-foreground"
              } ${wall?.registrations === false ? "opacity-40" : ""}`}
              onClick={() => wall?.registrations !== false && setEmailMode("register")}
              disabled={wall?.registrations === false}
              data-testid="button-email-register-mode"
            >
              Register
            </button>
            <button
              type="button"
              className={`flex-1 h-8 rounded-md text-xs uppercase tracking-[0.14em] ${
                emailMode === "login" ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setEmailMode("login")}
              data-testid="button-email-login-mode"
            >
              Sign in
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-foreground/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 bg-background border-input text-foreground"
              data-testid="input-email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-foreground/80">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={emailMode === "register" ? "new-password" : "current-password"}
              minLength={emailMode === "register" ? 6 : 1}
              placeholder={emailMode === "register" ? "At least 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 bg-background border-input text-foreground"
              data-testid="input-password"
            />
          </div>
          <Button type="submit" disabled={loading === "email"} data-testid="button-email-submit">
            {loading === "email"
              ? emailMode === "register" ? "Creating..." : "Signing in..."
              : emailMode === "register" ? "Create account" : "Sign in"}
          </Button>
        </form>
      )}

      {step === "phone" && (
        <form onSubmit={startPhone} className="flex flex-col gap-4">
          <button
            type="button"
            className="self-start inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            onClick={() => setStep("choose")}
          >
            <ArrowLeft className="h-3 w-3" />
            Other ways
          </button>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-foreground/80">
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="h-10 bg-background border-input text-foreground"
              data-testid="input-phone"
            />
          </div>
          <Button type="submit" disabled={loading === "phone"} data-testid="button-send-code">
            {loading === "phone" ? "Sending..." : "Send a code"}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void verifyPhone(code);
          }}
        >
          <button
            type="button"
            className="self-start inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            onClick={() => {
              setStep("phone");
              setCode("");
            }}
          >
            <ArrowLeft className="h-3 w-3" />
            Change number
          </button>
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-foreground/80">
              Code
            </Label>
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                if (value.length === 6) void verifyPhone(value);
              }}
              disabled={loading === "phone"}
            >
              <InputOTPGroup className="w-full justify-between">
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-11 bg-background" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-muted-foreground text-center">Sent to {phone}</p>
        </form>
      )}

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        By continuing you agree to the{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground" onClick={hideAuth}>
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground" onClick={hideAuth}>
          Privacy
        </Link>
        .
      </p>
    </div>
  );
}

export function AuthDialog() {
  const { user } = useAuth();
  const { authOpen, hideAuth } = useAuthModal();

  useEffect(() => {
    if (user) hideAuth();
  }, [user, hideAuth]);

  return (
    <Dialog open={authOpen} onOpenChange={(open) => !open && hideAuth()}>
      <DialogContent className="max-w-sm bg-card text-card-foreground border-border shadow-2xl sm:rounded-xl">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-serif text-2xl tracking-[0.18em] uppercase">
            Pidaka
          </DialogTitle>
          <DialogDescription className="sr-only">
            Continue with Google, Apple, phone, or email
          </DialogDescription>
        </DialogHeader>
        <AuthForm />
      </DialogContent>
    </Dialog>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 wall-atmosphere">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <AuthForm />
      </div>
    </div>
  );
}
