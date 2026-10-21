import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { MachineSprite } from "@/components/MachineSprite";
import { randomAvatar } from "@/lib/avatar";
import { MACHINE_SLUGS } from "@/lib/machineSprite";
import { GoogleButton } from "./google-button";
import { DevLogin } from "./dev-login";
import { isDevLoginEnabled } from "@/lib/devLogin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const crowd = Array.from({ length: 10 }, () => randomAvatar());

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-8">
      <header className="anim-rise text-center">
        <p className="font-pixel text-[10px] text-cyan">★ LIGA DE FUERZA RELATIVA ★</p>
        <h1 className="font-pixel text-shadow-px anim-glow mt-4 text-[34px] leading-tight text-neon" style={{ ["--glow" as string]: "#39ff14" }}>
          MAXEADOS
        </h1>
        <p className="mt-3 text-2xl text-muted">Lleva las 6 máquinas al tope de la pila. Pelea el pozo del mes.</p>
      </header>

      {/* Desfile de atletas */}
      <div className="relative mt-6 overflow-hidden py-2" aria-hidden>
        <div className="anim-marquee flex w-max gap-6">
          {[...crowd, ...crowd].map((a, i) => (
            <PixelAvatar key={i} avatar={a} size={78} pose={i % 4 === 0 ? "flex" : "idle"} />
          ))}
        </div>
        <div className="h-2 bg-line" />
      </div>

      <section className="px-box anim-pop mt-6 flex items-center gap-4 p-4" style={{ animationDelay: "120ms" }}>
        <PixelIcon name="coin" size={44} className="anim-spin-coin shrink-0" />
        <div>
          <p className="px-label">Pozo de la temporada</p>
          <p className="font-pixel text-lg text-gold">$100.000 COP</p>
          <p className="text-lg text-muted">30 días · 6 máquinas · 1 campeón</p>
        </div>
      </section>

      <section className="stagger mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { icon: "video", t: "Graba", d: "tu serie al tope" },
          { icon: "gavel", t: "El juez", d: "valida el video" },
          { icon: "trophy", t: "Sube", d: "en el ranking" },
        ].map((s) => (
          <div key={s.t} className="px-box flex flex-col items-center gap-2 p-3">
            <PixelIcon name={s.icon} size={28} />
            <p className="font-pixel text-[9px] text-neon">{s.t}</p>
            <p className="text-base leading-none text-muted">{s.d}</p>
          </div>
        ))}
      </section>

      <div className="mt-4 flex justify-center gap-1" aria-hidden>
        {MACHINE_SLUGS.map((s, i) => (
          <div key={s} className="anim-float" style={{ animationDelay: `${i * 0.25}s` }}>
            <MachineSprite slug={s} size={44} lit={6} />
          </div>
        ))}
      </div>

      <section className="mt-6 flex flex-col gap-3">
        {error && <p className="anim-shake px-box p-3 text-center text-xl text-danger">No pudimos iniciar sesión. Intenta de nuevo.</p>}
        {/* En local no hace falta Google: se entra con correo contra el Supabase. */}
        {isDevLoginEnabled() ? (
          <div className="flex flex-col gap-3">
            <DevLogin />
            <div className="relative my-1 text-center">
              <span className="font-pixel text-[8px] text-muted">─ O CON GOOGLE ─</span>
            </div>
            <GoogleButton />
          </div>
        ) : (
          <GoogleButton />
        )}
        <p className="text-center text-base text-muted">Al continuar aceptas las reglas de la temporada.</p>
      </section>

      <p className="mt-auto pt-8 text-center text-base text-muted">
        Puntaje = (peso tope ÷ tu peso) × (1 + reps/30) · máx. 15 reps
      </p>
    </main>
  );
}
