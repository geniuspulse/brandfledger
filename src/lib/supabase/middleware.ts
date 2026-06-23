// UPDATED: src/lib/supabase/middleware.ts
// Removed /onboarding from protected paths (page no longer exists as a route)
// Kept /team and /subscription as protected

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Always let these through
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) {
    return supabaseResponse;
  }

  const protectedPaths = [
    "/dashboard", "/customers", "/invoices", "/products",
    "/payments", "/expenses", "/reports", "/settings",
    "/team", "/subscription",
  ];
  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}
