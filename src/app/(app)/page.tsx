import { Suspense } from "react";
import Link from "next/link";
import Loading from "./loading";
import { requireAthlete } from "@/lib/session";
import { bestLifts, formatKg, getPlayerState, shortName } from "@/lib/data";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { MachineSprite } from "@/components/MachineSprite";
import { MACHINES_REQUIRED } from "@/lib/scoring";

async function InicioContent() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const lifts = bestLifts(st.subs);
  const done = st.me?.machinesDone ?? 0;
  // El rival es quien está justo arriba en la tabla
  const myIndex = st.me ? st.board.findIndex((b) => b.userId === user.id) : -1;
  const rival = myIndex > 0 ? st.board[myIndex - 1] : null;

  return (
    <div className="stagger flex flex-col gap-4">
      {/* Tú */}
      <section className="px-box relative overflow-hidden p-4" style={{ background: "linear-gradient(#271d38 0 72%, #1a1226 72%)" }}>
        <div className="absolute inset-x-0 top-[72%] h-1 bg-line" />
        <div className="relative flex items-end gap-4">
          <PixelAvatar avatar={user.avatar} size={160} pose={st.me?.eligible ? "flex" : "idle"} />
          <div className="mb-6 flex flex-1 flex-col gap-1">
            <span className="px-chip self-start" style={{ ["--chip" as string]: st.tier.color, ["--chip-fg" as string]: "var(--color-ink)" }}>
              {st.tier.name}
            </span>
            <p className="font-pixel text-shadow-px text-3xl text-gold">{(st.me?.total ?? 0).toFixed(1)}</p>
            <p className="px-label">puntos</p>
          </div>
        </div>
        <p className="relative text-center text-xl leading-tight">
          {!st.me ? (
            <>Sube tu primera serie</>
          ) : rival ? (
            <>A <span className="text-gold">{(rival.total - st.me.total).toFixed(1)}</span> de {shortName(rival.user.fullName)}</>
          ) : (
            <span className="text-neon">Vas primero</span>
          )}
        </p>
      </section>

      {/* Circuito */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-pixel text-[11px] text-bone">CIRCUITO</h2>
          <span className={`font-pixel text-[11px] ${done >= MACHINES_REQUIRED ? "text-neon" : "text-muted"}`}>{done}/{MACHINES_REQUIRED}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {st.machines.map((m) => {
            const mine = lifts[m.id];
            const pend = st.subs.some((s) => s.machineId === m.id && s.status === "PENDING");
            return (
              <Link key={m.id} href={`/maquinas/${m.slug}`} className="px-box lift-hover flex flex-col items-center gap-1 p-2">
                <MachineSprite slug={m.slug} size={56} lit={mine ? 6 : pend ? 3 : 0} accent={mine ? "#39ff14" : "#6e6e85"} />
                <span className="text-center text-base leading-none">{m.name.split(" ")[0]}</span>
                {mine ? (
                  <span className="font-pixel text-[9px] text-gold">{formatKg(mine.kg)}</span>
                ) : pend ? (
                  <PixelIcon name="hourglass" size={14} title="En juicio" />
                ) : (
                  <span className="font-pixel text-[9px] text-muted">—</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <Link href="/maquinas" className="px-btn">
        <PixelIcon name="video" size={18} /> Subir intento
      </Link>
    </div>
  );
}

export default function Inicio() {
  return (
    <Suspense fallback={<Loading />}>
      <InicioContent />
    </Suspense>
  );
}
