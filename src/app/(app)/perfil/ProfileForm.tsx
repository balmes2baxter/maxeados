"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/game";

export function ProfileForm({ fullName, phone, bodyWeightKg }: { fullName: string; phone: string; bodyWeightKg: number }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  return (
    <details className="px-box p-4">
      <summary className="font-pixel cursor-pointer text-[11px] text-neon">▶ DATOS DEL ATLETA</summary>
      <form action={action} className="mt-3 flex flex-col gap-1">
        <label className="px-label" htmlFor="p-name">Nombre</label>
        <input id="p-name" name="fullName" className="px-input" defaultValue={fullName} required />
        <label className="px-label mt-2" htmlFor="p-phone">Teléfono</label>
        <input id="p-phone" name="phone" className="px-input" defaultValue={phone} inputMode="tel" />
        <label className="px-label mt-2" htmlFor="p-weight">Peso corporal (kg)</label>
        <input id="p-weight" name="bodyWeightKg" type="number" step="0.1" min={30} max={250} className="px-input" defaultValue={bodyWeightKg} required />
        <p className="text-base text-muted">Si cambias tu peso, pierde la verificación y se recalculan tus puntajes.</p>
        {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
        <button className="px-btn mt-2" disabled={pending}>{pending ? "Guardando..." : "Guardar"}</button>
      </form>
    </details>
  );
}
