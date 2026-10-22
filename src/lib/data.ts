import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Athlete } from "@/lib/session";
import type { Avatar } from "@/lib/avatar";
import type { ShopItem } from "@/lib/shop";
import {
  computeBadges,
  computeQuests,
  computeStreak,
  computeXp,
  levelInfo,
  tierFor,
  type GameSubmission,
} from "@/lib/game";

export type Machine = {
  id: string;
  slug: string;
  name: string;
  muscle_group: string;
  max_weight_kg: number;
  sort_order: number;
};

export type Season = {
  id: string;
  title: string;
  prize_amount_cop: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  gym_name: string | null;
  gym_lat: number | null;
  gym_lng: number | null;
  gym_radius_m: number;
};

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

const today = () => new Date().toISOString().slice(0, 10);

export const getActiveSeason = cache(async (): Promise<Season | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("seasons").select("*").eq("is_active", true).maybeSingle();
  return (data as Season | null) ?? null;
});

export function seasonOpen(season: Season | null) {
  if (!season) return false;
  const t = today();
  return season.start_date <= t && t <= season.end_date;
}

export function daysLeft(season: Season) {
  const end = new Date(`${season.end_date}T23:59:59`);
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
}

export const getMachines = cache(async (): Promise<Machine[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("machines")
    .select("id, slug, name, muscle_group, max_weight_kg, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  return (data as Machine[] | null) ?? [];
});

export type RankedAthlete = {
  userId: string;
  rank: number;
  total: number;
  machinesDone: number;
  eligible: boolean;
  bodyWeightKg: number;
  best: Record<string, number>; // machineId -> mejor P_m aprobado
  user: { id: string; fullName: string; avatar: Avatar | null; weightVerified: boolean };
};

type LeaderboardRow = {
  user_id: string;
  full_name: string | null;
  avatar: Avatar | null;
  body_weight_kg: number;
  weight_verified: boolean;
  total_score: number;
  machines_completed: number;
  qualified: boolean;
  breakdown: Record<string, number>;
  position: number;
};

export async function getLeaderboard(seasonId: string, machines: Machine[]): Promise<RankedAthlete[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("user_id, full_name, avatar, body_weight_kg, weight_verified, total_score, machines_completed, qualified, breakdown, position")
    .eq("season_id", seasonId)
    .order("position");
  const idBySlug = new Map(machines.map((m) => [m.slug, m.id]));
  return ((data as LeaderboardRow[] | null) ?? []).map((r) => {
    const best: Record<string, number> = {};
    for (const [slug, score] of Object.entries(r.breakdown ?? {})) {
      const id = idBySlug.get(slug);
      if (id) best[id] = Number(score);
    }
    return {
      userId: r.user_id,
      rank: r.position,
      total: Number(r.total_score),
      machinesDone: r.machines_completed,
      eligible: r.qualified,
      bodyWeightKg: Number(r.body_weight_kg),
      best,
      user: { id: r.user_id, fullName: r.full_name ?? "Atleta", avatar: r.avatar, weightVerified: r.weight_verified },
    };
  });
}

export type UserSubmission = {
  id: string;
  machineId: string;
  machineSlug: string;
  machineName: string;
  status: SubmissionStatus;
  repsCompleted: number;
  repsCounted: number;
  liftedKg: number;
  score: number;
  evidenceUrl: string | null;
  evidencePath: string | null;
  adminNotes: string | null;
  createdAt: Date;
};

export async function getUserSubmissions(userId: string, seasonId: string): Promise<UserSubmission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("id, machine_id, status, reps_completed, reps_counted, lifted_weight_kg, calculated_score, evidence_url, evidence_path, admin_notes, created_at, machines(slug, name)")
    .eq("user_id", userId)
    .eq("season_id", seasonId)
    .order("created_at", { ascending: false });
  type Row = {
    id: string; machine_id: string; status: SubmissionStatus; reps_completed: number; reps_counted: number; lifted_weight_kg: number;
    calculated_score: number; evidence_url: string | null; evidence_path: string | null; admin_notes: string | null;
    created_at: string; machines: { slug: string; name: string } | null;
  };
  return ((data as unknown as Row[] | null) ?? []).map((r) => ({
    id: r.id,
    machineId: r.machine_id,
    machineSlug: r.machines?.slug ?? "",
    machineName: r.machines?.name ?? "",
    status: r.status,
    repsCompleted: r.reps_completed,
    repsCounted: r.reps_counted,
    liftedKg: Number(r.lifted_weight_kg),
    score: Number(r.calculated_score),
    evidenceUrl: r.evidence_url,
    evidencePath: r.evidence_path,
    adminNotes: r.admin_notes,
    createdAt: new Date(r.created_at),
  }));
}

/** Todo el estado de juego de un atleta en la temporada activa. */
export const getPlayerState = cache(async (user: Athlete) => {
  const [season, machines] = await Promise.all([getActiveSeason(), getMachines()]);
  const [subs, board] = season
    ? await Promise.all([getUserSubmissions(user.id, season.id), getLeaderboard(season.id, machines)])
    : [[], []];
  const me = board.find((b) => b.userId === user.id) ?? null;
  const gameSubs: GameSubmission[] = subs.map((s) => ({
    machineId: s.machineId,
    machineSlug: s.machineSlug,
    status: s.status,
    repsCompleted: s.repsCompleted,
    score: s.score,
    createdAt: s.createdAt,
  }));
  const streak = computeStreak(subs.map((s) => s.createdAt));
  const xp = computeXp(gameSubs, user.weight_verified, machines.length);
  return {
    season,
    machines,
    subs,
    board,
    me,
    streak,
    level: levelInfo(xp),
    tier: tierFor(me?.total ?? 0),
    badges: computeBadges({
      subs: gameSubs,
      weightVerified: user.weight_verified,
      machineCount: machines.length,
      rank: me?.rank ?? null,
      streak,
    }),
    quests: computeQuests(gameSubs, machines.length),
    pending: subs.filter((s) => s.status === "PENDING").length,
  };
});

export async function getRecentActivity(seasonId: string, limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_feed")
    .select("id, full_name, machine_name, reps_completed, calculated_score, reviewed_at, lifted_weight_kg")
    .eq("season_id", seasonId)
    .order("reviewed_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  type Row = { id: string; full_name: string | null; machine_name: string; reps_completed: number; calculated_score: number; lifted_weight_kg: number };
  return ((data as Row[] | null) ?? []).map((r) => ({
    id: r.id,
    name: r.full_name ?? "Atleta",
    machine: r.machine_name,
    reps: r.reps_completed,
    kg: Number(r.lifted_weight_kg),
    score: Number(r.calculated_score),
  }));
}

export function formatCop(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

export function shortName(name: string) {
  const parts = name.replace(/'.*?'/g, "").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

export function machineShort(name: string) {
  return name.split(" ")[0];
}

/** Mejor marca aprobada (peso × reps) por máquina, a partir de los intentos del atleta. */
export function bestLifts(subs: UserSubmission[]): Record<string, { kg: number; reps: number; score: number }> {
  const out: Record<string, { kg: number; reps: number; score: number }> = {};
  for (const s of subs) {
    if (s.status !== "APPROVED") continue;
    if (!out[s.machineId] || s.score > out[s.machineId].score) out[s.machineId] = { kg: s.liftedKg, reps: s.repsCompleted, score: s.score };
  }
  return out;
}

export function gymReady(season: Season | null) {
  return !!season && season.gym_lat !== null && season.gym_lng !== null;
}

export function formatKg(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} kg`;
}

/** Tienda: catálogo, lo que ya compró el atleta y sus fichas. */
export const getShop = cache(async (userId: string) => {
  const supabase = await createClient();
  const [{ data: items }, { data: owned }, { data: balance }] = await Promise.all([
    supabase.from("shop_items").select("id, name, price").order("sort_order"),
    supabase.from("purchases").select("item_id").eq("user_id", userId),
    supabase.rpc("coin_balance", { p_user: userId }),
  ]);
  const ownedSet = new Set(((owned as { item_id: string }[] | null) ?? []).map((o) => o.item_id));
  const catalog = ((items as ShopItem[] | null) ?? []).map((i) => ({ ...i, owned: ownedSet.has(i.id) }));
  return {
    items: catalog,
    balance: Number(balance ?? 0),
    locked: catalog.filter((i) => !i.owned).map((i) => ({ id: i.id, price: i.price })),
  };
});
