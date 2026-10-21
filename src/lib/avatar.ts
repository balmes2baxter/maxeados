// Motor del personaje pixel art. Compone capas sobre una rejilla de 20×26
// y devuelve los píxeles con contorno automático. Sin dependencias del DOM,
// así sirve igual en servidor y cliente.

export const AVATAR_W = 20;
export const AVATAR_H = 26;

export const SKIN_TONES = ["#ffdbb4", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"] as const;
export const HAIR_COLORS = ["#1b1b1b", "#4a2c17", "#8b5a2b", "#e6c35c", "#d9481f", "#f2f2f2", "#ff3ea5", "#39ff14"] as const;
export const CLOTH_COLORS = [
  "#39ff14", "#ffd700", "#ff3ea5", "#00e5ff", "#ff6b1a", "#9b5cff", "#f2f2f2", "#2b2b38", "#e63946", "#2a9d8f",
] as const;

export const BUILDS = { flaco: "Flaco", atletico: "Atlético", mamado: "Mamado" } as const;
export const HAIRS = {
  calvo: "Calvo", rapado: "Rapado", corto: "Corto", puntas: "Puntas", mohicano: "Mohicano",
  cola: "Cola", largo: "Largo", afro: "Afro",
} as const;
export const FACIAL = { ninguno: "Nada", bigote: "Bigote", barba: "Barba" } as const;
export const TOPS = {
  esqueleto: "Esqueleto", camiseta: "Camiseta", hoodie: "Hoodie", top: "Top deportivo", descubierto: "Sin camiseta",
} as const;
export const BOTTOMS = { shorts: "Shorts", joggers: "Joggers", licra: "Licra" } as const;
export const HEADGEAR = { ninguno: "Nada", bandana: "Bandana", gorra: "Gorra", audifonos: "Audífonos" } as const;
export const EXTRAS = { ninguno: "Nada", gafas: "Gafas", cadena: "Cadena" } as const;

export type Avatar = {
  build: keyof typeof BUILDS;
  skin: number;
  hair: keyof typeof HAIRS;
  hairColor: number;
  facial: keyof typeof FACIAL;
  top: keyof typeof TOPS;
  topColor: number;
  bottom: keyof typeof BOTTOMS;
  bottomColor: number;
  shoeColor: number;
  headgear: keyof typeof HEADGEAR;
  gearColor: number;
  extra: keyof typeof EXTRAS;
  belt: boolean;
  wristbands: boolean;
};

export const DEFAULT_AVATAR: Avatar = {
  build: "atletico",
  skin: 2,
  hair: "corto",
  hairColor: 0,
  facial: "ninguno",
  top: "esqueleto",
  topColor: 0,
  bottom: "shorts",
  bottomColor: 7,
  shoeColor: 6,
  headgear: "ninguno",
  gearColor: 2,
  extra: "ninguno",
  belt: false,
  wristbands: false,
};

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];

export function randomAvatar(): Avatar {
  return {
    build: pick(Object.keys(BUILDS) as Avatar["build"][]),
    skin: Math.floor(Math.random() * SKIN_TONES.length),
    hair: pick(Object.keys(HAIRS) as Avatar["hair"][]),
    hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
    facial: pick(["ninguno", "ninguno", "bigote", "barba"] as const),
    top: pick(Object.keys(TOPS) as Avatar["top"][]),
    topColor: Math.floor(Math.random() * CLOTH_COLORS.length),
    bottom: pick(Object.keys(BOTTOMS) as Avatar["bottom"][]),
    bottomColor: Math.floor(Math.random() * CLOTH_COLORS.length),
    shoeColor: Math.floor(Math.random() * CLOTH_COLORS.length),
    headgear: pick(["ninguno", "ninguno", "bandana", "gorra", "audifonos"] as const),
    gearColor: Math.floor(Math.random() * CLOTH_COLORS.length),
    extra: pick(["ninguno", "ninguno", "gafas", "cadena"] as const),
    belt: Math.random() < 0.4,
    wristbands: Math.random() < 0.4,
  };
}

/** Normaliza datos que vienen de la BD o del formulario. */
export function parseAvatar(input: unknown): Avatar {
  const a = (typeof input === "object" && input ? input : {}) as Partial<Record<keyof Avatar, unknown>>;
  const oneOf = <K extends string>(v: unknown, opts: Record<K, string>, d: K): K =>
    typeof v === "string" && v in opts ? (v as K) : d;
  const idx = (v: unknown, len: number, d: number) =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v < len ? v : d;
  const D = DEFAULT_AVATAR;
  return {
    build: oneOf(a.build, BUILDS, D.build),
    skin: idx(a.skin, SKIN_TONES.length, D.skin),
    hair: oneOf(a.hair, HAIRS, D.hair),
    hairColor: idx(a.hairColor, HAIR_COLORS.length, D.hairColor),
    facial: oneOf(a.facial, FACIAL, D.facial),
    top: oneOf(a.top, TOPS, D.top),
    topColor: idx(a.topColor, CLOTH_COLORS.length, D.topColor),
    bottom: oneOf(a.bottom, BOTTOMS, D.bottom),
    bottomColor: idx(a.bottomColor, CLOTH_COLORS.length, D.bottomColor),
    shoeColor: idx(a.shoeColor, CLOTH_COLORS.length, D.shoeColor),
    headgear: oneOf(a.headgear, HEADGEAR, D.headgear),
    gearColor: idx(a.gearColor, CLOTH_COLORS.length, D.gearColor),
    extra: oneOf(a.extra, EXTRAS, D.extra),
    belt: a.belt === true,
    wristbands: a.wristbands === true,
  };
}

export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export type Pose = "idle" | "flex";
export type Pixel = { x: number; y: number; c: string; eye?: boolean };

const OUTLINE = "#140c1c";
const OX = 2; // margen para el contorno y los brazos en pose de fuerza
const OY = 1;

export function renderAvatar(avatar: Avatar, pose: Pose = "idle"): Pixel[] {
  const grid: (string | null)[][] = Array.from({ length: AVATAR_H }, () => Array(AVATAR_W).fill(null));
  const eyes = new Set<string>();
  const put = (x: number, y: number, c: string) => {
    const gx = x + OX, gy = y + OY;
    if (gx >= 0 && gx < AVATAR_W && gy >= 0 && gy < AVATAR_H) grid[gy][gx] = c;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c);
  };

  const skin = SKIN_TONES[avatar.skin];
  const skinD = shade(skin, -0.18);
  const hair = HAIR_COLORS[avatar.hairColor];
  const hairD = shade(hair, -0.25);
  const top = CLOTH_COLORS[avatar.topColor];
  const topD = shade(top, -0.25);
  const bot = CLOTH_COLORS[avatar.bottomColor];
  const botD = shade(bot, -0.25);
  const shoe = CLOTH_COLORS[avatar.shoeColor];
  const gear = CLOTH_COLORS[avatar.gearColor];
  const gearD = shade(gear, -0.25);

  const [tL, tR, armW] = avatar.build === "flaco" ? [5, 10, 2] : avatar.build === "mamado" ? [3, 12, 3] : [4, 11, 2];
  const lArm: [number, number] = [tL - armW, tL - 1];
  const rArm: [number, number] = [tR + 1, tR + armW];

  // --- Piernas y zapatos
  rect(5, 17, 10, 21, skin);
  rect(7, 19, 7, 21, skinD);
  if (avatar.bottom === "shorts") {
    rect(5, 17, 10, 18, bot);
    rect(7, 18, 8, 18, botD);
  } else {
    rect(5, 17, 10, 21, bot);
    rect(7, 19, 7, 21, botD);
    if (avatar.bottom === "joggers") rect(5, 21, 10, 21, botD);
    if (avatar.bottom === "licra") { rect(5, 17, 5, 21, "#f2f2f2"); rect(10, 17, 10, 21, "#f2f2f2"); }
  }
  rect(4, 22, 7, 22, shoe);
  rect(8, 22, 11, 22, shoe);
  rect(4, 23, 7, 23, "#f2f2f2");
  rect(8, 23, 11, 23, "#f2f2f2");

  // --- Torso
  rect(tL, 11, tR, 16, skin);
  if (avatar.build === "mamado") rect(4, 10, 11, 10, skin); // trapecios
  const torsoShade = () => rect(tR, 11, tR, 16, skinD);
  switch (avatar.top) {
    case "descubierto":
      torsoShade();
      rect(6, 12, 6, 12, skinD); rect(9, 12, 9, 12, skinD); // pectorales
      for (const y of [13, 15]) { rect(7, y, 7, y, skinD); rect(8, y, 8, y, skinD); }
      rect(7, 14, 8, 14, skin);
      break;
    case "esqueleto":
      rect(tL, 12, tR, 16, top);
      rect(tL + 1, 11, tL + 1, 11, top); rect(tR - 1, 11, tR - 1, 11, top);
      rect(tR, 12, tR, 16, topD);
      break;
    case "top":
      rect(tL, 11, tR, 13, top);
      rect(7, 11, 8, 11, skin);
      rect(tR, 11, tR, 13, topD);
      torsoShade();
      rect(tR, 11, tR, 13, topD);
      break;
    case "camiseta":
    case "hoodie":
      rect(tL, 11, tR, 16, top);
      rect(7, 11, 8, 11, skin);
      rect(tR, 11, tR, 16, topD);
      if (avatar.top === "hoodie") { rect(6, 15, 9, 15, topD); rect(5, 10, 5, 10, topD); rect(10, 10, 10, 10, topD); }
      break;
  }

  // --- Brazos
  const sleeveRows = avatar.top === "camiseta" ? 2 : avatar.top === "hoodie" ? 99 : 0;
  const armColor = (row: number) => (row < sleeveRows ? top : skin);
  const armColorD = (row: number) => (row < sleeveRows ? topD : skinD);
  const band = CLOTH_COLORS[avatar.gearColor];
  if (pose === "idle") {
    for (const [a, b] of [lArm, rArm]) {
      for (let r = 0; r < 6; r++) {
        rect(a, 11 + r, b, 11 + r, armColor(r));
        rect(b === rArm[1] ? b : a, 11 + r, b === rArm[1] ? b : a, 11 + r, armColorD(r));
      }
      if (avatar.wristbands) rect(a, 16, b, 16, band);
      rect(a, 17, b, 17, skin); // manos
    }
  } else {
    // Pose de fuerza: brazo horizontal + antebrazo arriba + puño
    const sides: [number, number, number][] = [
      [lArm[0] - 1, tL - 1, -1],
      [tR + 1, rArm[1] + 1, 1],
    ];
    for (const [x0, x1, dir] of sides) {
      rect(x0, 11, x1, 12, armColor(0));
      rect(x0, 12, x1, 12, armColorD(0));
      const fx0 = dir < 0 ? x0 : x1 - armW + 1;
      const fx1 = dir < 0 ? x0 + armW - 1 : x1;
      rect(fx0, 7, fx1, 10, armColor(sleeveRows > 2 ? 0 : 5));
      if (avatar.build !== "flaco") rect(dir < 0 ? x0 + 1 : x1 - 1, 10, dir < 0 ? x0 + 1 : x1 - 1, 10, skinD); // bíceps
      if (avatar.wristbands) rect(fx0, 7, fx1, 7, band);
      rect(fx0, 6, fx1, 6, skin);
    }
  }

  // --- Cinturón
  if (avatar.belt) {
    rect(tL, 16, tR, 16, "#6b3b1f");
    rect(7, 16, 8, 16, "#ffd700");
  }

  // --- Cuello y cabeza
  rect(6, 10, 9, 10, skinD);
  rect(4, 2, 11, 9, skin);
  rect(11, 3, 11, 9, skinD);
  rect(3, 5, 3, 6, skin); rect(12, 5, 12, 6, skinD); // orejas
  // ojos (animados con parpadeo)
  for (const x of [6, 9]) { put(x, 6, "#140c1c"); eyes.add(`${x + OX},${6 + OY}`); }
  put(6, 5, shade(hair, -0.1)); put(9, 5, shade(hair, -0.1)); // cejas
  put(7, 8, skinD); put(8, 8, skinD); // boca

  // --- Vello facial
  if (avatar.facial === "bigote") rect(6, 7, 9, 7, hair);
  if (avatar.facial === "barba") {
    rect(4, 7, 4, 9, hair); rect(11, 7, 11, 9, hairD);
    rect(5, 9, 10, 9, hair); rect(6, 7, 9, 7, hair);
    put(7, 8, skinD); put(8, 8, skinD);
  }

  // --- Pelo
  const hasCap = avatar.headgear === "gorra";
  switch (avatar.hair) {
    case "calvo":
      put(5, 3, shade(skin, 0.35));
      break;
    case "rapado":
      rect(4, 2, 11, 2, shade(hair, 0.15)); rect(4, 3, 4, 3, hair); rect(11, 3, 11, 3, hairD);
      break;
    case "corto":
      rect(4, 1, 11, 2, hair); rect(4, 3, 5, 3, hair); rect(10, 3, 11, 3, hair);
      rect(4, 4, 4, 5, hair); rect(11, 4, 11, 5, hairD); rect(5, 1, 7, 1, shade(hair, 0.2));
      break;
    case "puntas":
      for (const x of [4, 6, 8, 10]) put(x, 0, hair);
      rect(4, 1, 11, 2, hair); rect(4, 3, 4, 4, hair); rect(11, 3, 11, 4, hairD); put(9, 3, hair);
      break;
    case "mohicano":
      rect(7, -1, 8, 2, hair); rect(6, 1, 9, 2, hair); put(8, -1, hairD);
      rect(4, 2, 5, 2, hairD); rect(10, 2, 11, 2, hairD);
      break;
    case "cola":
      rect(4, 1, 11, 2, hair); rect(4, 3, 5, 3, hair); rect(4, 4, 4, 5, hair); rect(11, 3, 11, 4, hairD);
      rect(12, 2, 13, 3, hair); rect(13, 4, 13, 8, hairD); rect(12, 4, 12, 7, hair);
      break;
    case "largo":
      rect(4, 1, 11, 2, hair); rect(3, 2, 4, 11, hair); rect(11, 2, 12, 11, hairD);
      rect(5, 3, 6, 3, hair); rect(9, 3, 10, 3, hair);
      break;
    case "afro":
      rect(3, -1, 12, 3, hair); rect(2, 1, 2, 6, hair); rect(13, 1, 13, 6, hairD);
      rect(3, 4, 3, 7, hair); rect(12, 4, 12, 7, hairD); rect(4, -1, 6, -1, shade(hair, 0.2));
      put(5, 0, shade(hair, 0.25)); put(9, 1, hairD);
      break;
  }

  // --- Accesorios de cabeza
  if (hasCap) {
    rect(4, 0, 11, 2, gear); rect(3, 3, 12, 3, gearD); rect(7, 1, 8, 1, "#f2f2f2");
  }
  if (avatar.headgear === "bandana") {
    rect(4, 3, 11, 3, gear); rect(12, 3, 13, 4, gearD);
  }
  if (avatar.headgear === "audifonos") {
    rect(4, 0, 11, 0, "#2b2b38"); rect(3, 1, 3, 3, "#2b2b38"); rect(12, 1, 12, 3, "#2b2b38");
    rect(2, 4, 3, 6, gear); rect(12, 4, 13, 6, gearD);
  }
  if (avatar.extra === "gafas") {
    rect(5, 6, 10, 6, "#140c1c"); put(5, 6, "#3a3a4a"); put(9, 6, "#3a3a4a");
    eyes.clear();
  }
  if (avatar.extra === "cadena") {
    rect(6, 11, 9, 11, "#ffd700"); rect(7, 12, 8, 12, "#ffb000");
  }

  // --- Contorno automático
  const out: Pixel[] = [];
  for (let y = 0; y < AVATAR_H; y++) {
    for (let x = 0; x < AVATAR_W; x++) {
      const c = grid[y][x];
      if (c) {
        out.push({ x, y, c, eye: eyes.has(`${x},${y}`) || undefined });
        continue;
      }
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx]);
      if (near) out.push({ x, y, c: OUTLINE });
    }
  }
  return out;
}

/** Une píxeles contiguos del mismo color en filas para un SVG más liviano. */
export function toRuns(pixels: Pixel[]): { x: number; y: number; w: number; c: string; eye?: boolean }[] {
  const sorted = [...pixels].sort((a, b) => a.y - b.y || a.x - b.x);
  const runs: { x: number; y: number; w: number; c: string; eye?: boolean }[] = [];
  for (const p of sorted) {
    const last = runs[runs.length - 1];
    if (last && !p.eye && !last.eye && last.y === p.y && last.c === p.c && last.x + last.w === p.x) last.w++;
    else runs.push({ x: p.x, y: p.y, w: 1, c: p.c, eye: p.eye });
  }
  return runs;
}
