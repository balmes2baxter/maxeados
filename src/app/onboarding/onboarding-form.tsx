"use client";

import { useActionState } from "react";
import { saveProfile, type OnboardingState } from "./actions";

const input =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-lg text-white placeholder-zinc-600 outline-none focus:border-lime-400";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    saveProfile,
    {},
  );

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-400">Nombre completo</span>
        <input name="full_name" defaultValue={defaultName} required className={input} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-400">Teléfono (opcional)</span>
        <input name="phone" type="tel" inputMode="tel" placeholder="300 123 4567" className={input} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-400">Peso corporal (kg)</span>
        <input
          name="body_weight_kg"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={30}
          max={300}
          required
          placeholder="75.5"
          className={`${input} text-3xl font-bold`}
        />
        <span className="mt-2 block text-xs text-zinc-500">
          ⚖️ Tu peso define tu puntaje (fuerza relativa). Un juez lo verificará en el gimnasio.
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-lime-400 py-4 text-lg font-black text-zinc-950 transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Entrar a la competencia"}
      </button>
    </form>
  );
}
