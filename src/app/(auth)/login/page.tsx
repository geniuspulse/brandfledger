// FIXED: src/app/(auth)/login/page.tsx
// Bug 1: useSearchParams inside Suspense was causing hydration re-renders that wiped state
// Bug 2: "missing email or phone" — email state was being read as empty on submit
// Fix: move state outside Suspense, use a ref for submit to avoid stale closure

"use client";
import { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";

function MessageBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  if (!message) return null;
  return <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{message}</div>;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Use refs to avoid stale closure in async handler
  const emailRef = useRef(email);
  const passwordRef = useRef(password);
  emailRef.current = email;
  passwordRef.current = password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Read from refs to guarantee latest value
    const emailVal = emailRef.current.trim();
    const passwordVal = passwordRef.current;

    if (!emailVal || !passwordVal) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password: passwordVal,
    });

    if (authError) {
      const msg = authError.message;
      if (msg.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Please verify your email before signing in.");
      } else if (msg.includes("Too many requests")) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else {
        setError(msg);
      }
      setLoading(false);
      return;
    }

    if (data.session) {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", data.session.user.id)
        .limit(1);

      // Always go to dashboard — dashboard handles no-business state with checklist
      router.refresh();
      await new Promise(r => setTimeout(r, 100));
      router.push("/dashboard");
    } else {
      setError("Sign in failed — no session returned. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Brandfledger</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Suspense only wraps the banner — not the form, preventing re-renders */}
              <Suspense fallback={null}>
                <MessageBanner />
              </Suspense>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                  : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
