"use client";

import { useEffect, useMemo, useState } from "react";
import { PixelAvatar } from "@/components/PixelAvatar";
import { confetti, sfx } from "@/components/fx";
import { DEFAULT_AVATAR, randomAvatar, seededRandom, type Avatar } from "@/lib/avatar";

// Línea de tiempo de la intro (ms desde que arranca)
const TIMELINE = [
  { at: 500, phase: 1 }, // aparece la arena
  { at: 1600, phase: 2 }, // el campeón empieza a sentadillar
  { at: 5200, phase: 3 }, // ¡lo logra!
  { at: 7400, phase: 4 }, // ES TU TURNO
  { at: 8800, phase: 5 }, // ¿Competirías…?
  { at: 10600, phase: 6 }, // ¿Por solo entrenar?
  { at: 12000, phase: 7 }, // Demuestra quién manda + botón
] as const;

const CHAMPION: Avatar = {
  ...DEFAULT_AVATAR,
  build: "mamado",
  skin: 3,
  expression: "apretando",
  hair: "rapado",
  hairColor: 0,
  facial: "candado",
  top: "esqueleto",
  topColor: 8,
  bottom: "shorts",
  bottomColor: 7,
  shoeColor: 6,
  headgear: "bandana",
  gearColor: 1,
  belt: true,
  wristbands: true,
};

function Barbell({ up }: { up: boolean }) {
  const plates = (side: "l" | "r") => (
    <div className={`flex items-center ${side === "l" ? "flex-row" : "flex-row-reverse"}`}>
      <span className="h-16 w-3 bg-[#2b2b38] shadow-[0_0_0_2px_#140c1c]" />
      <span className="h-20 w-4 bg-gold shadow-[0_0_0_2px_#140c1c]" />
      <span className="h-20 w-4 bg-gold shadow-[0_0_0_2px_#140c1c]" />
      <span className="h-14 w-3 bg-[#e6b800] shadow-[0_0_0_2px_#140c1c]" />
    </div>
  );
  return (
    <div className={`intro-bar absolute left-1/2 top-[39%] flex w-[300px] -translate-x-1/2 items-center ${up ? "is-up" : ""}`}>
      {plates("l")}
      <span className="h-2 flex-1 bg-[#c8ccd6] shadow-[0_0_0_2px_#140c1c]" />
      {plates("r")}
    </div>
  );
}

export function Intro({ prize, onDone }: { prize: string; onDone: () => void }) {
  const [phase, setPhase] = useState(1); // Arranca directamente visible para evitar pantalla negra en móvil
  const crowd = useMemo(() => Array.from({ length: 14 }, (_, i) => randomAvatar(seededRandom(i * 104729 + 11))), []);

  useEffect(() => {
    const timers = TIMELINE.map(({ at, phase: p }) =>
      setTimeout(() => {
        setPhase(p);
        if (p === 3) {
          confetti(140);
          sfx("levelup");
        }
        if (p === 4) sfx("coin");
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const won = phase >= 3;
  const talking = phase >= 4;

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-black">
      {/* Arena */}
      <div className={`absolute inset-0 transition-opacity duration-[1400ms] ${phase >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, #3b2d52 0%, #1a1226 45%, #000 80%)" }} />
        <div className={`intro-spot absolute left-1/2 top-0 h-[75%] w-[340px] -translate-x-1/2 ${won ? "is-won" : ""}`} />
        <p className="font-pixel absolute inset-x-0 top-[max(16px,env(safe-area-inset-top))] mt-12 text-center text-[11px] text-gold">★ TORNEO MAXEADOS ★</p>

        {/* Campeón */}
        <div className={`absolute inset-x-0 top-[20%] flex flex-col items-center transition-all duration-700 ${talking ? "-translate-y-6 scale-90 opacity-40" : ""}`}>
          <span className={`px-chip mb-2 ${won ? "anim-pop" : ""}`} style={{ ["--chip" as string]: won ? "var(--color-gold)" : "var(--color-panel-2)", ["--chip-fg" as string]: won ? "var(--color-ink)" : "var(--color-bone)" }}>
            300 KG
          </span>
          <div className={`relative ${phase === 2 ? "intro-squat" : ""}`}>
            <PixelAvatar avatar={CHAMPION} size={190} pose={won ? "flex" : "idle"} animate={false} />
            <Barbell up={won} />
          </div>
          <div className="-mt-1 h-3 w-56 bg-line shadow-[0_4px_0_#140c1c]" />
          {won && !talking && (
            <p className="font-pixel anim-pop text-shadow-px mt-4 text-[26px] text-neon" style={{ ["--glow" as string]: "#39ff14" }}>
              ¡MAXEADO!
            </p>
          )}
        </div>

        {/* Público */}
        <div className="absolute inset-x-0 bottom-0 h-[32%]">
          <div className="absolute inset-x-0 bottom-[34%] flex justify-center gap-1 opacity-60">
            {crowd.slice(7).map((a, i) => (
              <div key={i} className={won ? "crowd-go" : "crowd-cheer"} style={{ animationDelay: `${(i * 137) % 600}ms` }}>
                <PixelAvatar avatar={a} size={62} animate={false} shadow={false} />
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black via-black/70 to-transparent pt-4">
            {crowd.slice(0, 7).map((a, i) => (
              <div key={i} className={won ? "crowd-go" : "crowd-cheer"} style={{ animationDelay: `${(i * 211) % 700}ms` }}>
                <PixelAvatar avatar={a} size={78} pose={won && i % 2 ? "flex" : "idle"} animate={false} shadow={false} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Destello al ganar */}
      {phase === 3 && <div className="intro-flash pointer-events-none absolute inset-0 bg-white" />}

      {/* El mensaje */}
      {talking && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black/60 px-6 text-center">
          <p className="font-pixel anim-pop text-shadow-px text-[28px] leading-tight text-neon">ES TU TURNO</p>
          {phase >= 5 && (
            <p className="anim-rise text-3xl leading-tight">
              ¿Competirías en la tabla del gym por <span className="font-pixel text-xl text-gold">{prize}</span>?
            </p>
          )}
          {phase >= 6 && <p className="anim-rise text-3xl leading-tight text-muted">¿Por solo entrenar?</p>}
          {phase >= 7 && (
            <>
              <p className="font-pixel anim-pop text-[18px] leading-tight text-gold">DEMUESTRA QUIÉN MANDA</p>
              <button className="px-btn anim-rise mt-2 w-full max-w-xs" onClick={() => { sfx("select"); onDone(); }}>
                ¡Vamos!
              </button>
            </>
          )}
        </div>
      )}

      {phase < 7 && (
        <button
          className="font-pixel absolute right-3 top-[max(12px,env(safe-area-inset-top))] mt-2 z-50 rounded border border-gold/40 bg-night/90 px-3 py-1.5 text-[10px] text-gold shadow-lg active:scale-95 cursor-pointer"
          onClick={() => {
            sfx("select");
            onDone();
          }}
        >
          Saltar intro ▸▸
        </button>
      )}
    </div>
  );
}
