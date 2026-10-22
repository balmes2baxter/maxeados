import { Suspense } from "react";
import Loading from "../../loading";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAthlete } from "@/lib/session";
import { bestLifts, formatKg, getPlayerState, gymReady, seasonOpen, shortName } from "@/lib/data";
import { isDevLoginEnabled } from "@/lib/devLogin";
import { MachineSprite } from "@/components/MachineSprite";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { StatusChip } from "@/components/StatusChip";
import { AttemptForm } from "./AttemptForm";

async function MachinePageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const machine = st.machines.find((m) => m.slug === slug);
  if (!machine) notFound();

  const history = st.subs.filter((s) => s.machineId === machine.id);
  const hasPending = history.some((s) => s.status === "PENDING");
  const best = st.me?.best[machine.id];
  const myLift = bestLifts(st.subs)[machine.id];
  const season = st.season;
  const top = st.board
    .filter((b) => b.best[machine.id] !== undefined)
    .sort((a, b) => b.best[machine.id] - a.best[machine.id] || a.bodyWeightKg - b.bodyWeightKg)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/maquinas" className="flex items-center gap-2 text-xl text-muted">
        <PixelIcon name="back" size={14} /> Circuito
      </Link>

      <section className="px-box anim-rise flex items-center gap-4 p-4">
        <MachineSprite slug={machine.slug} size={110} charge accent="#39ff14" />
        <div className="flex-1">
          <h1 className="text-3xl leading-none">{machine.name}</h1>
          <p className="text-xl text-muted">{machine.muscle_group}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="px-chip" style={{ ["--chip" as string]: "var(--color-gold)", ["--chip-fg" as string]: "var(--color-ink)" }}>
              Tu marca: {myLift ? `${formatKg(myLift.kg)} × ${myLift.reps}` : "sin marca"}
            </span>
          </div>
        </div>
      </section>

      <AttemptForm
        userId={user.id}
        machineId={machine.id}
        maxWeightKg={Number(machine.max_weight_kg)}
        bodyWeightKg={user.body_weight_kg!}
        lastKg={history[0]?.liftedKg ?? null}
        best={best ?? null}
        avatar={user.avatar}
        gym={gymReady(season) ? { name: season!.gym_name, lat: season!.gym_lat!, lng: season!.gym_lng!, radius: season!.gym_radius_m } : null}
        allowSimulatedGeo={isDevLoginEnabled()}
        disabledReason={
          !seasonOpen(season)
            ? "No hay temporada abierta."
            : !gymReady(season)
              ? "El juez aún no fija el gym"
              : hasPending
              ? "Tienes uno en juicio"
              : null
        }
      />

      {top.length > 0 && (
        <section className="px-box p-4">
          <h2 className="font-pixel mb-3 text-[11px] text-bone">TOP DE LA MÁQUINA</h2>
          <ol className="flex flex-col gap-2">
            {top.map((b, i) => (
              <li key={b.userId} className={`flex items-center gap-3 ${b.userId === user.id ? "text-neon" : ""}`}>
                <span className="font-pixel w-6 text-[10px]">{i + 1}</span>
                <PixelAvatar avatar={b.user.avatar} size={36} shadow={false} animate={false} />
                <span className="flex-1 truncate text-xl">{shortName(b.user.fullName)}</span>
                <span className="font-pixel text-[10px] text-gold">{b.best[machine.id].toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="px-box p-4">
        <h2 className="font-pixel mb-3 text-[11px] text-bone">TUS INTENTOS</h2>
        {history.length === 0 ? (
          <p className="text-xl text-muted">Aún nada</p>
        ) : (
          <ul className="stagger flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="flex flex-col gap-1 bg-panel-2 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl">
                    {formatKg(h.liftedKg)} × {h.repsCompleted}
                  </span>
                  <StatusChip status={h.status} />
                </div>
                <div className="flex items-center justify-between text-lg text-muted">
                  <span>{h.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>
                  {h.evidenceUrl ? (
                    <a href={h.evidenceUrl} target="_blank" rel="noreferrer" className="text-bone underline-offset-4 hover:underline">ver video</a>
                  ) : (
                    <span>video subido</span>
                  )}
                  <span className="font-pixel text-[10px] text-gold">{h.score.toFixed(2)}</span>
                </div>
                {h.adminNotes && <p className="text-lg text-muted">Juez: “{h.adminNotes}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Leer la URL dentro de un <Suspense> mantiene la navegación instantánea (se ve el esqueleto al tiro).
export default function MachinePage(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <MachinePageContent {...props} />
    </Suspense>
  );
}
