import { Suspense } from "react";
import Loading from "../loading";
import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { bestLifts, formatKg, getPlayerState, shortName } from "@/lib/data";
import { MachineSprite } from "@/components/MachineSprite";
import { StatusChip } from "@/components/StatusChip";

async function MaquinasContent() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const lifts = bestLifts(st.subs);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-pixel text-shadow-px text-sm text-neon">CIRCUITO OFICIAL</h1>
      <ul className="stagger flex flex-col gap-2">
        {st.machines.map((m, i) => {
          const mine = lifts[m.id];
          const last = st.subs.find((s) => s.machineId === m.id);
          const leader = st.board
            .filter((b) => b.best[m.id] !== undefined)
            .sort((a, b) => b.best[m.id] - a.best[m.id] || a.bodyWeightKg - b.bodyWeightKg)[0];
          const iLead = leader?.userId === user.id;
          return (
            <li key={m.id}>
              <Link href={`/maquinas/${m.slug}`} className="px-box lift-hover flex items-center gap-3 p-3">
                <span className="font-pixel w-5 text-[10px] text-muted">{i + 1}</span>
                <MachineSprite slug={m.slug} size={60} lit={mine ? 6 : 0} accent={mine ? "#39ff14" : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl leading-none">{m.name}</p>
                  <p className="text-lg text-muted">
                    {leader ? <>Líder: <span className={iLead ? "text-neon" : "text-bone"}>{iLead ? "tú" : shortName(leader.user.fullName)}</span></> : "Sin líder"}
                  </p>
                  {last && <div className="mt-1"><StatusChip status={last.status} /></div>}
                </div>
                <div className="text-right">
                  <p className="font-pixel text-[11px] text-gold">{mine ? formatKg(mine.kg) : "—"}</p>
                  <p className="px-label">{mine ? `× ${mine.reps}` : "tu marca"}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// La sesión se lee dentro de un <Suspense>: la navegación muestra el esqueleto al instante.
export default function Maquinas() {
  return (
    <Suspense fallback={<Loading />}>
      <MaquinasContent />
    </Suspense>
  );
}
