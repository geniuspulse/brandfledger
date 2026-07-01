"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  return { success: true, message: "Check your email to verify your account." };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  if (!email || !password) return { error: "Email and password are required." };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Uses type=recovery so the callback route redirects to /reset-password
export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required." };
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=recovery`,
  });
  if (error) return { error: error.message };
  return { success: true };
}