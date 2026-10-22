import Link from "next/link";
import { Suspense } from "react";
import { requireAthlete } from "@/lib/session";
import { daysLeft, formatCop, getPlayerState } from "@/lib/data";
import { PixelIcon } from "@/components/PixelIcon";
import { BottomNav } from "@/components/BottomNav";
import { FxListener, ProgressWatcher } from "@/components/FxListener";
import { SoundToggle } from "@/components/SoundToggle";

// El marco (cabecera y barra de abajo) se pinta al instante; lo que depende de la
// sesión llega por streaming dentro de cada <Suspense>, y la página usa loading.tsx.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-40 bg-night/95 px-3 pb-2 pt-3 backdrop-blur-sm">
        <Suspense fallback={<div className="px-box skeleton h-[52px]" />}>
          <PlayerHeader />
        </Suspense>
      </header>

      <main className="flex-1 px-3 pb-28 pt-2">{children}</main>

      <Suspense fallback={<BottomNav isJudge={false} pending={0} />}>
        <PlayerNav />
      </Suspense>
      <Suspense>
        <FxListener />
      </Suspense>
    </div>
  );
}

/** Lo único que importa siempre a la vista: el premio, el tiempo y tu puesto. */
async function PlayerHeader() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const unlocked = st.badges.filter((b) => b.unlocked).map((b) => b.id);
  return (
    <>
      <div className="px-box flex items-center gap-3 px-3 py-2">
        <PixelIcon name="trophy" size={26} className="shrink-0" />
        <div className="min-w-0 flex-1 leading-none">
          <p className="font-pixel text-[13px] text-gold">{st.season ? formatCop(st.season.prize_amount_cop) : "—"}</p>
          {st.season && <p className="px-label mt-1">{daysLeft(st.season)} días</p>}
        </div>
        <Link href="/ranking" className="text-right leading-none">
          <p className="font-pixel text-[13px] text-bone">{st.me ? `#${st.me.rank}` : "—"}</p>
          <p className="px-label mt-1">puesto</p>
        </Link>
        <SoundToggle />
      </div>
      <ProgressWatcher userId={user.id} level={st.level.level} badges={unlocked} avatar={user.avatar} />
    </>
  );
}

async function PlayerNav() {
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  return <BottomNav isJudge={user.role === "ADMIN"} pending={st.pending} />;
}
