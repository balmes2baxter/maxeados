"use client";

import { useEffect, useState } from "react";
import { PixelIcon } from "./PixelIcon";
import type { ToastInput } from "./fx";

type Item = ToastInput & { id: number; leaving?: boolean };

const TONES: Record<string, string> = {
  neon: "var(--color-neon)",
  gold: "var(--color-gold)",
  pink: "var(--color-pink)",
  cyan: "var(--color-cyan)",
  danger: "var(--color-danger)",
};

export function Toaster() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<ToastInput>).detail;
      const id = ++n;
      setItems((xs) => [...xs.slice(-2), { ...t, id }]);
      setTimeout(() => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, leaving: true } : x))), 3600);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4000);
    };
    window.addEventListener("px:toast", onToast);
    return () => window.removeEventListener("px:toast", onToast);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[96] flex flex-col items-center gap-3 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          className="px-box px-box-accent flex w-full max-w-sm items-center gap-3 p-3"
          style={{
            ["--accent" as string]: TONES[t.tone ?? "neon"],
            transition: "transform 300ms ease, opacity 300ms ease",
            transform: t.leaving ? "translateY(-20px)" : undefined,
            opacity: t.leaving ? 0 : 1,
            animation: "pop 420ms cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <PixelIcon name={t.icon ?? "star"} size={28} />
          <div>
            <p className="font-pixel text-[10px]" style={{ color: TONES[t.tone ?? "neon"] }}>{t.title}</p>
            {t.body && <p className="text-lg leading-tight">{t.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
