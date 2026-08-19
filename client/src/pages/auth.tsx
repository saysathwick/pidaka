import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAuthModal } from "@/lib/auth-modal";
import { queryClient } from "@/lib/queryClient";
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
import { useToast } from "@/hooks/use-toast";
import { CowDungCake } from "@/components/burning-cookie-icon";

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/pidakas"] });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <div className="relative mb-1">
          <CowDungCake variant="hero" isLit={false} className="h-24 w-24" />
        </div>
        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-[260px]">
          We will name you. You will not pick it.
        </p>
      </div>

      <div className="flex items-center rounded-md bg-muted/50 p-1 gap-1">
        <button
          type="button"
          onClick={() => setIsLogin(true)}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-all duration-200 ${
            isLogin
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
          data-testid="button-login-tab"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setIsLogin(false)}
          className={`flex-1 text-sm font-medium py-2 rounded-md transition-all duration-200 ${
            !isLogin
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground"
          }`}
          data-testid="button-register-tab"
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            data-testid="input-email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={isLogin ? "Enter password" : "Min 6 characters"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? 1 : 6}
            className="bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            data-testid="input-password"
          />
        </div>
        <Button type="submit" disabled={loading} className="mt-1" data-testid="button-submit-auth">
          {loading ? "Hold still..." : isLogin ? "Drop your mask" : "Take a name"}
        </Button>
      </form>
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
      <DialogContent className="max-w-sm bg-background border-border/60">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-serif text-2xl tracking-[0.18em] uppercase">
            Pidaka
          </DialogTitle>
          <DialogDescription className="sr-only">
            Login or register to post and send burns
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
      <div className="w-full max-w-sm">
        <AuthForm />
      </div>
    </div>
  );
}
