import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Cpu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredToken, loginWithPassword, setStoredToken } from "@/lib/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  if (getStoredToken()) {
    return <Navigate to="/simulation" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const data = await loginWithPassword(email, password);
      setStoredToken(data.access_token);
      toast.success("Signed in");
      navigate("/simulation", { replace: true });
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="dashboard-atmosphere pointer-events-none absolute inset-0 opacity-45 dark:opacity-65"
        aria-hidden
      />
      <Card className="neon-surface relative z-10 w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-primary ring-2 ring-primary/30">
            <Cpu className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl tracking-tight">HPC Scheduler</CardTitle>
            <CardDescription className="text-base">
              Sign in to run simulations and experiments
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="bg-background"
              />
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
