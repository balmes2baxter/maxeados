// Capa de gamificación: XP, niveles, rangos, logros, misiones y rachas.
// Todo se deriva de los intentos, así no hay contadores que se desincronicen.

export type GameSubmission = {
  machineId: string;
  machineSlug: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  repsCompleted: number;
  score: number;
  createdAt: Date;
};

export const XP = {
  submit: 10,
  approved: 50,
  perScorePoint: 20,
  personalBest: 25,
  circuit: 200,
  verifiedWeight: 30,
} as const;

export function computeXp(subs: GameSubmission[], weightVerified: boolean, machineCount: number): number {
  let xp = subs.length * XP.submit;
  const bestByMachine = new Map<string, number>();
  const chronological = [...subs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const s of chronological) {
    if (s.status !== "APPROVED") continue;
    xp += XP.approved + Math.round(s.score * XP.perScorePoint);
    const prev = bestByMachine.get(s.machineId);
    if (prev !== undefined && s.score > prev) xp += XP.personalBest;
    if (prev === undefined || s.score > prev) bestByMachine.set(s.machineId, s.score);
  }
  if (machineCount > 0 && bestByMachine.size >= machineCount) xp += XP.circuit;
  if (weightVerified) xp += XP.verifiedWeight;
  return xp;
}

// XP acumulada necesaria para llegar al nivel n (nivel 1 = 0 XP).
export function xpForLevel(n: number): number {
  return Math.round(60 * (n - 1) ** 1.6);
}

export function levelInfo(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, xp, floor, next, progress: (xp - floor) / (next - floor), title: levelTitle(level) };
}

export function levelTitle(level: number): string {
  if (level >= 20) return "Leyenda del Hierro";
  if (level >= 15) return "Titán";
  if (level >= 10) return "Bestia";
  if (level >= 6) return "Fierrero";
  if (level >= 3) return "Calentando";
  return "Novato";
}

export const TIERS = [
  { name: "Bronce", min: 0, color: "#cd7f32" },
  { name: "Plata", min: 6, color: "#c0c0c0" },
  { name: "Oro", min: 10, color: "#ffd700" },
  { name: "Platino", min: 14, color: "#00e5ff" },
  { name: "Diamante", min: 18, color: "#ff3ea5" },
] as const;

export function tierFor(score: number) {
  let t: (typeof TIERS)[number] = TIERS[0];
  for (const tier of TIERS) if (score >= tier.min) t = tier;
  const idx = TIERS.indexOf(t);
  const next = TIERS[idx + 1];
  return { ...t, next: next ?? null };
}

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string; // nombre de PixelIcon
  unlocked: boolean;
};

const LEG_MACHINES = ["leg-press", "leg-extension", "leg-curl"];
const BACK_MACHINES = ["lat-pulldown", "seated-row"];

export function computeBadges(input: {
  subs: GameSubmission[];
  weightVerified: boolean;
  machineCount: number;
  rank: number | null;
  streak: number;
}): Badge[] {
  const { subs, weightVerified, machineCount, rank, streak } = input;
  const approved = subs.filter((s) => s.status === "APPROVED");
  const approvedSlugs = new Set(approved.map((s) => s.machineSlug));
  return [
    { id: "first", name: "Primer intento", description: "Envía tu primer intento", icon: "flag", unlocked: subs.length > 0 },
    { id: "approved", name: "¡Válido!", description: "Consigue un intento aprobado", icon: "check", unlocked: approved.length > 0 },
    { id: "verified", name: "Pesaje oficial", description: "El juez verificó tu peso", icon: "scale", unlocked: weightVerified },
    { id: "cap", name: "Tope 15", description: "Haz 15 reps aprobadas en una máquina", icon: "bolt", unlocked: approved.some((s) => s.repsCompleted >= 15) },
    { id: "legs", name: "Piernas de acero", description: "Aprueba las 3 máquinas de pierna", icon: "leg", unlocked: LEG_MACHINES.every((m) => approvedSlugs.has(m)) },
    { id: "back", name: "Espalda de titán", description: "Aprueba jalón y remo", icon: "wing", unlocked: BACK_MACHINES.every((m) => approvedSlugs.has(m)) },
    { id: "circuit", name: "Circuito completo", description: "Aprueba las 6 máquinas", icon: "crown", unlocked: machineCount > 0 && approvedSlugs.size >= machineCount },
    { id: "streak", name: "En llamas", description: "Racha de 3 días entrenando", icon: "flame", unlocked: streak >= 3 },
    { id: "grind", name: "Constancia", description: "Envía 10 intentos", icon: "dumbbell", unlocked: subs.length >= 10 },
    { id: "podium", name: "Podio", description: "Entra al top 3 del ranking", icon: "trophy", unlocked: rank !== null && rank <= 3 },
  ];
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Días consecutivos (hasta hoy o ayer) con al menos un envío. */
export function computeStreak(dates: Date[], now = new Date()): number {
  const days = new Set(dates.map(dayKey));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export type Quest = { id: string; title: string; progress: number; goal: number; xp: number };

export function computeQuests(subs: GameSubmission[], machineCount: number, now = new Date()): Quest[] {
  const today = dayKey(now);
  const weekAgo = now.getTime() - 7 * 86400000;
  const todayCount = subs.filter((s) => dayKey(s.createdAt) === today).length;
  const weekApproved = subs.filter((s) => s.status === "APPROVED" && s.createdAt.getTime() >= weekAgo).length;
  const tried = new Set(subs.filter((s) => s.status !== "REJECTED").map((s) => s.machineId)).size;
  return [
    { id: "daily", title: "Sube un intento hoy", progress: Math.min(todayCount, 1), goal: 1, xp: XP.submit },
    { id: "weekly", title: "Logra 3 aprobados esta semana", progress: Math.min(weekApproved, 3), goal: 3, xp: XP.approved * 3 },
    { id: "season", title: "Prueba las 6 máquinas", progress: Math.min(tried, machineCount), goal: machineCount, xp: XP.circuit },
  ];
}
