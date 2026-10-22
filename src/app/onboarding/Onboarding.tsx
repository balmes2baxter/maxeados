"use client";

import { useActionState, useEffect, useState } from "react";
import { completeOnboarding } from "@/actions/game";
import { CharacterCreator } from "@/components/CharacterCreator";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { sfx } from "@/components/fx";
import type { Avatar } from "@/lib/avatar";
import { Intro } from "./Intro";

const STEPS = ["Personaje", "Ficha"];
const RULES = [
  { icon: "dumbbell", t: "6 máquinas" },
  { icon: "flag", t: "Desde el gym" },
  { icon: "gavel", t: "El juez valida" },
];

export function Onboarding({
  initialAvatar,
  initialName,
  initialPhone,
  initialWeight,
  prize,
  locked,
}: {
  initialAvatar: Avatar;
  initialName: string;
  initialPhone: string;
  initialWeight?: number;
  prize: string;
  locked: { id: string; price: number }[];
}) {
  const [step, setStep] = useState(-1); // -1 = intro del torneo
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

  if (step === -1) return <Intro prize={prize} onDone={() => setStep(0)} />;

  return (
    <main className="intro-in mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-6">
      <div className="mb-4 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div className="h-3 transition-colors duration-500" style={{ background: i <= step ? "var(--color-neon)" : "var(--color-line)", boxShadow: "0 0 0 2px #140c1c" }} />
            <span className={`font-pixel text-[8px] ${i === step ? "text-neon" : "text-muted"}`}>{label}</span>
          </div>
        ))}
      </div>

      <div key={step} className="anim-rise flex flex-1 flex-col">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h1 className="font-pixel text-shadow-px text-base text-neon">TU PERSONAJE</h1>
            <CharacterCreator value={avatar} onChange={setAvatar} locked={locked} />
            <button className="px-btn" onClick={() => go(1)}>
              Listo
            </button>
          </div>
        )}

        {step === 1 && (
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="avatar" value={JSON.stringify(avatar)} />
            <div className="flex flex-col items-center">
              <PixelAvatar avatar={avatar} size={130} pose="flex" />
            </div>
            <div className="grid grid-cols-3 gap-1">
              {RULES.map((r) => (
                <div key={r.t} className="px-box flex flex-col items-center gap-1 p-2">
                  <PixelIcon name={r.icon} size={24} />
                  <span className="font-pixel text-center text-[7px] leading-tight text-bone">{r.t}</span>
                </div>
              ))}
            </div>

            <label className="px-label mt-2" htmlFor="fullName">Nombre de atleta</label>
            <input id="fullName" name="fullName" className="px-input" defaultValue={initialName} required maxLength={120} />

            <label className="px-label mt-2" htmlFor="bodyWeightKg">Tu peso (kg)</label>
            <input
              id="bodyWeightKg"
              name="bodyWeightKg"
              className="px-input font-pixel !text-lg"
              type="number"
              inputMode="decimal"
              min={30}
              max={250}
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75"
            />
            <input type="hidden" name="phone" value={initialPhone} />

            {state?.error && <p className="anim-shake px-box p-2 text-xl text-danger">⚠ {state.error}</p>}

            <div className="mt-4 flex">
              <button type="button" className="px-btn px-btn-ghost" onClick={() => go(0)} aria-label="Atrás">
                <PixelIcon name="back" size={14} />
              </button>
              <button className="px-btn flex-1" disabled={pending}>
                {pending ? "Guardando..." : "¡A competir!"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
