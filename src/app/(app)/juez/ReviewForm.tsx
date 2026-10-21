"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reviewSubmission } from "@/actions/game";
import { sfx } from "@/components/fx";

const QUICK = ["Rango incompleto", "Rebote de placas", "No se ve la pila completa", "No es el peso tope", "Pausa / trampa en la rep", "Conteo de reps no coincide"];

function Buttons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex">
      <button name="decision" value="REJECTED" className="px-btn px-btn-danger flex-1" disabled={pending} onClick={() => sfx("blip")}>
        ✕ Rechazar
      </button>
      <button name="decision" value="APPROVED" className="px-btn flex-1" disabled={pending} onClick={() => sfx("blip")}>
        ✔ Aprobar
      </button>
    </div>
  );
}

export function ReviewForm({ id }: { id: string }) {
  const [notes, setNotes] = useState("");
  return (
    <form action={reviewSubmission} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            className={`px-chip cursor-pointer transition-colors ${notes.includes(q) ? "!bg-pink !text-ink" : ""}`}
            onClick={() => {
              sfx("select");
              setNotes((n) => (n.includes(q) ? n.replace(q, "").replace(/^[\s,]+|[\s,]+$/g, "") : n ? `${n}, ${q}` : q));
            }}
          >
            {q}
          </button>
        ))}
      </div>
      <textarea
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        maxLength={500}
        className="px-input resize-none !text-xl"
        placeholder="Retroalimentación para el atleta (opcional)"
      />
      <Buttons />
    </form>
  );
}
