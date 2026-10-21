import { PixelIcon } from "@/components/PixelIcon";

export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <PixelIcon name="dumbbell" size={44} className="anim-float" />
      <p className="font-pixel text-[9px] text-neon">
        Cargando<span className="anim-blink">...</span>
      </p>
    </div>
  );
}
