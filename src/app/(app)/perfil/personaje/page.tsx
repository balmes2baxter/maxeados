import Link from "next/link";
import { requireAthlete } from "@/lib/session";
import { parseAvatar } from "@/lib/avatar";
import { PixelIcon } from "@/components/PixelIcon";
import { AvatarEditor } from "./AvatarEditor";

export default async function PersonajePage() {
  const user = await requireAthlete();
  return (
    <div className="flex flex-col gap-3">
      <Link href="/perfil" className="flex items-center gap-2 text-xl text-muted">
        <PixelIcon name="back" size={14} /> Perfil
      </Link>
      <h1 className="font-pixel text-shadow-px text-sm text-pink">VESTIDOR</h1>
      <AvatarEditor initial={parseAvatar(user.avatar)} />
    </div>
  );
}
