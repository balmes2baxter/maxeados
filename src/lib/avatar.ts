// Motor del personaje pixel art. Compone capas sobre una rejilla de 34×40
// y devuelve los píxeles con contorno automático. Sin dependencias del DOM,
// así sirve igual en servidor y cliente.

export const AVATAR_W = 34;
export const AVATAR_H = 40;

export const SKIN_TONES = ["#ffdbb4", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#5c3a21"] as const;
export const HAIR_COLORS = [
  "#1b1b1b", "#4a2c17", "#8b5a2b", "#e6c35c", "#d9481f", "#f2f2f2", "#ff3ea5", "#39ff14", "#00e5ff", "#9b5cff",
] as const;
export const CLOTH_COLORS = [
  "#39ff14", "#ffd700", "#ff3ea5", "#00e5ff", "#ff6b1a", "#9b5cff", "#f2f2f2", "#2b2b38", "#e63946", "#2a9d8f",
  "#1e4e8c", "#8b5a2b",
] as const;

export const BUILDS = { flaco: "Flaco", atletico: "Atlético", mamado: "Mamado" } as const;
export const EXPRESSIONS = { serio: "Serio", sonrisa: "Sonrisa", apretando: "Apretando", grito: "Grito" } as const;
export const HAIRS = {
  calvo: "Calvo", rapado: "Rapado", corto: "Corto", puntas: "Puntas", mohicano: "Mohicano",
  cola: "Cola", largo: "Largo", afro: "Afro", trenzas: "Trenzas", mono: "Moño",
} as const;
export const FACIAL = { ninguno: "Nada", bigote: "Bigote", candado: "Candado", patillas: "Patillas", barba: "Barba" } as const;
export const TOPS = {
  esqueleto: "Esqueleto", camiseta: "Camiseta", jersey: "Jersey", hoodie: "Hoodie",
  compresion: "Compresión", top: "Top deportivo", descubierto: "Sin camiseta",
} as const;
export const BOTTOMS = { shorts: "Shorts", joggers: "Joggers", licra: "Licra" } as const;
export const HEADGEAR = {
  ninguno: "Nada", bandana: "Bandana", gorra: "Gorra", visera: "Visera", gorroLana: "Gorro",
  audifonos: "Audífonos", corona: "Corona", vikingo: "Vikingo",
} as const;
export const EXTRAS = {
  ninguno: "Nada", gafas: "Gafas de sol", lentes: "Lentes", parche: "Parche", cicatriz: "Cicatriz", pintura: "Pintura",
} as const;
export const NECK = { ninguno: "Nada", cadena: "Cadena", medalla: "Medalla", silbato: "Silbato", toalla: "Toalla" } as const;
export const HAND = {
  ninguno: "Nada", mancuerna: "Mancuerna", pesa: "Pesa rusa", shaker: "Shaker", telefono: "Celular",
} as const;
export const BACK = { ninguno: "Nada", capa: "Capa", alas: "Alas", mochila: "Mochila" } as const;
export const TOGGLES = {
  belt: "Cinturón", wristbands: "Muñequeras", gloves: "Guantes", kneeSleeves: "Rodilleras",
  socks: "Medias altas", tattoo: "Tatuaje", earring: "Arete",
} as const;

export type Avatar = {
  build: keyof typeof BUILDS;
  skin: number;
  expression: keyof typeof EXPRESSIONS;
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
  neck: keyof typeof NECK;
  hand: keyof typeof HAND;
  back: keyof typeof BACK;
} & Record<keyof typeof TOGGLES, boolean>;

export const DEFAULT_AVATAR: Avatar = {
  build: "atletico",
  skin: 2,
  expression: "serio",
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
  neck: "ninguno",
  hand: "ninguno",
  back: "ninguno",
  belt: false,
  wristbands: false,
  gloves: false,
  kneeSleeves: false,
  socks: false,
  tattoo: false,
  earring: false,
};

/** Generador determinista: mismo número → mismo personaje (sirve para prerenderizar). */
export function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const keys = <T extends object>(o: T) => Object.keys(o) as (keyof T)[];

export function randomAvatar(rand: () => number = Math.random): Avatar {
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const index = (arr: readonly unknown[]) => Math.floor(rand() * arr.length);
  const sometimes = <T,>(none: T, opts: T[]) => (rand() < 0.5 ? none : pick(opts));
  const toggles = Object.fromEntries(keys(TOGGLES).map((k) => [k, rand() < 0.3])) as Record<keyof typeof TOGGLES, boolean>;
  return {
    build: pick(keys(BUILDS)),
    skin: index(SKIN_TONES),
    expression: pick(keys(EXPRESSIONS)),
    hair: pick(keys(HAIRS)),
    hairColor: index(HAIR_COLORS),
    facial: sometimes("ninguno", keys(FACIAL)),
    top: pick(keys(TOPS)),
    topColor: index(CLOTH_COLORS),
    bottom: pick(keys(BOTTOMS)),
    bottomColor: index(CLOTH_COLORS),
    shoeColor: index(CLOTH_COLORS),
    headgear: sometimes("ninguno", keys(HEADGEAR)),
    gearColor: index(CLOTH_COLORS),
    extra: sometimes("ninguno", keys(EXTRAS)),
    neck: sometimes("ninguno", keys(NECK)),
    hand: sometimes("ninguno", keys(HAND)),
    back: rand() < 0.75 ? "ninguno" : pick(keys(BACK)),
    ...toggles,
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
  // Personajes viejos guardaban la cadena en "extra"
  const legacyChain = a.extra === "cadena";
  return {
    build: oneOf(a.build, BUILDS, D.build),
    skin: idx(a.skin, SKIN_TONES.length, D.skin),
    expression: oneOf(a.expression, EXPRESSIONS, D.expression),
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
    neck: legacyChain ? "cadena" : oneOf(a.neck, NECK, D.neck),
    hand: oneOf(a.hand, HAND, D.hand),
    back: oneOf(a.back, BACK, D.back),
    ...(Object.fromEntries(keys(TOGGLES).map((k) => [k, a[k] === true])) as Record<keyof typeof TOGGLES, boolean>),
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
const WHITE = "#f2f2f2";
const DARK = "#2b2b38";
const STEEL = "#9aa0aa";
const GOLD = "#ffd700";
const OX = 5; // margen para el contorno, brazos en pose de fuerza y accesorios
const OY = 3;

export function renderAvatar(avatar: Avatar, pose: Pose = "idle"): Pixel[] {
  const grid: (string | null)[][] = Array.from({ length: AVATAR_H }, () => Array(AVATAR_W).fill(null));
  const eyes = new Set<string>();
  const put = (x: number, y: number, c: string | null) => {
    const gx = x + OX, gy = y + OY;
    if (gx >= 0 && gx < AVATAR_W && gy >= 0 && gy < AVATAR_H) grid[gy][gx] = c;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string | null) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c);
  };
  const eye = (x: number, y: number, c: string) => { put(x, y, c); eyes.add(`${x + OX},${y + OY}`); };

  const skin = SKIN_TONES[avatar.skin];
  const skinD = shade(skin, -0.18);
  const skinL = shade(skin, 0.3);
  const hair = HAIR_COLORS[avatar.hairColor];
  const hairD = shade(hair, -0.25);
  const hairL = shade(hair, 0.22);
  const top = CLOTH_COLORS[avatar.topColor];
  const topD = shade(top, -0.25);
  const bot = CLOTH_COLORS[avatar.bottomColor];
  const botD = shade(bot, -0.25);
  const shoe = CLOTH_COLORS[avatar.shoeColor];
  const gear = CLOTH_COLORS[avatar.gearColor];
  const gearD = shade(gear, -0.25);
  const gearL = shade(gear, 0.3);

  const [tL, tR, armW] = avatar.build === "flaco" ? [8, 15, 3] : avatar.build === "mamado" ? [5, 18, 4] : [7, 16, 3];
  const lArm: [number, number] = [tL - armW, tL - 1];
  const rArm: [number, number] = [tR + 1, tR + armW];

  // --- Espalda (va detrás de todo)
  if (avatar.back === "capa") {
    rect(tL - 1, 16, tR + 1, 35, gearD);
    rect(tL - 2, 30, tR + 2, 35, gearD);
    rect(tL, 16, tR, 17, gear);
  }
  if (avatar.back === "alas") {
    for (const [dir, x0] of [[-1, tL - 1], [1, tR + 1]] as const) {
      for (let i = 0; i < 7; i++) {
        const x = x0 + dir * i;
        const yTop = 12 + Math.max(0, 3 - i) - (i > 3 ? i - 3 : 0);
        rect(x, yTop, x, 24 - i, i % 2 ? shade(WHITE, -0.12) : WHITE);
      }
    }
  }
  if (avatar.back === "mochila") rect(tL + 1, 14, tR - 1, 16, DARK);

  // --- Piernas y zapatos
  rect(8, 26, 15, 33, skin);
  rect(11, 28, 11, 33, skinD);
  rect(15, 26, 15, 33, skinD);
  rect(12, 30, 12, 33, null);
  if (avatar.bottom === "shorts") {
    if (avatar.kneeSleeves) { rect(8, 30, 11, 31, DARK); rect(13, 30, 15, 31, DARK); }
    if (avatar.socks) { rect(8, 32, 11, 33, WHITE); rect(13, 32, 15, 33, WHITE); put(8, 32, gear); put(13, 32, gear); }
    rect(8, 26, 15, 29, bot);
    rect(11, 28, 12, 29, botD);
    rect(15, 26, 15, 29, botD);
    rect(8, 29, 10, 29, botD);
    rect(13, 29, 14, 29, botD);
  } else {
    rect(8, 26, 15, 33, bot);
    rect(12, 30, 12, 33, null);
    rect(11, 28, 11, 33, botD);
    rect(15, 26, 15, 33, botD);
    if (avatar.bottom === "joggers") { rect(8, 33, 11, 33, botD); rect(13, 33, 15, 33, botD); put(10, 26, WHITE); put(13, 26, WHITE); }
    if (avatar.bottom === "licra") { rect(8, 26, 8, 33, WHITE); rect(15, 26, 15, 33, WHITE); }
  }
  rect(6, 34, 11, 35, shoe);
  rect(12, 34, 17, 35, shoe);
  rect(11, 34, 11, 35, shade(shoe, -0.3));
  rect(17, 34, 17, 35, shade(shoe, -0.3));
  put(9, 34, WHITE); put(14, 34, WHITE);
  rect(6, 36, 11, 36, WHITE);
  rect(12, 36, 17, 36, WHITE);

  // --- Torso
  rect(tL, 16, tR, 25, skin);
  if (avatar.build === "mamado") rect(tL + 2, 15, tR - 2, 15, skin); // trapecios
  const torsoShade = () => rect(tR, 16, tR, 25, skinD);
  switch (avatar.top) {
    case "descubierto":
      torsoShade();
      rect(tL + 1, 19, 10, 19, skinD); rect(13, 19, tR - 1, 19, skinD); // pectorales
      put(11, 18, skinD); put(12, 18, skinD);
      for (const y of [21, 23]) rect(10, y, 13, y, skinD); // abdominales
      rect(11, 20, 12, 25, skinD); rect(11, 21, 12, 21, skin); rect(11, 23, 12, 23, skin);
      put(9, 17, skinL); put(14, 17, skinL);
      break;
    case "esqueleto":
      rect(tL, 18, tR, 25, top);
      rect(tL + 1, 16, tL + 2, 17, top); rect(tR - 2, 16, tR - 1, 17, top);
      rect(tR, 18, tR, 25, topD);
      rect(10, 18, 13, 18, skin);
      break;
    case "top":
      rect(tL, 18, tR, 21, top);
      rect(tL + 1, 16, tL + 1, 17, top); rect(tR - 1, 16, tR - 1, 17, top);
      rect(11, 18, 12, 18, skin);
      torsoShade();
      rect(tR, 18, tR, 21, topD);
      rect(tL, 21, tR, 21, topD);
      put(11, 23, skinD); put(12, 23, skinD);
      break;
    case "camiseta":
    case "jersey":
    case "hoodie":
    case "compresion":
      rect(tL, 16, tR, 25, top);
      rect(10, 16, 13, 16, skin);
      if (avatar.top !== "compresion") { put(11, 17, skin); put(12, 17, skin); }
      rect(tR, 16, tR, 25, topD);
      if (avatar.top === "hoodie") {
        rect(9, 22, 14, 24, topD); rect(10, 22, 13, 22, top);
        rect(tL + 1, 15, 9, 15, topD); rect(14, 15, tR - 1, 15, topD);
        rect(10, 17, 10, 19, WHITE); rect(13, 17, 13, 20, WHITE);
      }
      if (avatar.top === "jersey") {
        rect(tL, 16, tL, 25, topD);
        rect(10, 19, 13, 19, WHITE); put(13, 20, WHITE); put(12, 21, WHITE); put(12, 22, WHITE); put(11, 23, WHITE);
      }
      if (avatar.top === "compresion") { rect(tL, 20, tR, 20, topD); rect(10, 16, 13, 16, topD); }
      break;
  }

  // --- Brazos
  const sleeveRows = avatar.top === "camiseta" || avatar.top === "jersey" ? 3 : avatar.top === "hoodie" || avatar.top === "compresion" ? 99 : 0;
  const armColor = (row: number) => (row < sleeveRows ? top : skin);
  const armColorD = (row: number) => (row < sleeveRows ? topD : skinD);
  const band = gear;
  const handC = avatar.gloves ? DARK : skin;
  const tattooC = "#1e4e8c";
  if (pose === "idle") {
    for (const [a, b] of [lArm, rArm]) {
      const outer = b === rArm[1] ? b : a;
      for (let r = 0; r < 10; r++) {
        rect(a, 16 + r, b, 16 + r, armColor(r));
        put(outer, 16 + r, armColorD(r));
      }
      if (avatar.build !== "flaco" && sleeveRows < 3) put(outer === a ? a + 1 : b - 1, 18, skinL); // hombro
      if (avatar.wristbands) rect(a, 24, b, 25, band);
      rect(a, 26, b, 27, handC);
    }
    if (avatar.tattoo && sleeveRows < 5) {
      const [a] = lArm;
      put(a + 1, 19, tattooC); put(a, 20, tattooC); put(a + 2, 20, tattooC); put(a + 1, 21, tattooC);
    }

    // --- Objeto en la mano derecha
    const [a, b] = rArm;
    switch (avatar.hand) {
      case "mancuerna":
        rect(a - 1, 26, b + 1, 27, STEEL);
        rect(a - 3, 24, a - 2, 29, DARK); rect(b + 2, 24, b + 3, 29, DARK);
        put(a - 3, 24, STEEL); put(b + 2, 24, STEEL);
        break;
      case "pesa":
        rect(a, 28, b, 28, DARK); put(a - 1, 29, DARK); put(b + 1, 29, DARK);
        rect(a - 1, 30, b + 1, 33, DARK); rect(a - 2, 31, b + 2, 32, DARK); put(a, 30, STEEL);
        break;
      case "shaker":
        rect(a, 21, b, 29, gear); rect(b, 21, b, 29, gearD); rect(a, 20, b, 20, WHITE); put(a, 22, gearL);
        break;
      case "telefono":
        rect(a, 21, b, 27, DARK); rect(a + 1, 22, b - 1, 25, "#00e5ff");
        break;
    }
    if (avatar.hand !== "ninguno") rect(a, 26, b, 27, handC);
  } else {
    // Pose de fuerza: brazo horizontal + antebrazo arriba + puño
    const sides: [number, number, number][] = [
      [lArm[0] - 2, tL - 1, -1],
      [tR + 1, rArm[1] + 2, 1],
    ];
    for (const [x0, x1, dir] of sides) {
      rect(x0, 16, x1, 18, armColor(0));
      rect(x0, 18, x1, 18, armColorD(0));
      const fx0 = dir < 0 ? x0 : x1 - armW + 1;
      const fx1 = dir < 0 ? x0 + armW - 1 : x1;
      rect(fx0, 10, fx1, 15, armColor(sleeveRows > 3 ? 0 : 9));
      rect(dir < 0 ? fx0 : fx1, 10, dir < 0 ? fx0 : fx1, 15, armColorD(sleeveRows > 3 ? 0 : 9));
      if (avatar.build !== "flaco") {
        // bíceps
        const bx = dir < 0 ? x0 + armW : x1 - armW;
        rect(bx - (dir < 0 ? 0 : 1), 15, bx + (dir < 0 ? 1 : 0), 15, armColor(0));
        put(bx, 16, sleeveRows ? topD : skinL);
      }
      if (avatar.wristbands) rect(fx0, 10, fx1, 11, band);
      rect(fx0, 8, fx1, 9, handC);
      if (avatar.tattoo && dir < 0 && sleeveRows < 5) { put(x0 + 3, 17, tattooC); put(x0 + 4, 16, tattooC); }
    }
  }

  // --- Cinturón y mochila
  if (avatar.belt) {
    rect(tL, 24, tR, 25, "#6b3b1f");
    rect(10, 24, 13, 25, GOLD);
    rect(11, 24, 12, 25, "#b8860b");
  }
  if (avatar.back === "mochila") { rect(tL + 1, 16, tL + 1, 23, DARK); rect(tR - 1, 16, tR - 1, 23, DARK); }

  // --- Cuello y cabeza
  rect(10, 15, 13, 15, skinD);
  rect(7, 3, 16, 14, skin);
  rect(16, 4, 16, 13, skinD);
  rect(8, 14, 15, 14, skinD);
  put(7, 3, null); put(16, 3, null); put(7, 14, null); put(16, 14, null);
  rect(6, 8, 6, 10, skin); rect(17, 8, 17, 10, skinD); // orejas
  // ojos (animados con parpadeo)
  eye(9, 8, WHITE); eye(9, 9, WHITE); eye(10, 8, OUTLINE); eye(10, 9, OUTLINE);
  eye(14, 8, WHITE); eye(14, 9, WHITE); eye(13, 8, OUTLINE); eye(13, 9, OUTLINE);
  rect(9, 7, 10, 7, hairD); rect(13, 7, 14, 7, hairD); // cejas
  if (avatar.expression === "apretando" || avatar.expression === "grito") { put(10, 6, hairD); put(13, 6, hairD); put(9, 7, skin); put(14, 7, skin); }
  put(12, 10, skinD); put(12, 11, skinD); // nariz

  // --- Vello facial
  if (avatar.facial === "bigote" || avatar.facial === "candado" || avatar.facial === "barba") rect(10, 12, 13, 12, hair);
  if (avatar.facial === "candado") rect(11, 14, 12, 14, hair);
  if (avatar.facial === "patillas" || avatar.facial === "barba") { rect(7, 8, 7, 12, hair); rect(16, 8, 16, 12, hairD); }
  if (avatar.facial === "barba") { rect(7, 13, 15, 13, hair); rect(8, 14, 15, 14, hairD); rect(16, 13, 16, 13, hairD); }

  // --- Boca
  const lip = shade(skin, -0.42);
  switch (avatar.expression) {
    case "serio": rect(10, 13, 13, 13, lip); break;
    case "sonrisa": put(9, 12, lip); put(14, 12, lip); rect(10, 13, 13, 13, lip); break;
    case "apretando": rect(10, 13, 13, 13, WHITE); put(11, 13, "#c8c8c8"); put(13, 13, "#c8c8c8"); break;
    case "grito": rect(10, 13, 13, 14, "#5a1020"); rect(10, 13, 13, 13, WHITE); break;
  }

  // --- Pelo
  switch (avatar.hair) {
    case "calvo":
      put(9, 4, skinL); put(10, 4, skinL); put(9, 5, skinL);
      break;
    case "rapado":
      rect(8, 3, 15, 3, hair); rect(7, 4, 16, 4, hair); put(7, 5, hair); put(16, 5, hairD);
      rect(9, 3, 11, 3, hairL);
      break;
    case "corto":
    case "cola":
    case "trenzas":
      rect(8, 1, 15, 1, hair); rect(7, 2, 16, 4, hair);
      rect(7, 5, 7, 7, hair); rect(16, 5, 16, 7, hairD); rect(8, 5, 10, 5, hair);
      rect(9, 2, 11, 2, hairL); rect(16, 2, 16, 4, hairD);
      if (avatar.hair === "cola") {
        rect(17, 3, 18, 5, hair); rect(17, 6, 18, 12, hairD); rect(18, 13, 18, 15, hairD); put(17, 5, gear);
      }
      if (avatar.hair === "trenzas") {
        for (const x of [6, 17]) {
          for (let y = 6; y <= 19; y++) put(x, y, y % 2 ? hair : hairD);
          put(x, 20, gear);
        }
      }
      break;
    case "puntas":
      for (const x of [7, 9, 11, 13, 15]) { put(x, 0, hair); put(x + 1, -1, hair); put(x + 1, 0, hair); }
      rect(7, 1, 16, 4, hair); rect(7, 5, 7, 6, hair); rect(16, 5, 16, 6, hairD);
      rect(9, 5, 9, 5, hair); rect(13, 5, 13, 5, hair);
      for (const x of [8, 12]) put(x, -1, hairL);
      break;
    case "mohicano":
      rect(10, -2, 13, 3, hair); rect(11, -2, 11, 2, hairL); put(13, -2, hairD);
      rect(8, 3, 9, 4, hairD); rect(14, 3, 15, 4, hairD);
      break;
    case "largo":
      rect(8, 1, 15, 1, hair); rect(7, 2, 16, 4, hair);
      rect(5, 3, 7, 18, hair); rect(16, 3, 18, 18, hairD);
      rect(8, 5, 9, 5, hair); rect(14, 5, 15, 5, hair); rect(9, 2, 11, 2, hairL);
      put(5, 18, null); put(18, 18, null);
      break;
    case "afro":
      rect(6, -3, 17, 5, hair); rect(4, -1, 5, 10, hair); rect(18, -1, 19, 10, hairD);
      rect(6, 6, 6, 11, hair); rect(17, 6, 17, 11, hairD);
      put(6, -3, null); put(17, -3, null); put(4, -1, null); put(19, -1, null); put(4, 10, null); put(19, 10, null);
      rect(8, -2, 10, -2, hairL); put(7, -1, hairL); put(12, 0, hairD); put(15, 2, hairD); put(9, 3, hairD);
      rect(18, 0, 19, 9, hairD);
      break;
    case "mono":
      rect(8, 1, 15, 1, hair); rect(7, 2, 16, 4, hair); rect(7, 5, 7, 6, hair); rect(16, 5, 16, 6, hairD);
      rect(10, -3, 13, 0, hair); rect(9, -2, 14, -1, hair); put(10, -2, hairL); put(11, -3, hairL);
      rect(10, 1, 13, 1, gear);
      break;
  }

  // --- Accesorios de cabeza
  switch (avatar.headgear) {
    case "gorra":
      rect(8, 0, 15, 0, gear); rect(7, 1, 16, 3, gear); rect(16, 1, 16, 3, gearD);
      rect(6, 4, 17, 4, gearD); rect(11, 1, 12, 2, WHITE);
      break;
    case "visera":
      rect(7, 4, 16, 5, gear); rect(6, 6, 17, 6, gearD); rect(16, 4, 16, 5, gearD);
      break;
    case "bandana":
      rect(7, 4, 16, 5, gear); rect(7, 5, 16, 5, gearD); rect(17, 4, 18, 6, gearD); put(19, 7, gearD); put(18, 7, gear);
      break;
    case "gorroLana":
      rect(8, -1, 15, -1, gear); rect(7, 0, 16, 3, gear); rect(7, 2, 16, 2, gearL); rect(16, 0, 16, 3, gearD);
      rect(6, 4, 17, 5, gearD); rect(11, -3, 12, -2, WHITE);
      break;
    case "audifonos":
      rect(8, 0, 15, 0, DARK); rect(7, 1, 7, 6, DARK); rect(16, 1, 16, 6, DARK);
      rect(5, 7, 6, 11, gear); rect(17, 7, 18, 11, gearD); put(5, 8, gearL);
      break;
    case "corona":
      rect(7, 1, 16, 3, GOLD); rect(7, 3, 16, 3, "#b8860b");
      for (const x of [7, 11, 12, 16]) rect(x, -1, x, 0, GOLD);
      put(9, 0, GOLD); put(14, 0, GOLD);
      put(9, 2, "#e63946"); put(11, 2, "#39ff14"); put(12, 2, "#39ff14"); put(14, 2, "#00e5ff");
      break;
    case "vikingo":
      rect(8, 0, 15, 0, STEEL); rect(7, 1, 16, 4, STEEL); rect(16, 1, 16, 4, "#6b6f78");
      rect(7, 4, 16, 4, "#6b6f78"); rect(11, 1, 12, 4, "#6b6f78"); put(9, 1, WHITE);
      rect(5, 1, 6, 3, "#f2e6c8"); rect(4, -1, 5, 0, "#f2e6c8"); put(4, -2, "#f2e6c8");
      rect(17, 1, 18, 3, "#e3d3a8"); rect(18, -1, 19, 0, "#e3d3a8"); put(19, -2, "#e3d3a8");
      break;
  }

  // --- Accesorios de cara
  switch (avatar.extra) {
    case "gafas":
      eyes.clear();
      rect(8, 8, 15, 9, OUTLINE); rect(6, 8, 7, 8, OUTLINE); rect(16, 8, 17, 8, OUTLINE);
      put(9, 8, "#4a4a62"); put(14, 8, "#4a4a62");
      break;
    case "lentes":
      for (const x0 of [8, 12]) {
        rect(x0, 7, x0 + 3, 7, DARK); rect(x0, 10, x0 + 3, 10, DARK);
        put(x0, 8, DARK); put(x0, 9, DARK); put(x0 + 3, 8, DARK); put(x0 + 3, 9, DARK);
      }
      put(12, 10, skinD);
      break;
    case "parche":
      for (const k of [`${13 + OX},${8 + OY}`, `${14 + OX},${8 + OY}`, `${13 + OX},${9 + OY}`, `${14 + OX},${9 + OY}`]) eyes.delete(k);
      rect(13, 8, 15, 10, OUTLINE); rect(7, 6, 16, 6, OUTLINE);
      break;
    case "cicatriz":
      rect(9, 5, 9, 11, "#b5485a"); put(8, 6, "#b5485a"); put(10, 6, "#b5485a"); put(8, 10, "#b5485a"); put(10, 10, "#b5485a");
      break;
    case "pintura":
      rect(8, 10, 10, 10, gear); rect(13, 10, 15, 10, gear); rect(8, 11, 9, 11, gear); rect(14, 11, 15, 11, gear);
      break;
  }
  if (avatar.earring) put(6, 11, GOLD);

  // --- Cuello
  switch (avatar.neck) {
    case "cadena":
      rect(9, 16, 14, 16, GOLD); rect(10, 17, 13, 17, GOLD); rect(11, 18, 12, 19, "#ffb000");
      break;
    case "medalla":
      put(10, 16, gear); put(13, 16, gear); put(10, 17, gear); put(13, 17, gear); put(11, 18, gear); put(12, 18, gear);
      rect(11, 19, 12, 21, GOLD); put(10, 20, GOLD); put(13, 20, GOLD); put(12, 21, "#b8860b");
      break;
    case "silbato":
      rect(10, 16, 13, 16, "#e63946"); put(10, 17, "#e63946"); put(10, 18, "#e63946");
      rect(9, 19, 11, 20, STEEL); put(8, 19, STEEL);
      break;
    case "toalla":
      rect(tL - 1, 15, tL + 2, 16, WHITE); rect(tL, 17, tL + 1, 23, WHITE); rect(tL + 1, 17, tL + 1, 23, "#d0d0d8");
      rect(tL, 21, tL + 1, 21, gear);
      break;
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
