import { Suspense } from "react";
import Loading from "../loading";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireJudge } from "@/lib/session";
import { formatCop, formatKg, getActiveSeason, machineShort } from "@/lib/data";
import { verifyWeight } from "@/actions/game";
import type { Avatar } from "@/lib/avatar";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { MachineSprite } from "@/components/MachineSprite";
import { StatusChip } from "@/components/StatusChip";
import { VideoEmbed } from "@/components/VideoEmbed";
import { ReviewForm } from "./ReviewForm";
import { SeasonForm } from "./SeasonForm";
import { GymForm } from "./GymForm";

const TABS = [
  { id: "cola", label: "Cola" },
  { id: "pesos", label: "Pesos" },
  { id: "historial", label: "Historial" },
  { id: "temporada", label: "Temporada" },
];

const SUB_SELECT =
  "id, reps_completed, reps_counted, lifted_weight_kg, geo_distance_m, calculated_score, body_weight_snapshot, machine_weight_snapshot, evidence_url, evidence_path, evidence_type, status, admin_notes, created_at, reviewed_at, profiles!submissions_user_id_fkey(full_name, avatar, weight_verified), machines(name, slug)";

type SubRow = {
  id: string;
  reps_completed: number;
  reps_counted: number;
  lifted_weight_kg: number;
  geo_distance_m: number | null;
  calculated_score: number;
  body_weight_snapshot: number;
  machine_weight_snapshot: number;
  evidence_url: string | null;
  evidence_path: string | null;
  evidence_type: "video" | "photo" | "link" | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profiles: { full_name: string | null; avatar: Avatar | null; weight_verified: boolean } | null;
  machines: { name: string; slug: string } | null;
};

async function loadSubs(seasonId: string, pending: boolean) {
  const supabase = await createClient();
  let q = supabase.from("submissions").select(SUB_SELECT).eq("season_id", seasonId);
  q = pending
    ? q.eq("status", "PENDING").order("created_at", { ascending: true })
    : q.neq("status", "PENDING").order("reviewed_at", { ascending: false }).limit(40);
  const { data } = await q;
  const rows = (data as unknown as SubRow[] | null) ?? [];
  if (!pending) return rows.map((r) => ({ ...r, mediaUrl: r.evidence_url }));
  // Evidencia privada en Storage: URL firmada por 1 hora para el juez.
  return Promise.all(
    rows.map(async (r) => {
      if (!r.evidence_path) return { ...r, mediaUrl: r.evidence_url };
      const { data: signed } = await supabase.storage.from("evidence").createSignedUrl(r.evidence_path, 3600);
      return { ...r, mediaUrl: signed?.signedUrl ?? null };
    }),
  );
}

async function JuezContent({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "cola" } = await searchParams;
  await requireJudge();
  const season = await getActiveSeason();

  const queue = season ? await loadSubs(season.id, true) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-shadow-px text-sm text-neon">MESA DEL JUEZ</h1>
        <span className="px-chip" style={{ ["--chip" as string]: "var(--color-gold)", ["--chip-fg" as string]: "var(--color-ink)" }}>{queue.length} en cola</span>
      </div>
      <div className="grid grid-cols-4">
        {TABS.map((t) => (
          <Link key={t.id} href={`/juez?tab=${t.id}`} className={`px-btn px-btn-sm !px-1 !text-[8px] ${tab === t.id ? "px-btn-on" : "px-btn-ghost"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "cola" && (
        <ul className="stagger flex flex-col gap-4">
          {queue.length === 0 && (
            <li className="px-box flex flex-col items-center gap-2 p-6 text-center">
              <PixelIcon name="check" size={40} />
              <p className="text-2xl">¡Cola vacía! Todo revisado.</p>
            </li>
          )}
          {queue.map((q) => (
            <li key={q.id} className="px-box flex flex-col gap-3 p-3">
              <div className="flex items-center gap-3">
                <PixelAvatar avatar={q.profiles?.avatar} size={60} shadow={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xl leading-none">{q.profiles?.full_name}</p>
                  <p className="text-lg text-muted">
                    {q.body_weight_snapshot} kg {q.profiles?.weight_verified ? <span className="text-neon">✔ verificado</span> : <span className="text-danger">sin verificar</span>}
                  </p>
                </div>
                <MachineSprite slug={q.machines?.slug ?? ""} size={48} lit={6} />
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="bg-panel-2 p-1"><p className="px-label">Máquina</p><p className="text-lg leading-none">{machineShort(q.machines?.name ?? "")}</p></div>
                <div className="bg-panel-2 p-1"><p className="px-label">Declaró</p><p className="font-pixel text-sm text-gold">{formatKg(Number(q.lifted_weight_kg))}</p></div>
                <div className="bg-panel-2 p-1"><p className="px-label">Reps</p><p className="font-pixel text-sm">{q.reps_completed}</p></div>
              </div>
              <p className="-mt-1 text-center text-base text-muted">
                Revisa que las placas sumen {formatKg(Number(q.lifted_weight_kg))}
                {q.geo_distance_m !== null && <> · enviado a {q.geo_distance_m} m del gym</>}
                {" · "}{new Date(q.created_at).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
              {q.mediaUrl ? (
                <VideoEmbed url={q.mediaUrl} kind={q.evidence_type} />
              ) : (
                <p className="bg-ink p-4 text-center text-xl text-danger">No se pudo cargar la evidencia.</p>
              )}
              <ReviewForm id={q.id} />
            </li>
          ))}
        </ul>
      )}

      {tab === "pesos" && <WeightsTab />}
      {tab === "historial" && season && <HistoryTab seasonId={season.id} />}
      {tab === "temporada" && (
        <section className="flex flex-col gap-3">
          {season && (
            <div className="px-box p-4">
              <p className="px-label">Temporada activa</p>
              <p className="text-2xl">{season.title}</p>
              <p className="text-xl text-muted">{season.start_date} → {season.end_date} · Pozo {formatCop(season.prize_amount_cop)}</p>
            </div>
          )}
          {season && (
            <div className="px-box p-4">
              <h2 className="font-pixel mb-1 text-[11px] text-bone">UBICACIÓN DEL GYM</h2>
              <p className="mb-3 text-lg text-muted">Los atletas solo pueden enviar intentos dentro de este radio.</p>
              <GymForm name={season.gym_name} lat={season.gym_lat} lng={season.gym_lng} radius={season.gym_radius_m} />
            </div>
          )}
          <div className="px-box p-4">
            <h2 className="font-pixel mb-3 text-[11px] text-bone">NUEVA TEMPORADA</h2>
            <SeasonForm />
          </div>
        </section>
      )}
    </div>
  );
}

async function WeightsTab() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar, body_weight_kg, weight_verified")
    .eq("role", "ATHLETE")
    .not("body_weight_kg", "is", null)
    .order("weight_verified")
    .order("full_name");
  type Row = { id: string; full_name: string | null; avatar: Avatar | null; body_weight_kg: number; weight_verified: boolean };
  const athletes = ((data as Row[] | null) ?? []).map((a) => ({
    id: a.id, name: a.full_name ?? "Atleta", avatar: a.avatar, weight: a.body_weight_kg, verified: a.weight_verified,
  }));
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xl text-muted">Pesa al atleta en el gym y confirma su peso oficial. Se recalculan todos sus puntajes.</p>
      <ul className="stagger flex flex-col gap-2">
        {athletes.map((a) => (
          <li key={a.id} className="px-box flex items-center gap-2 p-2">
            <PixelAvatar avatar={a.avatar} size={44} shadow={false} animate={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl leading-none">{a.name}</p>
              <p className={`text-base ${a.verified ? "text-neon" : "text-danger"}`}>{a.verified ? "✔ verificado" : "pendiente"}</p>
            </div>
            <form action={verifyWeight} className="flex items-center">
              <input type="hidden" name="userId" value={a.id} />
              <input name="bodyWeightKg" type="number" step="0.1" min={30} max={300} defaultValue={a.weight} className="px-input !w-20 !text-xl" aria-label="Peso oficial" />
              <button className="px-btn px-btn-sm" aria-label="Verificar peso"><PixelIcon name="scale" size={14} /></button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function HistoryTab({ seasonId }: { seasonId: string }) {
  const rows = await loadSubs(seasonId, false);
  return (
    <ul className="stagger flex flex-col gap-1">
      {rows.map((r) => (
        <li key={r.id} className="px-box flex items-center gap-2 p-2">
          <PixelAvatar avatar={r.profiles?.avatar} size={36} shadow={false} animate={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl leading-none">{r.profiles?.full_name}</p>
            <p className="truncate text-base text-muted">{r.machines?.name} · {formatKg(Number(r.lifted_weight_kg))} × {r.reps_completed}{r.admin_notes && <> · {r.admin_notes}</>}</p>
          </div>
          <span className="font-pixel text-[9px] text-gold">{Number(r.calculated_score).toFixed(2)}</span>
          <StatusChip status={r.status} />
        </li>
      ))}
    </ul>
  );
}

// Leer la URL dentro de un <Suspense> mantiene la navegación instantánea (se ve el esqueleto al tiro).
export default function Juez(props: { searchParams: Promise<{ tab?: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <JuezContent {...props} />
    </Suspense>
  );
}
