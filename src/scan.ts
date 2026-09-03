import {
  NativeColor,
  Target,
  NATIVE_EMOJI,
  parseHex,
  nearestNative,
  knownHighlightrColor,
  guessFromClass,
  RGB,
} from "./colors";

export type Mode = "hex" | "class";

// One distinct source colour found across the vault.
export interface ColorGroup {
  key: string; // "#RRGGBBAA" (upper) for hex, or "hltr-xxx" for class
  mode: Mode;
  rgb: RGB | null; // for hex groups
  raw: string; // representative raw value (original hex incl. alpha, or class)
  count: number; // convertible occurrences
  unsafe: number; // occurrences skipped as risky (multiline / contains ==)
  files: Set<string>;
  suggested: Target; // nearest-colour suggestion
}

export interface ScanResult {
  groups: ColorGroup[];
  totalMatches: number;
  totalUnsafe: number;
  fileCount: number;
}

// Match any <mark ...>...</mark>. Non-greedy inner so adjacent marks stay separate.
const MARK_RE = /<mark\b([^>]*)>([\s\S]*?)<\/mark>/gi;

interface Classified {
  mode: Mode;
  key: string;
  raw: string;
  rgb: RGB | null;
}

/** Identify a <mark>'s colour from its attribute string. Hex wins over class. */
export function classify(attrs: string, includeClass: boolean): Classified | null {
  const styleM = attrs.match(/style\s*=\s*"([^"]*)"/i);
  if (styleM) {
    const bg = styleM[1].match(
      /background(?:-color)?\s*:\s*(#[0-9A-Fa-f]{6,8})/i
    );
    if (bg) {
      const raw = bg[1];
      const key = "#" + raw.slice(1).toUpperCase();
      return { mode: "hex", key, raw, rgb: parseHex(raw) };
    }
  }
  if (includeClass) {
    const classM = attrs.match(/class\s*=\s*"([^"]*)"/i);
    if (classM) {
      const h = classM[1].match(/hltr-[a-z0-9-]+/i);
      if (h) {
        const key = h[0].toLowerCase();
        return { mode: "class", key, raw: key, rgb: null };
      }
    }
  }
  return null;
}

/** An occurrence is unsafe to auto-convert if it spans lines or holds markup. */
function isUnsafe(inner: string): boolean {
  return (
    inner.includes("\n") ||
    inner.includes("==") ||
    inner.includes("<mark") ||
    inner.includes("</mark")
  );
}

/** Scan a single file's text; accumulate per-colour counts. */
export function scanText(
  text: string,
  includeClass: boolean
): Map<string, { rgb: RGB | null; raw: string; mode: Mode; count: number; unsafe: number }> {
  const out = new Map<
    string,
    { rgb: RGB | null; raw: string; mode: Mode; count: number; unsafe: number }
  >();
  MARK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MARK_RE.exec(text)) !== null) {
    const c = classify(m[1], includeClass);
    if (!c) continue;
    const rec =
      out.get(c.key) ??
      { rgb: c.rgb, raw: c.raw, mode: c.mode, count: 0, unsafe: 0 };
    if (isUnsafe(m[2])) rec.unsafe++;
    else rec.count++;
    out.set(c.key, rec);
  }
  return out;
}

function suggestFor(mode: Mode, rgb: RGB | null, key: string): Target {
  if (mode === "hex") {
    return knownHighlightrColor(key) ?? (rgb ? nearestNative(rgb) : "skip");
  }
  if (mode === "class") return guessFromClass(key) ?? "skip";
  return "skip";
}

/**
 * Aggregate scanned files into vault-wide colour groups.
 * `files` is a list of { path, scan } where `scan` is the map from scanText().
 */
export function buildScanResult(
  files: { path: string; scan: ReturnType<typeof scanText> }[]
): ScanResult {
  const groups = new Map<string, ColorGroup>();
  let totalMatches = 0;
  let totalUnsafe = 0;
  const touchedFiles = new Set<string>();

  for (const f of files) {
    let fileTouched = false;
    for (const [key, info] of f.scan) {
      let g = groups.get(key);
      if (!g) {
        g = {
          key,
          mode: info.mode,
          rgb: info.rgb,
          raw: info.raw,
          count: 0,
          unsafe: 0,
          files: new Set<string>(),
          suggested: suggestFor(info.mode, info.rgb, key),
        };
        groups.set(key, g);
      }
      g.count += info.count;
      g.unsafe += info.unsafe;
      g.files.add(f.path);
      totalMatches += info.count;
      totalUnsafe += info.unsafe;
      if (info.count > 0 || info.unsafe > 0) fileTouched = true;
    }
    if (fileTouched) touchedFiles.add(f.path);
  }

  return {
    groups: [...groups.values()].sort((a, b) => b.count - a.count),
    totalMatches,
    totalUnsafe,
    fileCount: touchedFiles.size,
  };
}

/**
 * Rewrite <mark> highlights in `text` per the mapping.
 * Returns the new text plus how many marks changed / were skipped.
 * A mapping value of "skip" (or a key not present) leaves the mark untouched.
 * "default" produces ==text==; a native colour produces ==<emoji>text==.
 */
export function convertText(
  text: string,
  mapping: Record<string, Target>,
  includeClass: boolean
): { out: string; changed: number; skipped: number } {
  let changed = 0;
  let skipped = 0;
  const out = text.replace(MARK_RE, (full, attrs: string, inner: string) => {
    const c = classify(attrs, includeClass);
    if (!c) return full;
    const target = mapping[c.key];
    if (!target || target === "skip") return full;
    if (isUnsafe(inner)) {
      skipped++;
      return full;
    }
    changed++;
    if (target === "default") return `==${inner}==`;
    return `==${NATIVE_EMOJI[target as NativeColor]}${inner}==`;
  });
  return { out, changed, skipped };
}
