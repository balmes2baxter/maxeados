// Sprites 16×16 de las 6 máquinas del circuito, dibujados por capas.
export const MACHINE_SLUGS = ["leg-press", "leg-extension", "leg-curl", "lat-pulldown", "seated-row", "chest-press"];

export type MachinePixel = { x: number; y: number; c: string; plate?: number };

const K = "#140c1c";
const METAL = "#b8b8cc";
const METAL_D = "#6e6e85";
const PLATE = "#4a4a5e";
const PAD = "#e63946";
const PAD_D = "#a01d2a";

export function machinePixels(slug: string, accent = "#39ff14"): MachinePixel[] {
  const W = 18, H = 18;
  const grid: ({ c: string; plate?: number } | null)[][] = Array.from({ length: H }, () => Array(W).fill(null));
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string, plate?: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const gx = x + 1, gy = y + 1;
      if (gx >= 0 && gx < W && gy >= 0 && gy < H) grid[gy][gx] = { c, plate };
    }
  };

  // Torre con pila de placas (común a todas)
  rect(0, 1, 0, 15, METAL_D);
  rect(4, 1, 4, 15, METAL_D);
  rect(0, 0, 4, 0, METAL);
  for (let i = 0; i < 6; i++) rect(1, 14 - i * 2, 3, 14 - i * 2, PLATE, i);
  rect(2, 1, 2, 3, METAL); // cable
  rect(0, 15, 15, 15, METAL_D); // base

  switch (slug) {
    case "leg-press": // trineo inclinado
      for (let i = 0; i < 7; i++) rect(6 + i, 14 - i, 7 + i, 14 - i, METAL);
      rect(11, 4, 14, 7, accent); rect(11, 7, 14, 7, METAL_D);
      rect(6, 12, 9, 13, PAD); rect(6, 13, 9, 13, PAD_D);
      break;
    case "leg-extension": // asiento con rodillo frontal
      rect(7, 6, 8, 12, PAD); rect(7, 11, 12, 12, PAD); rect(8, 12, 12, 12, PAD_D);
      rect(9, 13, 9, 14, METAL);
      rect(12, 13, 14, 14, accent);
      break;
    case "leg-curl": // banco acostado con rodillo trasero
      rect(6, 10, 13, 11, PAD); rect(6, 11, 13, 11, PAD_D);
      rect(7, 12, 7, 14, METAL); rect(12, 12, 12, 14, METAL);
      rect(13, 7, 14, 9, accent); rect(14, 10, 14, 10, METAL);
      break;
    case "lat-pulldown": // barra arriba con cable
      rect(5, 0, 12, 0, METAL); rect(12, 0, 12, 3, METAL);
      rect(9, 4, 15, 4, accent); rect(9, 3, 9, 3, METAL_D); rect(15, 3, 15, 3, METAL_D);
      rect(10, 9, 13, 10, PAD); rect(11, 11, 11, 14, METAL); rect(9, 7, 14, 7, PAD_D);
      break;
    case "seated-row": // asiento bajo con cable horizontal
      rect(5, 9, 10, 9, METAL); rect(5, 9, 5, 9, accent);
      rect(10, 8, 11, 10, accent);
      rect(12, 11, 15, 12, PAD); rect(12, 12, 15, 12, PAD_D); rect(13, 13, 13, 14, METAL);
      rect(9, 13, 10, 14, METAL_D);
      break;
    case "chest-press": // respaldo y manijas al frente
      rect(13, 4, 14, 12, PAD); rect(14, 4, 14, 12, PAD_D);
      rect(10, 11, 14, 12, PAD);
      rect(6, 7, 12, 7, METAL); rect(6, 6, 7, 8, accent);
      rect(12, 13, 12, 14, METAL);
      break;
  }

  const out: MachinePixel[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = grid[y][x];
    if (p) out.push({ x, y, ...p });
    else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx])) out.push({ x, y, c: K });
  }
  return out;
}
