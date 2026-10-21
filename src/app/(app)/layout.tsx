import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireAthlete } from "@/lib/session";
import { getPlayerState } from "@/lib/data";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { BottomNav } from "@/components/BottomNav";
import { FxListener, ProgressWatcher } from "@/components/FxListener";
import { SoundToggle } from "@/components/SoundToggle";
import { PixelLoader } from "@/components/PixelLoader";

// Con cacheComponents la sesión se lee en la petición: el shell autenticado va dentro de un Suspense
// y cada página tiene su propio loading.tsx para las navegaciones entre pestañas.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PixelLoader />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

async function AppShell({ children }: { children: React.ReactNode }) {
  await connection();
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const unlocked = st.badges.filter((b) => b.unlocked).map((b) => b.id);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-40 bg-night/95 px-3 pb-2 pt-3 backdrop-blur-sm">
        <div className="px-box flex items-center gap-3 px-3 py-2">
          <Link href="/perfil" className="lift-hover -mb-2 -mt-3 shrink-0" aria-label="Mi perfil">
            <PixelAvatar avatar={user.avatar} size={52} shadow={false} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-chip" style={{ ["--chip" as string]: "#ffd700", ["--chip-fg" as string]: "#140c1c" }}>
                NV {st.level.level}
              </span>
              <span className="truncate text-xl leading-none">{user.full_name}</span>
            </div>
            <div className="px-bar !h-3" title={`${st.level.xp} XP`}>
              <span style={{ width: `${Math.round(st.level.progress * 100)}%`, ["--fill" as string]: "var(--color-gold)" }} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 font-pixel text-[10px] text-gold" title="Racha de días">
              <PixelIcon name="flame" size={16} /> {st.streak}
            </span>
            <SoundToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 px-3 pb-28 pt-2">{children}</main>

      <BottomNav isJudge={user.role === "ADMIN"} pending={st.pending} />
      <Suspense>
        <FxListener />
      </Suspense>
      <ProgressWatcher userId={user.id} level={st.level.level} badges={unlocked} avatar={user.avatar} />
    </div>
  );
}
