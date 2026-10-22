import { Suspense } from "react";
import Link from "next/link";
import Loading from "../loading";
import { requireAthlete } from "@/lib/session";
import { getShop } from "@/lib/data";
import { parseAvatar } from "@/lib/avatar";
import { wearing } from "@/lib/shop";
import { buyItem } from "@/actions/game";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";

async function TiendaContent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await requireAthlete();
  const shop = await getShop(user.id);
  const me = parseAvatar(user.avatar);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-shadow-px text-sm text-neon">TIENDA</h1>
        <span className="px-box flex items-center gap-2 px-3 py-1">
          <PixelIcon name="coin" size={20} className="anim-spin-coin" />
          <span className="font-pixel text-sm text-gold">{shop.balance}</span>
        </span>
      </div>
      <p className="-mt-1 text-lg text-muted">Cada intento suma fichas. Los aprobados, más.</p>
      {error && <p className="anim-shake px-box p-2 text-xl text-danger">⚠ {error}</p>}

      <ul className="stagger grid grid-cols-2 gap-1">
        {shop.items.map((it) => {
          const canBuy = !it.owned && shop.balance >= it.price;
          return (
            <li key={it.id} className={`px-box flex flex-col items-center gap-1 p-3 ${it.owned ? "px-box-accent" : ""}`}>
              <PixelAvatar avatar={wearing(me, it.id)} size={110} pose="idle" animate={it.owned} />
              <p className="font-pixel text-[9px] text-bone">{it.name}</p>
              {it.owned ? (
                <Link href="/perfil/personaje" className="px-btn px-btn-sm px-btn-ghost w-full">Ponérmelo</Link>
              ) : (
                <form action={buyItem} className="w-full">
                  <input type="hidden" name="item" value={it.id} />
                  <button className={`px-btn px-btn-sm w-full ${canBuy ? "" : "px-btn-ghost"}`} disabled={!canBuy}>
                    <PixelIcon name="coin" size={14} /> {it.price}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Tienda(props: { searchParams: Promise<{ error?: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <TiendaContent {...props} />
    </Suspense>
  );
}
