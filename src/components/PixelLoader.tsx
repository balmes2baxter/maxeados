import { PixelIcon } from "./PixelIcon";

export function PixelLoader({ label = "Cargando el gym" }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <PixelIcon name="dumbbell" size={56} className="anim-float" />
      <p className="font-pixel text-[10px] text-neon">
        {label}
        <span className="anim-blink">...</span>
      </p>
    </div>
  );
}
