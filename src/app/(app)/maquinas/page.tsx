import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { getPlayerState } from "@/lib/data";
import { MachineSprite } from "@/components/MachineSprite";
import { StatusChip } from "@/components/StatusChip";

export default async function Maquinas() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-pixel text-shadow-px text-sm text-neon">CIRCUITO OFICIAL</h1>
      <p className="-mt-1 text-xl text-muted">Un intento aprobado en cada máquina te clasifica al pozo. Se usa el peso tope de la pila.</p>
      <ul className="stagger flex flex-col gap-2">
        {st.machines.map((m, i) => {
          const best = st.me?.best[m.id];
          const last = st.subs.find((s) => s.machineId === m.id);
          return (
            <li key={m.id}>
              <Link href={`/maquinas/${m.slug}`} className="px-box lift-hover flex items-center gap-3 p-3">
                <span className="font-pixel w-5 text-[10px] text-muted">{i + 1}</span>
                <MachineSprite slug={m.slug} size={60} lit={best !== undefined ? 6 : 0} accent={best !== undefined ? "#39ff14" : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl leading-none">{m.name}</p>
                  <p className="text-lg text-muted">{m.muscle_group}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <span className="px-chip">Tope {m.max_weight_kg} kg</span>
                    {last && <StatusChip status={last.status} />}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-pixel text-sm text-gold">{best !== undefined ? best.toFixed(2) : "—"}</p>
                  <p className="px-label">mejor</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
