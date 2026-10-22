import { AVATAR_H, AVATAR_W, parseAvatar, renderAvatar, toRuns, type Pose } from "@/lib/avatar";

/** Un <path> por color (en vez de un <rect> por píxel): el SVG pesa una fracción y renderiza mucho más rápido. */
function toPaths(avatar: unknown, pose: Pose) {
  const body = new Map<string, string>();
  const eyes = new Map<string, string>(); // aparte, para que parpadeen
  for (const r of toRuns(renderAvatar(parseAvatar(avatar), pose))) {
    const target = r.eye ? eyes : body;
    target.set(r.c, (target.get(r.c) ?? "") + `M${r.x} ${r.y}h${r.w}v1h-${r.w}z`);
  }
  return { body: [...body], eyes: [...eyes] };
}

export function PixelAvatar({
  avatar,
  size = 120,
  pose = "idle",
  animate = true,
  shadow = true,
  className = "",
}: {
  avatar: unknown;
  size?: number;
  pose?: Pose;
  animate?: boolean;
  shadow?: boolean;
  className?: string;
}) {
  const { body, eyes } = toPaths(avatar, pose);
  const width = Math.round((size * AVATAR_W) / AVATAR_H);
  return (
    <div className={`relative inline-block ${className}`} style={{ width, height: size }}>
      {shadow && <div className="px-shadow" />}
      <svg
        viewBox={`0 0 ${AVATAR_W} ${AVATAR_H}`}
        width={width}
        height={size}
        shapeRendering="crispEdges"
        className={`relative ${animate ? (pose === "flex" ? "px-flex" : "px-bob") : ""}`}
        aria-hidden
      >
        {body.map(([c, d]) => (
          <path key={c} d={d} fill={c} />
        ))}
        {eyes.length > 0 && (
          <g className={animate ? "px-eye" : undefined}>
            {eyes.map(([c, d]) => (
              <path key={c} d={d} fill={c} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
