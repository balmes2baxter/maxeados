"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PixelIcon } from "./PixelIcon";
import { sfx } from "./fx";

export function BottomNav({ isJudge, pending }: { isJudge: boolean; pending: number }) {
  const path = usePathname();
  const items = [
    { href: "/", label: "Gym", icon: "home" },
    { href: "/maquinas", label: "Máquinas", icon: "dumbbell", badge: pending },
    { href: "/ranking", label: "Ranking", icon: "trophy" },
    { href: "/perfil", label: "Perfil", icon: "user" },
    ...(isJudge ? [{ href: "/juez", label: "Juez", icon: "gavel" }] : []),
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="px-box flex justify-around px-1 py-1">
        {items.map((it) => {
          const active = path === it.href || path.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => sfx("blip")}
              className="relative flex flex-1 flex-col items-center gap-1 py-2 transition-all duration-200"
              style={{ background: active ? "var(--color-panel-2)" : undefined }}
              aria-current={active ? "page" : undefined}
            >
              <span className={`transition-transform duration-200 ${active ? "-translate-y-1 scale-110" : ""}`}>
                <PixelIcon name={it.icon} size={22} />
              </span>
              <span className={`font-pixel text-[7px] ${active ? "text-neon" : "text-muted"}`}>{it.label}</span>
              {!!it.badge && (
                <span className="absolute right-2 top-0 font-pixel bg-pink px-1 text-[8px] text-ink">{it.badge}</span>
              )}
              {active && <span className="absolute bottom-0 h-1 w-6 bg-neon" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
