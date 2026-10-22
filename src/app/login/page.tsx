import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { randomAvatar, seededRandom } from "@/lib/avatar";
import { GoogleButton } from "./google-button";
import { DevLogin } from "./dev-login";
import { isDevLoginEnabled } from "@/lib/devLogin";

import { Suspense } from "react";

async function LoginError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return <p className="anim-shake px-box p-3 text-center text-xl text-danger">No pudimos iniciar sesión. Intenta de nuevo.</p>;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const crowd = Array.from({ length: 10 }, (_, i) => randomAvatar(seededRandom(i * 7919 + 3)));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-8">
      <header className="anim-rise text-center">
        <p className="font-pixel text-[10px] text-gold">★ LIGA DE FUERZA RELATIVA ★</p>
        <h1 className="font-pixel text-shadow-px anim-glow mt-4 text-[34px] leading-tight text-neon" style={{ ["--glow" as string]: "#39ff14" }}>
          MAXEADOS
        </h1>
        <p className="mt-3 text-2xl text-muted">6 máquinas. 30 días. Un campeón se lleva el pozo.</p>
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
          <p className="px-label">Pozo</p>
          <p className="font-pixel text-lg text-gold">$100.000</p>
        </div>
      </section>

      <section className="mt-6 flex flex-col gap-3">
        <Suspense>
          <LoginError searchParams={searchParams} />
        </Suspense>
        {/* En local no hace falta Google: se entra con correo contra el Supabase local. */}
        {isDevLoginEnabled() ? <DevLogin /> : <GoogleButton />}
      </section>

    </main>
  );
}
