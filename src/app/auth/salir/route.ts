import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Cierra la sesión (también una huérfana: cookie válida de un usuario que ya no existe) y vuelve al login. */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/login", request.url));
}
