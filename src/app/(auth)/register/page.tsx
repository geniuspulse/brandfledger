"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, MailCheck } from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClient();
    const siteUrl = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setEmailSent(true);
    setLoading(false);
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Brandfledger</span>
          </div>
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <MailCheck className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                Click the link to verify your account and you&apos;ll be logged in automatically.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive it? Check your spam folder or{" "}
                <button onClick={() => setEmailSent(false)} className="text-primary hover:underline font-medium">
                  try again
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Start managing your business finances today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min 8 characters" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
