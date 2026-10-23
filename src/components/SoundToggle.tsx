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
  const muted = useSyncExternalStore(subscribe, isMuted, () => false);

  useEffect(() => {
    if (!muted) {
      startBgm();
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
          startBgm();
          setTimeout(() => sfx("coin"), 40);
        } else {
          stopBgm();
        }
      }}
      aria-label={muted ? "Activar sonido y música" : "Silenciar"}
      className="lift-hover inline-flex items-center justify-center p-1.5 rounded hover:bg-neutral-800 transition-colors"
      title={muted ? "Activar música (Fallen Down) y efectos" : "Silenciar música y efectos"}
    >
      <PixelIcon name={muted ? "mute" : "sound"} size={18} />
    </button>
  );
}
