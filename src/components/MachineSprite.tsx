import { machinePixels } from "@/lib/machineSprite";

/** `lit` = placas encendidas (0–6); con `charge` se llenan en cascada. */
export function MachineSprite({
  slug,
  size = 64,
  accent,
  lit = 0,
  charge = false,
  className = "",
}: {
  slug: string;
  size?: number;
  accent?: string;
  lit?: number;
  charge?: boolean;
  className?: string;
}) {
  const px = machinePixels(slug, accent);
  // Un <path> por color; solo las placas animadas (charge) necesitan su propio <rect>.
  const fills = new Map<string, string>();
  const animated: { x: number; y: number; plate: number }[] = [];
  for (const p of px) {
    const on = p.plate !== undefined && (charge || p.plate < lit);
    if (on && charge) {
      animated.push({ x: p.x, y: p.y, plate: p.plate ?? 0 });
      continue;
    }
    const c = on ? "#ffd700" : p.c;
    fills.set(c, (fills.get(c) ?? "") + `M${p.x} ${p.y}h1v1h-1z`);
  }
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} shapeRendering="crispEdges" className={className} aria-hidden>
      {[...fills].map(([c, d]) => (
        <path key={c} d={d} fill={c} />
      ))}
      {animated.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          fill="#ffd700"
          className="px-plate"
          style={{ animationDelay: `${p.plate * 0.12}s` }}
        />
      ))}
    </svg>
  );
}
