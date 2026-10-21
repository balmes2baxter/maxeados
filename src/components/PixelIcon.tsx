// Íconos pixel art dibujados como texto: cada carácter es un píxel.
const PALETTE: Record<string, string> = {
  k: "#140c1c",
  w: "#f2f2f2",
  g: "#ffd700",
  G: "#b8860b",
  y: "#fff3a0",
  n: "#39ff14",
  p: "#ff3ea5",
  c: "#00e5ff",
  r: "#e63946",
  o: "#ff6b1a",
  s: "#b8b8cc",
  S: "#4a4a5e",
  b: "#8b5a2b",
};

const ICONS = {
  trophy: [
    "..kkkkkk..",
    "kkkygggkkk",
    "k.kygggk.k",
    "kkkggggkkk",
    "..kggggk..",
    "...kggk...",
    "....kk....",
    "...kggk...",
    "..kGGGGk..",
    "..kkkkkk..",
  ],
  coin: [
    "..kkkk..",
    ".kyyggk.",
    "kyggkgGk",
    "kygkggGk",
    "kygkggGk",
    "kgggggGk",
    ".kGGGGk.",
    "..kkkk..",
  ],
  flame: [
    "....k...",
    "...kok..",
    "..koook.",
    ".kooyok.",
    ".koyyyok",
    "koyyyyok",
    "koyyyyok",
    ".koyyok.",
    "..kkkk..",
  ],
  star: [
    "....k....",
    "...kyk...",
    "kkkkygkkk",
    "kgyyggggk",
    ".kggggGk.",
    "..kgggGk.",
    ".kggkgGGk",
    ".kgk.kGk.",
    ".kk...kk.",
  ],
  check: [
    ".......kk",
    "......knk",
    "kk...knk.",
    "knk.knk..",
    ".knknk...",
    "..knk....",
    "...k.....",
  ],
  cross: [
    "kk...kk",
    "krk.krk",
    ".krkrk.",
    "..krk..",
    ".krkrk.",
    "krk.krk",
    "kk...kk",
  ],
  home: [
    "....k....",
    "...kpk...",
    "..kpppk..",
    ".kpppppk.",
    "kkkkkkkkk",
    ".kwwSwwk.",
    ".kwwSwwk.",
    ".kwwSwwk.",
    ".kkkkkkk.",
  ],
  dumbbell: [
    ".kk.....kk.",
    "kwsk...kwsk",
    "kwskkkkkwsk",
    "kwssssssssk",
    "kwskkkkkwsk",
    "kwsk...kwsk",
    ".kk.....kk.",
  ],
  user: [
    "..kkkk..",
    ".kwwwwk.",
    ".kwwwwk.",
    "..kkkk..",
    ".kcccck.",
    "kcccccck",
    "kcccccck",
    "kkkkkkkk",
  ],
  gavel: [
    "..kkkk...",
    ".kbbbbk..",
    "kbbbbbbk.",
    ".kbbbbk..",
    "..kkkbk..",
    ".....kbk.",
    "......kbk",
    "kkkkkk.kk",
    "kSSSSk...",
  ],
  clock: [
    "..kkkk..",
    ".kwwwwk.",
    "kwwkwwwk",
    "kwwkwwwk",
    "kwwkkkwk",
    "kwwwwwwk",
    ".kwwwwk.",
    "..kkkk..",
  ],
  hourglass: [
    "kkkkkkk",
    "kwwwwwk",
    ".kyyyk.",
    "..kyk..",
    "..kwk..",
    ".kwywk.",
    "kwyyywk",
    "kkkkkkk",
  ],
  flag: [
    "kkkkkk..",
    "knnnnnk.",
    "knnnnnnk",
    "knnnnnk.",
    "kkkkkk..",
    "k.......",
    "k.......",
    "kk......",
  ],
  bolt: [
    "...kkkk",
    "..kyyk.",
    ".kyyk..",
    "kyyyykk",
    "kkyyyyk",
    "..kyyk.",
    ".kyyk..",
    ".kyk...",
    "kkk....",
  ],
  crown: [
    "k...k...k",
    "kgkkgkkgk",
    "kgggygggk",
    "kggpgcggk",
    "kgggggggk",
    "kGGGGGGGk",
    "kkkkkkkkk",
  ],
  scale: [
    "kkkkkkkkk",
    "kwwwwwwwk",
    "kwkkkkkwk",
    "kwkcckkwk",
    "kwkkkkkwk",
    "kwwwwwwwk",
    "kSSSSSSSk",
    "kkkkkkkkk",
  ],
  leg: [
    ".kkkk..",
    "knnnnk.",
    ".knnnk.",
    ".knnnk.",
    ".knnk..",
    ".knnk..",
    ".knnk..",
    ".knnkkk",
    ".knnnnk",
    ".kkkkkk",
  ],
  wing: [
    "kk.....kk",
    "kck...kck",
    "kcckkkcck",
    ".kcccccck",
    ".kccccck.",
    "..kccck..",
    "...kkk...",
  ],
  video: [
    "kkkkkkk..",
    "kpppppkkk",
    "kpwpppkpk",
    "kpppppkpk",
    "kpppppkkk",
    "kkkkkkk..",
  ],
  lock: [
    "..kkk..",
    ".k...k.",
    ".k...k.",
    "kkkkkkk",
    "kgggggk",
    "kggkggk",
    "kgggggk",
    "kkkkkkk",
  ],
  dice: [
    "kkkkkkkk",
    "kwwwwwwk",
    "kwkwwwwk",
    "kwwwwwwk",
    "kwwwkwwk",
    "kwwwwwwk",
    "kwwwwwkk",
    "kkkkkkkk",
  ],
  plus: [
    "..kkk..",
    "..knk..",
    "kkknkkk",
    "knnnnnk",
    "kkknkkk",
    "..knk..",
    "..kkk..",
  ],
  back: [
    "...k....",
    "..kk....",
    ".kwkkkkk",
    "kwwwwwwk",
    ".kwkkkkk",
    "..kk....",
    "...k....",
  ],
  sound: [
    "...kk...",
    "..kwk.k.",
    "kkwwk..k",
    "kwwwk..k",
    "kkwwk..k",
    "..kwk.k.",
    "...kk...",
  ],
  mute: [
    "...kk...",
    "..kwk...",
    "kkwwkr.r",
    "kwwwk.r.",
    "kkwwkr.r",
    "..kwk...",
    "...kk...",
  ],
  door: [
    "kkkkkk..",
    "kSSSSk..",
    "kSSSSk.k",
    "kSSgSkkk",
    "kSSSSk.k",
    "kSSSSk..",
    "kkkkkk..",
  ],
  sword: [
    ".......kk",
    "......kwk",
    ".....kwk.",
    "....kwk..",
    "kk.kwk...",
    ".kkwk....",
    "..kk.....",
    ".kbkk....",
    "kbk......",
  ],
} as const;

export type IconName = keyof typeof ICONS;

export function PixelIcon({
  name,
  size = 24,
  className,
  title,
}: {
  name: IconName | string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const rows = ICONS[name as IconName] ?? ICONS.star;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const rects: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") { x++; continue; }
      let run = 1;
      while (row[x + run] === ch) run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={PALETTE[ch] ?? "#fff"} />);
      x += run;
    }
  });
  const scale = size / Math.max(w, h);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={Math.round(w * scale)}
      height={Math.round(h * scale)}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {rects}
    </svg>
  );
}
