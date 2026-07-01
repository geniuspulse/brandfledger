"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, Info } from "lucide-react";

function MessageBanner() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-md bg-primary/10 p-3 text-sm text-primary border border-primary/20">
      <Info className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("invalid login")) {
        setError("Incorrect email or password.");
      } else if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please verify your email before signing in. Check your inbox.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Refresh the router so middleware re-evaluates session, then push to dashboard
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to your Brandfledger account</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Suspense fallback={null}><MessageBanner /></Suspense>
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">Create one free</Link>
      </p>
    </div>
  );
}
