import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { daysLeft, formatCop, getPlayerState, getRecentActivity, shortName } from "@/lib/data";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { MachineSprite } from "@/components/MachineSprite";
import { MACHINES_REQUIRED } from "@/lib/scoring";

export default async function Inicio() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const activity = st.season ? await getRecentActivity(st.season.id) : [];
  const done = st.me?.machinesDone ?? 0;
  const left = st.season ? daysLeft(st.season) : 0;
  const totalDays = st.season
    ? Math.max(1, Math.round((new Date(st.season.end_date).getTime() - new Date(st.season.start_date).getTime()) / 86400000) + 1)
    : 1;
  const leader = st.board.find((b) => b.eligible);

  return (
    <div className="stagger flex flex-col gap-4">
      {/* Héroe */}
      <section className="px-box relative overflow-hidden p-4" style={{ background: "linear-gradient(#271d38 0 72%, #1a1226 72%)" }}>
        <div className="absolute inset-x-0 top-[72%] h-1 bg-line" />
        <div className="relative flex items-end gap-3">
          <PixelAvatar avatar={user.avatar} size={150} pose={st.me?.eligible ? "flex" : "idle"} />
          <div className="mb-4 flex flex-1 flex-col gap-2">
            <span className="px-chip self-start" style={{ ["--chip" as string]: st.tier.color, ["--chip-fg" as string]: "#140c1c" }}>
              Liga {st.tier.name}
            </span>
            <p className="font-pixel text-shadow-px text-2xl text-neon">{(st.me?.total ?? 0).toFixed(2)}</p>
            <p className="px-label -mt-1">puntos</p>
            <p className="text-xl leading-none">
              {st.me ? <>Puesto <span className="text-gold">#{st.me.rank}</span> de {st.board.length}</> : "Aún sin puntos"}
            </p>
            <p className="text-lg leading-none text-muted">{st.level.title} · {st.level.xp} XP</p>
          </div>
        </div>
        {st.tier.next && (
          <div className="relative mt-1">
            <div className="flex justify-between text-base text-muted">
              <span>{st.tier.name}</span>
              <span>{st.tier.next.name} en {(st.tier.next.min - (st.me?.total ?? 0)).toFixed(2)} pts</span>
            </div>
            <div className="px-bar">
              <span style={{
                width: `${Math.min(100, (((st.me?.total ?? 0) - st.tier.min) / (st.tier.next.min - st.tier.min)) * 100)}%`,
                ["--fill" as string]: st.tier.next.color,
              }} />
            </div>
          </div>
        )}
      </section>

      {/* Temporada y pozo */}
      {st.season ? (
        <section className="px-box px-box-accent p-4" style={{ ["--accent" as string]: "#ffd700" }}>
          <div className="flex items-center gap-3">
            <PixelIcon name="coin" size={40} className="anim-spin-coin shrink-0" />
            <div className="flex-1">
              <p className="px-label">{st.season.title}</p>
              <p className="font-pixel text-lg text-gold">{formatCop(st.season.prize_amount_cop)} COP</p>
            </div>
            <div className="text-center">
              <p className="font-pixel text-xl text-pink">{left}</p>
              <p className="px-label">días</p>
            </div>
          </div>
          <div className="px-bar mt-3">
            <span style={{ width: `${((totalDays - left) / totalDays) * 100}%`, ["--fill" as string]: "var(--color-pink)" }} />
          </div>
          <p className="mt-2 text-xl leading-tight">
            {done >= MACHINES_REQUIRED ? (
              <span className="text-neon">✔ Calificas al pozo. ¡Defiende tu puesto!</span>
            ) : (
              <>Te faltan <span className="text-gold">{MACHINES_REQUIRED - done}</span> máquinas aprobadas para pelear el pozo.</>
            )}
          </p>
          {leader && (
            <p className="text-lg text-muted">Va ganando: <span className="text-bone">{shortName(leader.user.fullName)}</span> con {leader.total.toFixed(2)}</p>
          )}
        </section>
      ) : (
        <section className="px-box p-4 text-xl">No hay temporada activa. El juez debe abrir una.</section>
      )}

      {/* Circuito */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-pixel text-[11px] text-cyan">CIRCUITO {done}/6</h2>
          <Link href="/maquinas" className="text-lg text-muted underline-offset-4 hover:underline">Ver todo →</Link>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {st.machines.map((m) => {
            const best = st.me?.best[m.id];
            const pend = st.subs.some((s) => s.machineId === m.id && s.status === "PENDING");
            return (
              <Link key={m.id} href={`/maquinas/${m.slug}`} className="px-box lift-hover flex flex-col items-center gap-1 p-2">
                <MachineSprite slug={m.slug} size={56} lit={best !== undefined ? 6 : pend ? 3 : 0} accent={best !== undefined ? "#39ff14" : "#6e6e85"} />
                <span className="text-center text-base leading-none">{m.name.split(" ")[0]}</span>
                {best !== undefined ? (
                  <span className="font-pixel text-[9px] text-neon">{best.toFixed(2)}</span>
                ) : pend ? (
                  <span className="font-pixel text-[8px] text-cyan">EN JUICIO</span>
                ) : (
                  <span className="font-pixel text-[8px] text-muted">POR MAXEAR</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Misiones */}
      <section className="px-box p-4">
        <h2 className="font-pixel mb-3 text-[11px] text-pink">MISIONES</h2>
        <ul className="flex flex-col gap-3">
          {st.quests.map((q) => {
            const complete = q.progress >= q.goal;
            return (
              <li key={q.id}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xl leading-none ${complete ? "text-neon" : ""}`}>
                    {complete ? "✔ " : ""}{q.title}
                  </span>
                  <span className="font-pixel shrink-0 text-[9px] text-gold">+{q.xp} XP</span>
                </div>
                <div className="px-bar !h-3">
                  <span style={{ width: `${(q.progress / q.goal) * 100}%`, ["--fill" as string]: complete ? "var(--color-neon)" : "var(--color-cyan)" }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Logros */}
      <Link href="/perfil#logros" className="px-box lift-hover flex items-center gap-3 p-4">
        <PixelIcon name="star" size={32} className="anim-float" />
        <div className="flex-1">
          <p className="font-pixel text-[11px] text-gold">LOGROS</p>
          <p className="text-xl">{st.badges.filter((b) => b.unlocked).length} de {st.badges.length} desbloqueados</p>
        </div>
        <div className="flex -space-x-1">
          {st.badges.filter((b) => b.unlocked).slice(0, 4).map((b) => <PixelIcon key={b.id} name={b.icon} size={22} />)}
        </div>
      </Link>

      {/* Actividad */}
      {activity.length > 0 && (
        <section className="px-box overflow-hidden py-2">
          <div className="anim-marquee flex w-max gap-8 whitespace-nowrap text-xl">
            {[...activity, ...activity].map((a, i) => (
              <span key={`${a.id}-${i}`}>
                <span className="text-neon">▲</span> {shortName(a.name)} · {a.machine.split(" ")[0]} ×{a.reps} <span className="text-gold">{a.score.toFixed(2)}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <Link href="/maquinas" className="px-btn px-btn-gold">
        <PixelIcon name="video" size={18} /> Subir intento
      </Link>
    </div>
  );
}
