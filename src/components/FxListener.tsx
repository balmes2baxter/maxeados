"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { confetti, floater, sfx, toast } from "./fx";
import { PixelAvatar } from "./PixelAvatar";
import { PixelIcon } from "./PixelIcon";
import { levelTitle } from "@/lib/game";

const FX: Record<string, () => void> = {
  welcome: () => {
    confetti(90);
    sfx("levelup");
    toast({ title: "¡BIENVENIDO AL GYM!", body: "Tu personaje está listo. Ve por tu primer intento.", icon: "star", tone: "gold" });
  },
  submitted: () => {
    sfx("coin");
    floater("+10 XP", window.innerWidth / 2 - 40, window.innerHeight / 2);
    toast({ title: "INTENTO ENVIADO", body: "El juez revisará tu video. ¡Mucha fuerza!", icon: "hourglass", tone: "cyan" });
  },
  approved: () => {
    confetti(50);
    sfx("success");
    toast({ title: "APROBADO", body: "El intento ya suma al ranking.", icon: "check", tone: "neon" });
  },
  rejected: () => {
    sfx("error");
    toast({ title: "RECHAZADO", body: "Se envió la retroalimentación al atleta.", icon: "cross", tone: "danger" });
  },
  verified: () => {
    sfx("coin");
    toast({ title: "PESO VERIFICADO", body: "Se recalcularon sus puntajes.", icon: "scale", tone: "gold" });
  },
  saved: () => {
    sfx("select");
    toast({ title: "GUARDADO", icon: "check", tone: "neon" });
  },
  season: () => {
    confetti(60);
    sfx("levelup");
    toast({ title: "NUEVA TEMPORADA", body: "¡Que empiece la pelea por el pozo!", icon: "crown", tone: "gold" });
  },
};

/** Lee ?fx= tras una acción del servidor, dispara el efecto y limpia la URL. */
export function FxListener() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const fx = params.get("fx");
  useEffect(() => {
    if (!fx) return;
    FX[fx]?.();
    const next = new URLSearchParams(params);
    next.delete("fx");
    const qs = next.toString();
    router.replace(qs ? `${path}?${qs}` : path, { scroll: false });
  }, [fx, params, path, router]);
  return null;
}

const BADGE_NAMES: Record<string, string> = {
  first: "Primer intento",
  approved: "¡Válido!",
  verified: "Pesaje oficial",
  cap: "Tope 15",
  legs: "Piernas de acero",
  back: "Espalda de titán",
  circuit: "Circuito completo",
  streak: "En llamas",
  grind: "Constancia",
  podium: "Podio",
};

/** Detecta subidas de nivel y logros nuevos comparando con lo último visto en este navegador. */
export function ProgressWatcher({
  userId,
  level,
  badges,
  avatar,
}: {
  userId: string;
  level: number;
  badges: string[];
  avatar: unknown;
}) {
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const badgeKey = badges.join(",");

  useEffect(() => {
    const key = `maxeados:seen:${userId}`;
    let seen: { level: number; badges: string[] } | null = null;
    try {
      seen = JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {}
    const current = badgeKey ? badgeKey.split(",") : [];
    if (seen) {
      if (level > seen.level) {
        setTimeout(() => {
          setLevelUp(level);
          confetti(110);
          sfx("levelup");
        }, 0);
      }
      const fresh = current.filter((b) => !seen!.badges.includes(b));
      fresh.forEach((b, i) =>
        setTimeout(() => {
          sfx("coin");
          toast({ title: "¡LOGRO DESBLOQUEADO!", body: BADGE_NAMES[b] ?? b, icon: "star", tone: "pink" });
        }, 900 + i * 1200),
      );
    }
    try {
      localStorage.setItem(key, JSON.stringify({ level, badges: current }));
    } catch {}
  }, [userId, level, badgeKey]);

  if (levelUp === null) return null;
  return (
    <div
      className="fixed inset-0 z-[97] flex items-center justify-center bg-ink/80 p-6"
      onClick={() => setLevelUp(null)}
      style={{ animation: "rise 300ms ease both" }}
    >
      <div className="px-box px-box-accent anim-pop flex w-full max-w-xs flex-col items-center gap-3 p-6 text-center" style={{ ["--accent" as string]: "#ffd700" }}>
        <p className="font-pixel anim-glow text-xl text-gold">¡LEVEL UP!</p>
        <PixelAvatar avatar={avatar} size={170} pose="flex" />
        <p className="font-pixel text-3xl text-neon">NV {levelUp}</p>
        <p className="text-2xl text-muted">Ahora eres {levelTitle(levelUp)}</p>
        <button className="px-btn px-btn-gold mt-2" onClick={() => setLevelUp(null)}>
          <PixelIcon name="star" size={16} /> ¡Sigue así!
        </button>
      </div>
    </div>
  );
}
