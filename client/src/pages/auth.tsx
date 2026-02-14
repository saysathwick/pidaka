import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BurningCookieIcon } from "@/components/burning-cookie-icon";

export default function AuthPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative mb-1">
            <div className="absolute -inset-3 rounded-full bg-primary/15 blur-lg" />
            <BurningCookieIcon className="h-12 w-12 text-primary relative" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Pidaka</h1>
          <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-[260px]">
            Anonymous opinions from strangers. No identity. No followers. Just truth.
          </p>
        </div>

        <Card>
          <CardContent className="pt-5 pb-5 flex flex-col gap-5">
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
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</Label>
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
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
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
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>
            {!isLogin && (
              <p className="text-[11px] text-muted-foreground/70 text-center">
                A random anonymous username will be generated for you
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
