import { DEFAULT_AVATAR, type Avatar } from "@/lib/avatar";

// Un artículo de la tienda es una opción del personaje: "<campo>:<valor>", p. ej. "headgear:corona".
export type ShopItem = { id: string; name: string; price: number };

export const itemId = (field: string, value: string) => `${field}:${value}`;

export function splitItem(id: string): { field: keyof Avatar; value: string } {
  const [field, value] = id.split(":");
  return { field: field as keyof Avatar, value };
}

/** Quita del personaje lo premium que el atleta no ha comprado. */
export function stripLocked(avatar: Avatar, locked: Iterable<string>): Avatar {
  const out = { ...avatar } as Record<string, unknown>;
  for (const id of locked) {
    const { field, value } = splitItem(id);
    if (out[field] === value) out[field] = DEFAULT_AVATAR[field];
  }
  return out as Avatar;
}

/** El personaje puesto con un artículo (para la vista previa de la tienda). */
export function wearing(avatar: Avatar, id: string): Avatar {
  const { field, value } = splitItem(id);
  return { ...avatar, [field]: value };
}
