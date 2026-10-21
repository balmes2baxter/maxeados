"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireAthlete, requireJudge } from "@/lib/session";
import { parseAvatar } from "@/lib/avatar";
import { getActiveSeason, seasonOpen } from "@/lib/data";

export type FormState = { error?: string } | undefined;

function readProfile(
  formData: FormData,
): { error: string; data?: undefined } | { error?: undefined; data: { full_name: string; phone: string | null; body_weight_kg: number } } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const weight = Number(formData.get("bodyWeightKg"));
  if (fullName.length < 2 || fullName.length > 120) return { error: "Escribe tu nombre de atleta." };
  if (phone && !/^[0-9+\s-]{7,20}$/.test(phone)) return { error: "Teléfono inválido." };
  if (!Number.isFinite(weight) || weight < 30 || weight > 300)
    return { error: "El peso corporal debe estar entre 30 y 300 kg." };
  return { data: { full_name: fullName, phone, body_weight_kg: Math.round(weight * 100) / 100 } };
}

function readAvatar(formData: FormData) {
  try {
    return parseAvatar(JSON.parse(String(formData.get("avatar") ?? "{}")));
  } catch {
    return parseAvatar({});
  }
}

export async function completeOnboarding(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = readProfile(formData);
  if (!parsed.data) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, avatar: readAvatar(formData) })
    .eq("id", user.id);
  if (error) return { error: error.message };
  redirect("/?fx=welcome");
}

export async function saveAvatar(formData: FormData) {
  const user = await requireAthlete();
  const supabase = await createClient();
  await supabase.from("profiles").update({ avatar: readAvatar(formData) }).eq("id", user.id);
  revalidatePath("/", "layout");
  redirect("/perfil?fx=saved");
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAthlete();
  const parsed = readProfile(formData);
  if (!parsed.data) return { error: parsed.error };
  const supabase = await createClient();
  // Si cambia el peso, el trigger guard_profile_update le quita la verificación.
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/perfil?fx=saved");
}

export async function submitAttempt(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireAthlete();
  const machineId = String(formData.get("machineId") ?? "");
  const reps = Number(formData.get("reps"));
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim() || null;
  const evidencePath = String(formData.get("evidencePath") ?? "").trim() || null;
  const evidenceType = String(formData.get("evidenceType") ?? "");

  if (!Number.isInteger(reps) || reps < 1 || reps > 100) return { error: "Repeticiones inválidas." };
  if (!evidenceUrl && !evidencePath) return { error: "Sube un video o pega un enlace de evidencia." };
  if (evidenceUrl && !/^https?:\/\/\S+$/i.test(evidenceUrl)) return { error: "El enlace debe empezar por http(s)://" };
  if (evidencePath && !evidencePath.startsWith(`${user.id}/`)) return { error: "Archivo inválido." };

  const season = await getActiveSeason();
  if (!seasonOpen(season)) return { error: "No hay una temporada abierta en este momento." };

  const supabase = await createClient();
  const { data: machine } = await supabase.from("machines").select("id, slug").eq("id", machineId).maybeSingle();
  if (!machine) return { error: "Máquina no encontrada." };

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("machine_id", machine.id)
    .eq("season_id", season!.id)
    .eq("status", "PENDING");
  if (count) return { error: "Ya tienes un intento en juicio en esta máquina. Espera al juez." };

  // El trigger compute_submission_score fija temporada, snapshots, reps contadas y puntaje.
  const { error } = await supabase.from("submissions").insert({
    user_id: user.id,
    machine_id: machine.id,
    season_id: season!.id,
    reps_completed: reps,
    reps_counted: 0,
    body_weight_snapshot: 0,
    machine_weight_snapshot: 0,
    calculated_score: 0,
    evidence_url: evidenceUrl,
    evidence_path: evidencePath,
    evidence_type: evidencePath ? (evidenceType === "photo" ? "photo" : "video") : "link",
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect(`/maquinas/${machine.slug}?fx=submitted`);
}

// ---------------- Juez ----------------

export async function reviewSubmission(formData: FormData) {
  await requireJudge();
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision") === "APPROVED" ? "APPROVED" : "REJECTED";
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 500) || null;
  const supabase = await createClient();
  await supabase
    .from("submissions")
    .update({ status: decision, admin_notes: notes })
    .eq("id", id)
    .eq("status", "PENDING");
  revalidatePath("/", "layout");
  redirect(`/juez?fx=${decision === "APPROVED" ? "approved" : "rejected"}`);
}

export async function verifyWeight(formData: FormData) {
  await requireJudge();
  const supabase = await createClient();
  await supabase.rpc("verify_weight", {
    p_user: String(formData.get("userId") ?? ""),
    p_weight: Number(formData.get("bodyWeightKg")),
  });
  revalidatePath("/", "layout");
  redirect("/juez?tab=pesos&fx=verified");
}

export async function createSeason(_: FormState, formData: FormData): Promise<FormState> {
  await requireJudge();
  const title = String(formData.get("title") ?? "").trim();
  const start = String(formData.get("startDate") ?? "");
  const end = String(formData.get("endDate") ?? "");
  const prize = Number(formData.get("prizeAmountCop"));
  if (title.length < 3) return { error: "Ponle un título a la temporada." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start)
    return { error: "La fecha final debe ser posterior a la inicial." };
  if (!Number.isFinite(prize) || prize < 0) return { error: "Pozo inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("open_season", { p_title: title, p_start: start, p_end: end, p_prize: prize });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/juez?tab=temporada&fx=season");
}
