"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireAthlete, requireJudge } from "@/lib/session";
import { parseAvatar } from "@/lib/avatar";
import { getActiveSeason, getShop, gymReady, seasonOpen } from "@/lib/data";
import { stripLocked } from "@/lib/shop";
import { isDevLoginEnabled } from "@/lib/devLogin";
import { distanceM, formatDistance } from "@/lib/geo";

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

/** Lee el personaje del formulario y le quita lo premium que no se ha comprado. */
async function readAvatar(formData: FormData, userId: string) {
  let avatar;
  try {
    avatar = parseAvatar(JSON.parse(String(formData.get("avatar") ?? "{}")));
  } catch {
    avatar = parseAvatar({});
  }
  const shop = await getShop(userId);
  return stripLocked(avatar, shop.locked.map((l) => l.id));
}

export async function completeOnboarding(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = readProfile(formData);
  if (!parsed.data) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, avatar: await readAvatar(formData, user.id) })
    .eq("id", user.id);
  if (error) return { error: error.message };
  redirect("/?fx=welcome");
}

export async function saveAvatar(formData: FormData) {
  const user = await requireAthlete();
  const supabase = await createClient();
  await supabase.from("profiles").update({ avatar: await readAvatar(formData, user.id) }).eq("id", user.id);
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
  const liftedKg = Number(formData.get("liftedKg"));
  let lat = Number(formData.get("lat"));
  let lng = Number(formData.get("lng"));
  const simulated = formData.get("geoSimulated") === "1";
  const evidenceUrl = String(formData.get("evidenceUrl") ?? "").trim() || null;
  const evidencePath = String(formData.get("evidencePath") ?? "").trim() || null;
  const evidenceType = String(formData.get("evidenceType") ?? "");

  if (!Number.isInteger(reps) || reps < 1 || reps > 100) return { error: "Repeticiones inválidas." };
  if (!Number.isFinite(liftedKg) || liftedKg <= 0) return { error: "Escribe el peso que moviste." };
  if (!evidenceUrl && !evidencePath) return { error: "Sube un video o pega un enlace de evidencia." };
  if (evidenceUrl && !/^https?:\/\/\S+$/i.test(evidenceUrl)) return { error: "El enlace debe empezar por http(s)://" };
  if (evidencePath && !evidencePath.startsWith(`${user.id}/`)) return { error: "Archivo inválido." };

  const season = await getActiveSeason();
  if (!seasonOpen(season)) return { error: "No hay una temporada abierta en este momento." };
  if (!gymReady(season)) return { error: "El juez todavía no ha fijado la ubicación del gimnasio." };

  // Ubicación simulada: solo en local (http sin GPS), para probar desde el celular en la red.
  if (simulated) {
    if (!isDevLoginEnabled()) return { error: "Activa tu ubicación para enviar el intento." };
    lat = season!.gym_lat!;
    lng = season!.gym_lng!;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { error: "Activa tu ubicación para enviar el intento." };
  const dist = distanceM(lat, lng, season!.gym_lat!, season!.gym_lng!);
  if (dist > season!.gym_radius_m)
    return { error: `Estás a ${formatDistance(dist)} del gimnasio. Solo puedes enviar intentos desde el gym.` };

  const supabase = await createClient();
  const { data: machine } = await supabase.from("machines").select("id, slug, max_weight_kg").eq("id", machineId).maybeSingle();
  if (!machine) return { error: "Máquina no encontrada." };
  if (liftedKg > Number(machine.max_weight_kg)) return { error: `La pila de esta máquina llega hasta ${machine.max_weight_kg} kg.` };

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
    lifted_weight_kg: Math.round(liftedKg * 100) / 100,
    geo_lat: lat,
    geo_lng: lng,
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

export async function setGymLocation(_: FormState, formData: FormData): Promise<FormState> {
  await requireJudge();
  const season = await getActiveSeason();
  if (!season) return { error: "Primero abre una temporada." };
  const name = String(formData.get("gymName") ?? "").trim().slice(0, 100) || null;
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radius = Math.round(Number(formData.get("radius")));
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180)
    return { error: "Coordenadas inválidas. Usa tu ubicación o pégalas desde Google Maps." };
  if (!Number.isFinite(radius) || radius < 30 || radius > 2000) return { error: "El radio debe estar entre 30 y 2000 m." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("seasons")
    .update({ gym_name: name, gym_lat: lat, gym_lng: lng, gym_radius_m: radius })
    .eq("id", season.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/juez?tab=temporada&fx=saved");
}

export async function buyItem(formData: FormData) {
  await requireAthlete();
  const item = String(formData.get("item") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("buy_item", { p_item: item });
  revalidatePath("/", "layout");
  if (error) redirect(`/tienda?error=${encodeURIComponent(error.message)}`);
  redirect(`/tienda?fx=bought&item=${encodeURIComponent(item)}`);
}
