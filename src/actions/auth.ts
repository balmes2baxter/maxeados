"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string } | undefined;

// Contraseña fija del modo desarrollo (solo Supabase local; ver supabase/seed_demo.sql).
const DEV_PASSWORD = "maxeados-dev";

export async function signInDev(_: AuthState, formData: FormData): Promise<AuthState> {
  if (process.env.NEXT_PUBLIC_DEV_LOGIN !== "true") return { error: "Modo desarrollo desactivado" };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Correo inválido" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: DEV_PASSWORD });
  if (error) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: DEV_PASSWORD,
      options: { data: { full_name: name || email.split("@")[0] } },
    });
    if (signUpError) return { error: signUpError.message };
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
