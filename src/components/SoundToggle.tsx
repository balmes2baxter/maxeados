"use client";

import { useSyncExternalStore } from "react";
import { PixelIcon } from "./PixelIcon";
import { isMuted, setMuted, sfx } from "./fx";

const subscribe = (cb: () => void) => {
  window.addEventListener("px:mute", cb);
  return () => window.removeEventListener("px:mute", cb);
};

export function SoundToggle() {
  const muted = useSyncExternalStore(subscribe, isMuted, () => true);
  return (
    <button
      type="button"
      onClick={() => {
        setMuted(!muted);
        window.dispatchEvent(new Event("px:mute"));
        if (muted) setTimeout(() => sfx("coin"), 0);
      }}
      aria-label={muted ? "Activar sonido" : "Silenciar"}
      className="lift-hover"
    >
      <PixelIcon name={muted ? "mute" : "sound"} size={18} />
    </button>
  );
}
