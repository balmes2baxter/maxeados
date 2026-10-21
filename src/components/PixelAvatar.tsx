import { AVATAR_H, AVATAR_W, parseAvatar, renderAvatar, toRuns, type Pose } from "@/lib/avatar";

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
  const runs = toRuns(renderAvatar(parseAvatar(avatar), pose));
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
        {runs.map((r) =>
          r.eye ? (
            <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} className={animate ? "px-eye" : undefined} />
          ) : (
            <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
          ),
        )}
      </svg>
    </div>
  );
}
