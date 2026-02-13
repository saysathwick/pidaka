import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <BurningCookieIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Pidaka</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Anonymous opinions from strangers. No identity. No followers. Just truth.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-center gap-2 pb-2">
            <Button
              variant={isLogin ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsLogin(true)}
              data-testid="button-login-tab"
            >
              Login
            </Button>
            <Button
              variant={!isLogin ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsLogin(false)}
              data-testid="button-register-tab"
            >
              Register
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isLogin ? "Enter password" : "Min 6 characters"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isLogin ? 1 : 6}
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" disabled={loading} data-testid="button-submit-auth">
                {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              </Button>
            </form>
            {!isLogin && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                A random anonymous username will be generated for you.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
