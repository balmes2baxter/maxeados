"use client";

import { useActionState } from "react";
import { createSeason } from "@/actions/game";

export function SeasonForm() {
  const [state, action, pending] = useActionState(createSeason, undefined);
  const today = new Date();
  const end = new Date(today.getTime() + 29 * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return (
    <form action={action} className="flex flex-col gap-1">
      <label className="px-label" htmlFor="s-title">Título</label>
      <input id="s-title" name="title" className="px-input" defaultValue={`Temporada ${today.toLocaleDateString("es-CO", { month: "long", year: "numeric" })}`} required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="px-label" htmlFor="s-start">Inicio</label>
          <input id="s-start" name="startDate" type="date" className="px-input !text-lg" defaultValue={iso(today)} required />
        </div>
        <div>
          <label className="px-label" htmlFor="s-end">Fin</label>
          <input id="s-end" name="endDate" type="date" className="px-input !text-lg" defaultValue={iso(end)} required />
        </div>
      </div>
      <label className="px-label" htmlFor="s-prize">Pozo (COP)</label>
      <input id="s-prize" name="prizeAmountCop" type="number" min={0} step={1000} className="px-input" defaultValue={100000} required />
      <p className="text-base text-muted">Crear una temporada cierra la actual. El ranking arranca de cero.</p>
      {state?.error && <p className="anim-shake text-xl text-danger">⚠ {state.error}</p>}
      <button className="px-btn mt-2" disabled={pending}>{pending ? "Creando..." : "Abrir temporada"}</button>
    </form>
  );
}
