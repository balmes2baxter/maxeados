"use client";

import { useEffect, useState } from "react";
import { PixelIcon } from "./PixelIcon";

const PHRASES = [
  "Cargando las placas",
  "Una más... ¡una más!",
  "Hoy no se salta pierna",
  "Ajustando el cinturón",
  "Echándole tiza a las manos",
  "Respira, aprieta, empuja",
  "Sin dolor no hay gloria",
  "El que madruga, maxea",
  "Contando reps",
  "Calentando motores",
  "Ese peso no se va a levantar solo",
  "Llenando el shaker",
];

/** Barra con discos que sube y baja + frases de gym que van rotando. */
export function GymLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  // La primera frase es fija para que el HTML del servidor y el del cliente coincidan.
  const [i, setI] = useState(0);
  useEffect(() => {
    const start = Math.floor(Math.random() * PHRASES.length);
    let n = 0;
    const t = setInterval(() => setI((start + ++n) % PHRASES.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 ${fullScreen ? "min-h-dvh" : "min-h-[60dvh]"}`}
      role="status"
      aria-live="polite"
    >
      <div className="loader-lift">
        <PixelIcon name="dumbbell" size={64} />
      </div>
      <div className="h-1 w-24 bg-line" />
      <p key={i} className="font-pixel anim-rise px-6 text-center text-[10px] leading-relaxed text-bone">
        {PHRASES[i]}
        <span className="anim-blink">...</span>
      </p>
    </div>
  );
}
