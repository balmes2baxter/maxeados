"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function saveProfile(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const weight = Number(formData.get("body_weight_kg"));

  if (fullName.length < 3) return { error: "Escribe tu nombre completo." };
  if (!Number.isFinite(weight) || weight < 30 || weight > 300)
    return { error: "El peso corporal debe estar entre 30 y 300 kg." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone, body_weight_kg: weight })
    .eq("id", user.id);

  if (error) return { error: error.message };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
