// Native highlight palette (Obsidian insider custom highlight colours).
// Anchors are approximate sRGB values sampled from the colour picker swatches;
// they only drive the "nearest colour" suggestion, so exactness isn't critical.

export type NativeColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

// A mapping target is a native colour, "default" (plain ==text== with no emoji),
// or "skip" (leave the original <mark> untouched).
export type Target = NativeColor | "default" | "skip";

export const NATIVE_ORDER: NativeColor[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
];

export const NATIVE_EMOJI: Record<NativeColor, string> = {
  red: "🔴",
  orange: "🟠",
  yellow: "🟡",
  green: "🟢",
  blue: "🔵",
  purple: "🟣",
};

export const NATIVE_LABEL: Record<NativeColor, string> = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
};

// Preview swatch colours for the review table.
export const NATIVE_SWATCH: Record<NativeColor, string> = {
  red: "#fb464c",
  orange: "#e9973f",
  yellow: "#e0de71",
  green: "#44cf6e",
  blue: "#086ddd",
  purple: "#a882ff",
};

const NATIVE_ANCHORS: Record<NativeColor, [number, number, number]> = {
  red: [0xfb, 0x46, 0x4c],
  orange: [0xe9, 0x97, 0x3f],
  yellow: [0xe0, 0xde, 0x71],
  green: [0x44, 0xcf, 0x6e],
  blue: [0x08, 0x6d, 0xdd],
  purple: [0xa8, 0x82, 0xff],
};

export type RGB = [number, number, number];

/** Parse "#RRGGBB" or "#RRGGBBAA" into base RGB (alpha dropped). Null if invalid. */
export function parseHex(hex: string): RGB | null {
  const h = hex.replace(/^#/, "");
  if (h.length < 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function rgbToLab([r, g, b]: RGB): RGB {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  X /= 0.95047;
  Z /= 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const ANCHOR_LAB: Record<NativeColor, RGB> = Object.fromEntries(
  NATIVE_ORDER.map((k) => [k, rgbToLab(NATIVE_ANCHORS[k])])
) as Record<NativeColor, RGB>;

// Highlightr's stock pastel palette maps 1:1 to native colours. These pastels
// are desaturated, so plain nearest-anchor matching misfires (e.g. pale green
// #BBFABB lands nearer the yellow anchor). Match the known defaults exactly
// first, by base RGB (alpha ignored), before falling back to nearest().
const KNOWN_HIGHLIGHTR: Record<string, NativeColor> = {
  FF5582: "red",
  FFB86C: "orange",
  FFF3A3: "yellow",
  BBFABB: "green",
  ADCCFF: "blue",
  D2B3FF: "purple",
};

/** Exact match for a known Highlightr default colour, or null. `hex` may include #/alpha. */
export function knownHighlightrColor(hex: string): NativeColor | null {
  const base = hex.replace(/^#/, "").slice(0, 6).toUpperCase();
  return KNOWN_HIGHLIGHTR[base] ?? null;
}

/** Nearest native colour to an RGB, by CIE76 Lab distance. */
export function nearestNative(rgb: RGB): NativeColor {
  const lab = rgbToLab(rgb);
  let best: NativeColor = "yellow";
  let bestD = Infinity;
  for (const k of NATIVE_ORDER) {
    const a = ANCHOR_LAB[k];
    const d = (lab[0] - a[0]) ** 2 + (lab[1] - a[1]) ** 2 + (lab[2] - a[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

/** Best-guess native colour from a Highlightr class name like "hltr-orange". */
export function guessFromClass(cls: string): NativeColor | null {
  const n = cls.toLowerCase();
  const table: [string, NativeColor][] = [
    ["pink", "red"],
    ["rose", "red"],
    ["red", "red"],
    ["orange", "orange"],
    ["amber", "orange"],
    ["yellow", "yellow"],
    ["gold", "yellow"],
    ["green", "green"],
    ["lime", "green"],
    ["teal", "green"],
    ["blue", "blue"],
    ["cyan", "blue"],
    ["purple", "purple"],
    ["violet", "purple"],
    ["magenta", "purple"],
  ];
  for (const [needle, col] of table) if (n.includes(needle)) return col;
  return null;
}
