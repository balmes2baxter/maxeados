import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { getPlayerState } from "@/lib/data";
import { signOut } from "@/actions/auth";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { StatusChip } from "@/components/StatusChip";
import { ProfileForm } from "./ProfileForm";

export default async function Perfil() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const stats = [
    { label: "Nivel", value: st.level.level, color: "text-gold" },
    { label: "XP", value: st.level.xp, color: "text-gold" },
    { label: "Puesto", value: st.me ? `#${st.me.rank}` : "—", color: "text-neon" },
    { label: "Puntos", value: (st.me?.total ?? 0).toFixed(2), color: "text-neon" },
    { label: "Racha", value: `${st.streak}d`, color: "text-pink" },
    { label: "Intentos", value: st.subs.length, color: "text-cyan" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="px-box anim-rise flex flex-col items-center gap-2 p-4" style={{ background: "radial-gradient(circle at 50% 40%, #3b2d52, #1c1528 70%)" }}>
        <PixelAvatar avatar={user.avatar} size={190} />
        <h1 className="text-3xl leading-none">{user.full_name}</h1>
        <div className="flex flex-wrap justify-center gap-1">
          <span className="px-chip" style={{ ["--chip" as string]: st.tier.color, ["--chip-fg" as string]: "#140c1c" }}>Liga {st.tier.name}</span>
          <span className="px-chip">{st.level.title}</span>
          <span className="px-chip" style={user.weight_verified ? { ["--chip" as string]: "#39ff14", ["--chip-fg" as string]: "#140c1c" } : undefined}>
            {user.body_weight_kg} kg {user.weight_verified ? "✔ verificado" : "· sin verificar"}
          </span>
          {user.role === "ADMIN" && <span className="px-chip" style={{ ["--chip" as string]: "#ff3ea5", ["--chip-fg" as string]: "#140c1c" }}>Juez</span>}
        </div>
        <div className="w-full">
          <div className="flex justify-between text-base text-muted">
            <span>NV {st.level.level}</span>
            <span>{st.level.xp - st.level.floor}/{st.level.next - st.level.floor} XP</span>
            <span>NV {st.level.level + 1}</span>
          </div>
          <div className="px-bar">
            <span style={{ width: `${Math.round(st.level.progress * 100)}%`, ["--fill" as string]: "var(--color-gold)" }} />
          </div>
        </div>
        <Link href="/perfil/personaje" className="px-btn px-btn-pink w-full">
          <PixelIcon name="user" size={16} /> Editar personaje
        </Link>
      </section>

      <section className="stagger grid grid-cols-3 gap-1">
        {stats.map((s) => (
          <div key={s.label} className="px-box flex flex-col items-center p-2">
            <span className={`font-pixel text-sm ${s.color}`}>{s.value}</span>
            <span className="px-label">{s.label}</span>
          </div>
        ))}
      </section>

      <section id="logros" className="px-box p-4">
        <h2 className="font-pixel mb-3 text-[11px] text-gold">LOGROS</h2>
        <ul className="stagger grid grid-cols-2 gap-2">
          {st.badges.map((b) => (
            <li
              key={b.id}
              className={`flex items-center gap-2 bg-panel-2 p-2 transition-all duration-300 ${b.unlocked ? "" : "opacity-45 grayscale"}`}
            >
              <PixelIcon name={b.unlocked ? b.icon : "lock"} size={26} className={b.unlocked ? "anim-glow" : ""} />
              <div className="min-w-0">
                <p className="font-pixel text-[8px] leading-tight text-bone">{b.name}</p>
                <p className="text-base leading-none text-muted">{b.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <ProfileForm fullName={user.full_name} phone={user.phone ?? ""} bodyWeightKg={user.body_weight_kg!} />

      <section className="px-box p-4">
        <h2 className="font-pixel mb-3 text-[11px] text-cyan">HISTORIAL DE LA TEMPORADA</h2>
        {st.subs.length === 0 ? (
          <p className="text-xl text-muted">Sin intentos todavía.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {st.subs.map((s) => (
              <li key={s.id} className="flex items-center gap-2 bg-panel-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl leading-none">{s.machineName}</p>
                  <p className="text-base text-muted">
                    ×{s.repsCompleted} · {s.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    {s.adminNotes && <span className="text-pink"> · “{s.adminNotes}”</span>}
                  </p>
                </div>
                <span className="font-pixel text-[9px] text-gold">{s.score.toFixed(2)}</span>
                <StatusChip status={s.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={signOut}>
        <button className="px-btn px-btn-ghost w-full">
          <PixelIcon name="door" size={16} /> Cerrar sesión
        </button>
      </form>
    </div>
  );
}
