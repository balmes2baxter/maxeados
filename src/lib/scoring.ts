// Algoritmo de puntuación (README): P_m = (W / PC) × (1 + R/30), con 1 ≤ R ≤ 15.
// W es el peso que el atleta declara haber movido (nunca más que el tope de la pila).

export const MAX_COUNTED_REPS = 15;
export const MACHINES_REQUIRED = 6;

export function countedReps(repsCompleted: number): number {
  if (!Number.isFinite(repsCompleted) || repsCompleted < 1) return 0;
  return Math.min(Math.floor(repsCompleted), MAX_COUNTED_REPS);
}

export function machineScore(liftedKg: number, bodyWeightKg: number, repsCompleted: number): number {
  const reps = countedReps(repsCompleted);
  if (reps === 0 || bodyWeightKg <= 0) return 0;
  return round4((liftedKg / bodyWeightKg) * (1 + reps / 30));
}

export function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export type ScoredAttempt = {
  userId: string;
  machineId: string;
  score: number;
};

export type Standing = {
  userId: string;
  bodyWeightKg: number;
  best: Record<string, number>; // machineId -> mejor P_m aprobado
  total: number;
  machinesDone: number;
  eligible: boolean;
};

/**
 * Puntaje global = suma del mejor intento aprobado por máquina.
 * Orden: puntaje desc; empate → menor peso corporal oficial.
 */
export function buildStandings(
  approved: ScoredAttempt[],
  bodyWeights: Map<string, number>,
  machineIds: string[],
): Standing[] {
  const byUser = new Map<string, Record<string, number>>();
  for (const a of approved) {
    const best = byUser.get(a.userId) ?? {};
    if ((best[a.machineId] ?? -1) < a.score) best[a.machineId] = a.score;
    byUser.set(a.userId, best);
  }
  const standings: Standing[] = [];
  for (const [userId, best] of byUser) {
    const done = machineIds.filter((id) => best[id] !== undefined).length;
    standings.push({
      userId,
      bodyWeightKg: bodyWeights.get(userId) ?? Infinity,
      best,
      total: round4(machineIds.reduce((s, id) => s + (best[id] ?? 0), 0)),
      machinesDone: done,
      eligible: done >= Math.min(MACHINES_REQUIRED, machineIds.length),
    });
  }
  return standings.sort((a, b) => b.total - a.total || a.bodyWeightKg - b.bodyWeightKg);
}
