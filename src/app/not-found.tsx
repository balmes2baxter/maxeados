import Link from "next/link";
import { PixelIcon } from "@/components/PixelIcon";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <PixelIcon name="cross" size={56} className="anim-float" />
      <p className="font-pixel text-shadow-px text-xl text-neon">404</p>
      <p className="text-2xl">Esta máquina no existe en el gym.</p>
      <Link href="/" className="px-btn">Volver al gym</Link>
    </main>
  );
}
