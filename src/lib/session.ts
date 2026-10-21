import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Avatar } from "@/lib/avatar";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  avatar: Avatar | null;
  body_weight_kg: number | null;
  weight_verified: boolean;
  role: "ATHLETE" | "ADMIN";
  onboarded: boolean;
};

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, avatar, body_weight_kg, weight_verified, role, onboarded")
    .eq("id", user.id)
    .single();
  return (data as Profile | null) ?? null;
});

export type Athlete = Profile & { full_name: string; body_weight_kg: number; avatar: Avatar };

/** Usuario con sesión, personaje y peso; si no, lo manda a donde corresponde. */
export async function requireAthlete(): Promise<Athlete> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  return user as Athlete;
}

export async function requireJudge(): Promise<Athlete> {
  const user = await requireAthlete();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
