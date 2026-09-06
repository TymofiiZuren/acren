import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const requireSession = cache(async function requireSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (error || !id) redirect("/login");
  const user = { id, email: typeof data.claims.email === "string" ? data.claims.email : undefined };
  // Every query still runs with the caller's session: RLS is the ownership boundary.
  return { supabase, user };
});
