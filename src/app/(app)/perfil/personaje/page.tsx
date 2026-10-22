import { Suspense } from "react";
import Loading from "../../loading";
import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { parseAvatar } from "@/lib/avatar";
import { getShop } from "@/lib/data";
import { PixelIcon } from "@/components/PixelIcon";
import { AvatarEditor } from "./AvatarEditor";

async function PersonajePageContent() {
  const user = await requireAthlete();
  const shop = await getShop(user.id);
  return (
    <div className="flex flex-col gap-3">
      <Link href="/perfil" className="flex items-center gap-2 text-xl text-muted">
        <PixelIcon name="back" size={14} /> Perfil
      </Link>
      <h1 className="font-pixel text-shadow-px text-sm text-neon">VESTIDOR</h1>
      <AvatarEditor initial={parseAvatar(user.avatar)} locked={shop.locked} />
    </div>
  );
}

// La sesión se lee dentro de un <Suspense>: la navegación muestra el esqueleto al instante.
export default function PersonajePage() {
  return (
    <Suspense fallback={<Loading />}>
      <PersonajePageContent />
    </Suspense>
  );
}
