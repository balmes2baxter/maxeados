"use client";

import { useEffect, useSyncExternalStore } from "react";
import { PixelIcon } from "./PixelIcon";
import { isMuted, setMuted, sfx } from "./fx";
import { startBgm, stopBgm } from "@/lib/bgm";

const subscribe = (cb: () => void) => {
  window.addEventListener("px:mute", cb);
  return () => window.removeEventListener("px:mute", cb);
};

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribe, isMuted, () => true);

  useEffect(() => {
    if (!muted) {
      // Iniciar suavemente al primer toque de pantalla si el sonido está activo
      const onFirstTouch = () => {
        if (!isMuted()) startBgm();
        window.removeEventListener("pointerdown", onFirstTouch);
      };
      window.addEventListener("pointerdown", onFirstTouch, { once: true });
      return () => window.removeEventListener("pointerdown", onFirstTouch);
    } else {
      stopBgm();
    }
  }, [muted]);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        window.dispatchEvent(new Event("px:mute"));
        if (!next) {
          setTimeout(() => sfx("coin"), 0);
          startBgm();
        } else {
          stopBgm();
        }
      }}
      aria-label={muted ? "Activar sonido y música" : "Silenciar"}
      className="lift-hover"
      title={muted ? "Activar música y efectos" : "Silenciar"}
    >
      <PixelIcon name={muted ? "mute" : "sound"} size={18} />
    </button>
  );
}
