// TEMPORARY: authentication has been removed while the app is being rebuilt.
// There is no logged-in user anymore, so every page operates on a single
// shared "default" business instead of one scoped to an owner. RLS has also
// been disabled on all tables at the database level.
//
// When auth is reintroduced, swap calls to this helper back to an
// owner-scoped lookup (e.g. .eq("owner_id", user.id)) and re-enable RLS.

import type { SupabaseClient } from "@supabase/supabase-js";

export async function getDefaultBusiness(supabase: SupabaseClient) {
  return supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
}
