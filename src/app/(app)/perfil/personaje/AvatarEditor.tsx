"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveAvatar } from "@/actions/game";
import { CharacterCreator } from "@/components/CharacterCreator";
import type { Avatar } from "@/lib/avatar";

function SaveButton() {
  const { pending } = useFormStatus();
  return <button className="px-btn w-full" disabled={pending}>{pending ? "Guardando..." : "Guardar personaje"}</button>;
}

export function AvatarEditor({ initial, locked }: { initial: Avatar; locked: { id: string; price: number }[] }) {
  const [avatar, setAvatar] = useState(initial);
  return (
    <form action={saveAvatar} className="flex flex-col gap-3">
      <input type="hidden" name="avatar" value={JSON.stringify(avatar)} />
      <CharacterCreator value={avatar} onChange={setAvatar} locked={locked} />
      <SaveButton />
    </form>
  );
}
