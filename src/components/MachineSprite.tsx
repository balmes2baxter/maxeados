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
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} shapeRendering="crispEdges" className={className} aria-hidden>
      {px.map((p) => {
        const on = p.plate !== undefined && (charge || p.plate < lit);
        return (
          <rect
            key={`${p.x}-${p.y}`}
            x={p.x}
            y={p.y}
            width={1}
            height={1}
            fill={on ? "#ffd700" : p.c}
            className={on && charge ? "px-plate" : undefined}
            style={on && charge ? { animationDelay: `${(p.plate ?? 0) * 0.12}s` } : undefined}
          />
        );
      })}
    </svg>
  );
}
