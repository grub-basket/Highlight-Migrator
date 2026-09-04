// Native highlight palette (Obsidian insider custom highlight colours).
// Anchors are approximate sRGB values sampled from the colour picker swatches;
// they only drive the "nearest colour" suggestion, so exactness isn't critical.

export type NativeColor = "red" | "orange" | "yellow" | "green" | "blue" | "purple";

// A mapping target is a native colour, "default" (plain ==text== with no emoji),
// or "skip" (leave the original <mark> untouched).
// "unset" = no decision yet (blank in the review UI); left untouched on convert.
export type Target = NativeColor | "default" | "skip" | "unset";

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

// The stock Highlightr / Highlightr Plus default palette, keyed by base RGB
// (alpha ignored). These are the only colours we pre-fill a suggestion for;
// any custom colour is left blank for the user to decide. Both the A6-alpha
// and the CC-alpha ("floating") variants share the same six-digit bases below.
// Grey has no native equivalent, so it maps to a plain (uncoloured) highlight.
const KNOWN_HIGHLIGHTR: Record<string, Target> = {
  FF5582: "red",
  FFB8EB: "red", // pink
  FFB7EA: "red", // pink (CC variant)
  FFB86C: "orange",
  FFF3A3: "yellow",
  BBFABB: "green",
  "9CF09C": "green", // CC variant
  ADCCFF: "blue",
  "93C0FF": "blue", // CC variant
  ABF7F7: "blue", // aqua / cyan
  D2B3FF: "purple",
  CCA9FF: "purple", // CC variant
  CACFD9: "default", // grey -> plain highlight, no native colour
};

/** Exact match for a known default colour, or null. `hex` may include #/alpha. */
export function knownHighlightrColor(hex: string): Target | null {
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
export function guessFromClass(cls: string): Target | null {
  // Highlightr / Highlightr Plus default classes are hltr-<name>. Only the nine
  // stock names get a suggestion; a custom class is left blank for the user.
  const token = cls.toLowerCase().replace(/^hltr[-_]/, "");
  const map: Record<string, Target> = {
    pink: "red",
    red: "red",
    orange: "orange",
    yellow: "yellow",
    green: "green",
    cyan: "blue",
    blue: "blue",
    purple: "purple",
    grey: "default",
    gray: "default",
  };
  return map[token] ?? null;
}
