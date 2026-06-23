import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has a business — if not, send to onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (!businesses || businesses.length === 0) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange fails, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Could not verify email`);
}
