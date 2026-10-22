import { Suspense } from "react";
import Loading from "../loading";
import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { getPlayerState } from "@/lib/data";
import { signOut } from "@/actions/auth";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { StatusChip } from "@/components/StatusChip";
import { ProfileForm } from "./ProfileForm";

async function PerfilContent() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  return (
    <div className="flex flex-col gap-4">
      <section className="px-box anim-rise flex flex-col items-center gap-2 p-4" style={{ background: "radial-gradient(circle at 50% 40%, #3b2d52, #1c1528 70%)" }}>
        <PixelAvatar avatar={user.avatar} size={190} />
        <h1 className="text-3xl leading-none">{user.full_name}</h1>
        <div className="flex flex-wrap justify-center gap-1">
          <span className="px-chip" style={user.weight_verified ? { ["--chip" as string]: "var(--color-neon)", ["--chip-fg" as string]: "var(--color-ink)" } : undefined}>
            {user.body_weight_kg} kg {user.weight_verified ? "✔" : ""}
          </span>
          {user.role === "ADMIN" && <span className="px-chip" style={{ ["--chip" as string]: "var(--color-bone)", ["--chip-fg" as string]: "var(--color-ink)" }}>Juez</span>}
        </div>
        <Link href="/perfil/personaje" className="px-btn px-btn-ghost w-full">
          <PixelIcon name="user" size={16} /> Editar personaje
        </Link>
      </section>

      <section id="logros" className="px-box p-4">
        <h2 className="font-pixel mb-3 text-[11px] text-bone">LOGROS {st.badges.filter((b) => b.unlocked).length}/{st.badges.length}</h2>
        <ul className="stagger grid grid-cols-5 gap-1">
          {st.badges.map((b) => (
            <li
              key={b.id}
              title={`${b.name}: ${b.description}`}
              className={`flex aspect-square items-center justify-center bg-panel-2 ${b.unlocked ? "" : "opacity-35 grayscale"}`}
            >
              <PixelIcon name={b.unlocked ? b.icon : "lock"} size={28} />
            </li>
          ))}
        </ul>
      </section>

      <ProfileForm fullName={user.full_name} phone={user.phone ?? ""} bodyWeightKg={user.body_weight_kg!} />

      <section className="px-box p-4">
        <h2 className="font-pixel mb-3 text-[11px] text-bone">HISTORIAL</h2>
        {st.subs.length === 0 ? (
          <p className="text-xl text-muted">Sin intentos todavía.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {st.subs.map((s) => (
              <li key={s.id} className="flex items-center gap-2 bg-panel-2 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xl leading-none">{s.machineName}</p>
                  <p className="text-base text-muted">
                    {s.liftedKg} kg × {s.repsCompleted} · {s.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                    {s.adminNotes && <span> · “{s.adminNotes}”</span>}
                  </p>
                </div>
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

// La sesión se lee dentro de un <Suspense>: la navegación muestra el esqueleto al instante.
export default function Perfil() {
  return (
    <Suspense fallback={<Loading />}>
      <PerfilContent />
    </Suspense>
  );
}
