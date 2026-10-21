"use client";

import { useActionState, useEffect, useState } from "react";
import { completeOnboarding } from "@/actions/game";
import { CharacterCreator } from "@/components/CharacterCreator";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { sfx } from "@/components/fx";
import type { Avatar } from "@/lib/avatar";

const INTRO = "¡Bienvenido al gym! Antes de entrenar necesitas tu personaje. Así te verán todos en el ranking.";

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN((x) => x + 1), 28);
    return () => clearTimeout(t);
  }, [n, text]);
  return (
    <p className="text-2xl leading-tight">
      {text.slice(0, n)}
      <span className="anim-blink">▌</span>
    </p>
  );
}

export function Onboarding({
  initialAvatar,
  initialName,
  initialPhone,
  initialWeight,
}: {
  initialAvatar: Avatar;
  initialName: string;
  initialPhone: string;
  initialWeight?: number;
}) {
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [weight, setWeight] = useState(initialWeight ? String(initialWeight) : "");
  const [state, action, pending] = useActionState(completeOnboarding, undefined);

  useEffect(() => {
    if (state?.error) sfx("error");
  }, [state]);

  const go = (s: number) => {
    sfx(s > step ? "select" : "blip");
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-6">
      {/* Progreso por pasos */}
      <div className="mb-4 flex items-center gap-2">
        {["Intro", "Personaje", "Datos"].map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div className="h-3 transition-colors duration-500" style={{ background: i <= step ? "var(--color-neon)" : "var(--color-line)", boxShadow: "0 0 0 2px #140c1c" }} />
            <span className={`font-pixel text-[8px] ${i === step ? "text-neon" : "text-muted"}`}>{label}</span>
          </div>
        ))}
      </div>

      <div key={step} className="anim-rise flex flex-1 flex-col">
        {step === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <PixelAvatar avatar={avatar} size={200} pose="flex" />
            <div className="px-box w-full p-4">
              <p className="font-pixel mb-2 text-[10px] text-gold">ENTRENADOR</p>
              <Typewriter text={INTRO} />
            </div>
            <button className="px-btn w-full" onClick={() => go(1)}>
              ¡Vamos! <PixelIcon name="back" size={14} className="rotate-180" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="font-pixel text-shadow-px text-base text-neon">Crea tu personaje</h1>
            <CharacterCreator value={avatar} onChange={setAvatar} />
            <div className="flex">
              <button className="px-btn px-btn-ghost" onClick={() => go(0)}>
                <PixelIcon name="back" size={14} />
              </button>
              <button className="px-btn flex-1" onClick={() => go(2)}>
                Listo, sigue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="avatar" value={JSON.stringify(avatar)} />
            <div className="flex items-end gap-3">
              <PixelAvatar avatar={avatar} size={110} />
              <div className="px-box flex-1 p-3">
                <p className="font-pixel text-[10px] text-gold">FICHA DEL ATLETA</p>
                <p className="text-xl leading-tight">Tu peso corporal define tu fuerza relativa. El juez lo verificará en el gym.</p>
              </div>
            </div>

            <label className="px-label mt-2" htmlFor="fullName">Nombre de atleta</label>
            <input id="fullName" name="fullName" className="px-input" defaultValue={initialName} required maxLength={120} />

            <label className="px-label mt-2" htmlFor="phone">Teléfono (opcional)</label>
            <input id="phone" name="phone" className="px-input" defaultValue={initialPhone} inputMode="tel" maxLength={20} placeholder="300 000 0000" />

            <label className="px-label mt-2" htmlFor="bodyWeightKg">Peso corporal (kg)</label>
            <div className="flex items-center gap-3">
              <input
                id="bodyWeightKg"
                name="bodyWeightKg"
                className="px-input font-pixel !text-lg"
                type="number"
                min={30}
                max={250}
                step="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
              />
              <PixelIcon name="scale" size={40} className={weight ? "anim-pop" : ""} />
            </div>

            {state?.error && <p className="anim-shake px-box p-2 text-xl text-danger">⚠ {state.error}</p>}

            <div className="mt-4 flex">
              <button type="button" className="px-btn px-btn-ghost" onClick={() => go(1)}>
                <PixelIcon name="back" size={14} />
              </button>
              <button className="px-btn px-btn-gold flex-1" disabled={pending}>
                {pending ? "Guardando..." : "¡Entrar al gym!"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
