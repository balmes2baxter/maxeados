import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { formatCop, getPlayerState, shortName } from "@/lib/data";
import { tierFor } from "@/lib/game";
import { PixelAvatar } from "@/components/PixelAvatar";
import { PixelIcon } from "@/components/PixelIcon";
import { MachineSprite } from "@/components/MachineSprite";
import { AutoRefresh } from "@/components/AutoRefresh";

const PODIUM = [
  { place: 2, h: 56, color: "#c0c0c0" },
  { place: 1, h: 84, color: "#ffd700" },
  { place: 3, h: 40, color: "#cd7f32" },
];

export default async function Ranking({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const user = await requireAthlete();
  const st = await getPlayerState(user);
  const onlyEligible = ver === "clasificados";
  const list = onlyEligible ? st.board.filter((b) => b.eligible) : st.board;
  const top3 = list.slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh seconds={15} />
      <div className="flex items-center justify-between">
        <h1 className="font-pixel text-shadow-px text-sm text-gold">RANKING</h1>
        <span className="flex items-center gap-1 text-lg text-muted">
          <span className="anim-blink size-2 bg-danger" /> en vivo
        </span>
      </div>

      <div className="flex">
        <Link href="/ranking" className={`px-btn px-btn-sm flex-1 ${!onlyEligible ? "px-btn-cyan" : "px-btn-ghost"}`}>General</Link>
        <Link href="/ranking?ver=clasificados" className={`px-btn px-btn-sm flex-1 ${onlyEligible ? "px-btn-cyan" : "px-btn-ghost"}`}>Clasificados 6/6</Link>
      </div>

      {/* Podio */}
      {top3.length > 0 && (
        <section className="px-box relative overflow-hidden px-2 pb-0 pt-6">
          {st.season && (
            <p className="absolute left-0 right-0 top-2 text-center font-pixel text-[9px] text-gold">
              POZO {formatCop(st.season.prize_amount_cop)}
            </p>
          )}
          <div className="flex items-end justify-center gap-2">
            {PODIUM.map(({ place, h, color }) => {
              const a = top3[place - 1];
              if (!a) return <div key={place} className="w-24" />;
              return (
                <div key={place} className="anim-rise flex w-24 flex-col items-center" style={{ animationDelay: `${(3 - place) * 150}ms` }}>
                  {place === 1 && <PixelIcon name="crown" size={28} className="anim-float -mb-1" />}
                  <PixelAvatar avatar={a.user.avatar} size={place === 1 ? 104 : 84} pose={place === 1 ? "flex" : "idle"} />
                  <p className="mt-1 w-full truncate text-center text-lg leading-none">{shortName(a.user.fullName)}</p>
                  <p className="font-pixel text-[9px] text-gold">{a.total.toFixed(2)}</p>
                  <div
                    className="mt-1 flex w-full items-start justify-center pt-1 font-pixel text-lg text-ink"
                    style={{ height: h, background: color, boxShadow: "inset 0 4px 0 rgba(255,255,255,.4), inset -4px 0 0 rgba(0,0,0,.2)" }}
                  >
                    {place}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {list.length === 0 && <p className="px-box p-4 text-xl text-muted">Nadie en esta tabla todavía.</p>}

      {/* Tabla */}
      <ol className="stagger flex flex-col gap-2">
        {list.map((a, i) => {
          const me = a.userId === user.id;
          const tier = tierFor(a.total);
          return (
            <li key={a.userId}>
              <details className={`px-box group ${me ? "px-box-accent" : ""}`} style={me ? { ["--accent" as string]: "#39ff14" } : undefined}>
                <summary className="flex cursor-pointer list-none items-center gap-2 p-2">
                  <span className={`font-pixel w-7 text-center text-[11px] ${i < 3 ? "text-gold" : "text-muted"}`}>{i + 1}</span>
                  <PixelAvatar avatar={a.user.avatar} size={44} shadow={false} animate={me} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xl leading-none ${me ? "text-neon" : ""}`}>{a.user.fullName}{me && " (tú)"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="px-chip" style={{ ["--chip" as string]: tier.color, ["--chip-fg" as string]: "#140c1c" }}>{tier.name}</span>
                      <span className="text-base text-muted">{a.machinesDone}/6 · {a.bodyWeightKg} kg{a.user.weightVerified ? " ✔" : ""}</span>
                      {a.eligible && <PixelIcon name="check" size={14} title="Clasificado al pozo" />}
                    </div>
                  </div>
                  <span className="font-pixel text-sm text-gold">{a.total.toFixed(2)}</span>
                  <span className="text-muted transition-transform duration-300 group-open:rotate-90">▶</span>
                </summary>
                <div className="grid grid-cols-3 gap-1 border-t-4 border-ink p-2">
                  {st.machines.map((m) => {
                    const s = a.best[m.id];
                    return (
                      <div key={m.id} className="flex flex-col items-center bg-panel-2 p-1">
                        <MachineSprite slug={m.slug} size={32} lit={s !== undefined ? 6 : 0} />
                        <span className="text-base leading-none">{m.name.split(" ")[0]}</span>
                        <span className={`font-pixel text-[8px] ${s !== undefined ? "text-neon" : "text-muted"}`}>{s !== undefined ? s.toFixed(2) : "—"}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <p className="text-center text-lg text-muted">
        Empate → gana el de menor peso corporal oficial. Para el pozo se exigen las 6 máquinas aprobadas.
      </p>
    </div>
  );
}
