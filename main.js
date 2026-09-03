"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HighlightMigratorPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/view.ts
var import_obsidian3 = require("obsidian");

// src/colors.ts
var NATIVE_ORDER = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple"
];
var NATIVE_EMOJI = {
  red: "\u{1F534}",
  orange: "\u{1F7E0}",
  yellow: "\u{1F7E1}",
  green: "\u{1F7E2}",
  blue: "\u{1F535}",
  purple: "\u{1F7E3}"
};
var NATIVE_LABEL = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple"
};
var NATIVE_SWATCH = {
  red: "#fb464c",
  orange: "#e9973f",
  yellow: "#e0de71",
  green: "#44cf6e",
  blue: "#086ddd",
  purple: "#a882ff"
};
var NATIVE_ANCHORS = {
  red: [251, 70, 76],
  orange: [233, 151, 63],
  yellow: [224, 222, 113],
  green: [68, 207, 110],
  blue: [8, 109, 221],
  purple: [168, 130, 255]
};
function parseHex(hex) {
  const h = hex.replace(/^#/, "");
  if (h.length < 6)
    return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n)))
    return null;
  return [r, g, b];
}
function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function rgbToLab([r, g, b]) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);
  let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  X /= 0.95047;
  Z /= 1.08883;
  const f = (t) => t > 8856e-6 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
var ANCHOR_LAB = Object.fromEntries(
  NATIVE_ORDER.map((k) => [k, rgbToLab(NATIVE_ANCHORS[k])])
);
var KNOWN_HIGHLIGHTR = {
  FF5582: "red",
  FFB86C: "orange",
  FFF3A3: "yellow",
  BBFABB: "green",
  ADCCFF: "blue",
  D2B3FF: "purple"
};
function knownHighlightrColor(hex) {
  const base = hex.replace(/^#/, "").slice(0, 6).toUpperCase();
  return KNOWN_HIGHLIGHTR[base] ?? null;
}
function nearestNative(rgb) {
  const lab = rgbToLab(rgb);
  let best = "yellow";
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
function guessFromClass(cls) {
  const n = cls.toLowerCase();
  const table = [
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
    ["magenta", "purple"]
  ];
  for (const [needle, col] of table)
    if (n.includes(needle))
      return col;
  return null;
}

// src/migrate.ts
var import_obsidian = require("obsidian");

// src/scan.ts
var MARK_RE = /<mark\b([^>]*)>([\s\S]*?)<\/mark>/gi;
function classify(attrs, includeClass) {
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
function isUnsafe(inner) {
  return inner.includes("\n") || inner.includes("==") || inner.includes("<mark") || inner.includes("</mark");
}
function scanText(text, includeClass) {
  const out = /* @__PURE__ */ new Map();
  MARK_RE.lastIndex = 0;
  let m;
  while ((m = MARK_RE.exec(text)) !== null) {
    const c = classify(m[1], includeClass);
    if (!c)
      continue;
    const rec = out.get(c.key) ?? { rgb: c.rgb, raw: c.raw, mode: c.mode, count: 0, unsafe: 0 };
    if (isUnsafe(m[2]))
      rec.unsafe++;
    else
      rec.count++;
    out.set(c.key, rec);
  }
  return out;
}
function suggestFor(mode, rgb, key) {
  if (mode === "hex") {
    return knownHighlightrColor(key) ?? (rgb ? nearestNative(rgb) : "skip");
  }
  if (mode === "class")
    return guessFromClass(key) ?? "skip";
  return "skip";
}
function buildScanResult(files) {
  const groups = /* @__PURE__ */ new Map();
  let totalMatches = 0;
  let totalUnsafe = 0;
  const touchedFiles = /* @__PURE__ */ new Set();
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
          files: /* @__PURE__ */ new Set(),
          suggested: suggestFor(info.mode, info.rgb, key)
        };
        groups.set(key, g);
      }
      g.count += info.count;
      g.unsafe += info.unsafe;
      g.files.add(f.path);
      totalMatches += info.count;
      totalUnsafe += info.unsafe;
      if (info.count > 0 || info.unsafe > 0)
        fileTouched = true;
    }
    if (fileTouched)
      touchedFiles.add(f.path);
  }
  return {
    groups: [...groups.values()].sort((a, b) => b.count - a.count),
    totalMatches,
    totalUnsafe,
    fileCount: touchedFiles.size
  };
}
function convertText(text, mapping, includeClass) {
  let changed = 0;
  let skipped = 0;
  const out = text.replace(MARK_RE, (full, attrs, inner) => {
    const c = classify(attrs, includeClass);
    if (!c)
      return full;
    const target = mapping[c.key];
    if (!target || target === "skip")
      return full;
    if (isUnsafe(inner)) {
      skipped++;
      return full;
    }
    changed++;
    if (target === "default")
      return `==${inner}==`;
    return `==${NATIVE_EMOJI[target]}${inner}==`;
  });
  return { out, changed, skipped };
}

// src/migrate.ts
var MANIFEST_NAME = "manifest.json";
async function ensureFolder(app, folder) {
  const parts = (0, import_obsidian.normalizePath)(folder).split("/");
  let cur = "";
  for (const p of parts) {
    if (!p)
      continue;
    cur = cur ? `${cur}/${p}` : p;
    if (!app.vault.getAbstractFileByPath(cur)) {
      try {
        await app.vault.createFolder(cur);
      } catch (e) {
      }
    }
  }
}
async function uniqueBackupFolder(app, base) {
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  let candidate = (0, import_obsidian.normalizePath)(`${base}/${stamp}`);
  let n = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = (0, import_obsidian.normalizePath)(`${base}/${stamp}-${n++}`);
  }
  return candidate;
}
function markdownFiles(app) {
  return app.vault.getMarkdownFiles();
}
async function scanVault(app, includeClass, skipFolders) {
  const files = markdownFiles(app).filter(
    (f) => !skipFolders.some((s) => s && f.path.startsWith(s + "/"))
  );
  const scanned = [];
  for (const f of files) {
    const text = await app.vault.cachedRead(f);
    if (!text.includes("<mark"))
      continue;
    const scan = scanText(text, includeClass);
    if (scan.size > 0)
      scanned.push({ path: f.path, scan });
  }
  return buildScanResult(scanned);
}
async function applyMigration(app, mapping, includeClass, backupBase, skipFolders) {
  const backupFolder = await uniqueBackupFolder(app, backupBase);
  const files = markdownFiles(app).filter(
    (f) => !skipFolders.some((s) => s && f.path.startsWith(s + "/")) && !f.path.startsWith(backupBase + "/")
  );
  const manifest = {
    plugin: "highlight-migrator",
    version: 1,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    backupFolder,
    includeClass,
    mapping,
    files: [],
    totalChanged: 0,
    totalSkipped: 0
  };
  let createdBackupRoot = false;
  for (const f of files) {
    const original = await app.vault.read(f);
    if (!original.includes("<mark"))
      continue;
    const { out, changed, skipped } = convertText(original, mapping, includeClass);
    manifest.totalSkipped += skipped;
    if (changed === 0 || out === original)
      continue;
    if (!createdBackupRoot) {
      await ensureFolder(app, backupFolder);
      createdBackupRoot = true;
    }
    const backupPath = (0, import_obsidian.normalizePath)(`${backupFolder}/${f.path}`);
    const backupDir = backupPath.split("/").slice(0, -1).join("/");
    await ensureFolder(app, backupDir);
    await app.vault.create(backupPath, original);
    await app.vault.modify(f, out);
    manifest.files.push({ path: f.path, backup: backupPath, changed });
    manifest.totalChanged += changed;
  }
  if (manifest.files.length > 0) {
    const manifestPath = (0, import_obsidian.normalizePath)(`${backupFolder}/${MANIFEST_NAME}`);
    await app.vault.create(manifestPath, JSON.stringify(manifest, null, 2));
  }
  return manifest;
}
async function listManifests(app, backupBase) {
  const out = [];
  const root = app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(backupBase));
  if (!root)
    return out;
  const children = root.children ?? [];
  for (const child of children) {
    const mfPath = (0, import_obsidian.normalizePath)(`${child.path}/${MANIFEST_NAME}`);
    const mf = app.vault.getAbstractFileByPath(mfPath);
    if (mf instanceof import_obsidian.TFile) {
      try {
        const data = JSON.parse(await app.vault.read(mf));
        out.push({ folder: child.path, manifest: data });
      } catch (e) {
      }
    }
  }
  out.sort((a, b) => b.manifest.createdAt.localeCompare(a.manifest.createdAt));
  return out;
}
async function revertMigration(app, manifest) {
  let restored = 0;
  const missing = [];
  for (const entry of manifest.files) {
    const backup = app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(entry.backup));
    if (!(backup instanceof import_obsidian.TFile)) {
      missing.push(entry.backup);
      continue;
    }
    const content = await app.vault.read(backup);
    const target = app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(entry.path));
    if (target instanceof import_obsidian.TFile) {
      await app.vault.modify(target, content);
    } else {
      const dir = entry.path.split("/").slice(0, -1).join("/");
      if (dir)
        await ensureFolder(app, dir);
      await app.vault.create(entry.path, content);
    }
    restored++;
  }
  return { restored, missing };
}
async function writeReport(app, result, reportFolder, mapping) {
  await ensureFolder(app, reportFolder);
  const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  let path = (0, import_obsidian.normalizePath)(`${reportFolder}/Highlight scan ${stamp}.md`);
  let n = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = (0, import_obsidian.normalizePath)(`${reportFolder}/Highlight scan ${stamp}-${n++}.md`);
  }
  const lines = [];
  lines.push("# Highlight scan report", "");
  lines.push(`- Scanned: ${stamp}`);
  lines.push(`- Distinct colours: ${result.groups.length}`);
  lines.push(`- Convertible highlights: ${result.totalMatches}`);
  lines.push(`- Unsafe (skipped) highlights: ${result.totalUnsafe}`);
  lines.push(`- Affected notes: ${result.fileCount}`, "");
  lines.push("## Colours", "");
  for (const g of result.groups) {
    const target = mapping[g.key] ?? g.suggested;
    lines.push(
      `- **${g.raw}** (${g.mode}) \u2192 \`${target}\` \u2014 ${g.count} highlight(s)` + (g.unsafe ? `, ${g.unsafe} unsafe` : "") + ` across ${g.files.size} note(s)`
    );
    for (const file of [...g.files].sort())
      lines.push(`  - ${file}`);
  }
  lines.push("", "## Machine-readable", "", "```json");
  lines.push(
    JSON.stringify(
      {
        scannedAt: stamp,
        totals: {
          distinctColours: result.groups.length,
          convertible: result.totalMatches,
          unsafe: result.totalUnsafe,
          affectedNotes: result.fileCount
        },
        colours: result.groups.map((g) => ({
          key: g.key,
          raw: g.raw,
          mode: g.mode,
          count: g.count,
          unsafe: g.unsafe,
          suggested: g.suggested,
          target: mapping[g.key] ?? g.suggested,
          files: [...g.files].sort()
        }))
      },
      null,
      2
    )
  );
  lines.push("```", "");
  await app.vault.create(path, lines.join("\n"));
  return path;
}

// src/modals.ts
var import_obsidian2 = require("obsidian");
var ConfirmModal = class extends import_obsidian2.Modal {
  constructor(app, title, body, cta, onConfirm) {
    super(app);
    this.title = title;
    this.body = body;
    this.cta = cta;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.title });
    contentEl.createEl("p", { text: this.body });
    new import_obsidian2.Setting(contentEl).addButton(
      (b) => b.setButtonText("Cancel").onClick(() => this.close())
    ).addButton(
      (b) => b.setButtonText(this.cta).setCta().onClick(async () => {
        this.close();
        await this.onConfirm();
      })
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/view.ts
var VIEW_TYPE = "highlight-migrator-view";
var HighlightMigratorView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.result = null;
    this.mapping = {};
    this.busy = false;
    this.planEl = null;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Highlight Migrator";
  }
  getIcon() {
    return "highlighter";
  }
  async onOpen() {
    this.render();
  }
  async onClose() {
  }
  get skipFolders() {
    return [this.plugin.settings.backupFolder, this.plugin.settings.reportFolder];
  }
  async runScan() {
    if (this.busy)
      return;
    this.busy = true;
    try {
      new import_obsidian3.Notice("Highlight Migrator: scanning vault\u2026");
      const result = await scanVault(
        this.plugin.app,
        this.plugin.settings.includeClass,
        this.skipFolders
      );
      this.result = result;
      for (const g of result.groups) {
        if (!(g.key in this.mapping))
          this.mapping[g.key] = g.suggested;
      }
      new import_obsidian3.Notice(
        `Highlight Migrator: ${result.totalMatches} highlight(s), ${result.groups.length} colour(s), ${result.fileCount} note(s).`
      );
    } catch (e) {
      new import_obsidian3.Notice("Highlight Migrator: scan failed \u2014 see console.");
      console.error(e);
    } finally {
      this.busy = false;
      this.render();
    }
  }
  plannedCounts() {
    let convert = 0;
    let skip = 0;
    const notes = /* @__PURE__ */ new Set();
    if (!this.result)
      return { convert, skip, notes: 0 };
    for (const g of this.result.groups) {
      const t = this.mapping[g.key] ?? "skip";
      if (t === "skip") {
        skip += g.count;
      } else {
        convert += g.count;
        for (const f of g.files)
          notes.add(f);
      }
    }
    return { convert, skip, notes: notes.size };
  }
  async runApply() {
    if (this.busy || !this.result)
      return;
    const plan = this.plannedCounts();
    if (plan.convert === 0) {
      new import_obsidian3.Notice("Highlight Migrator: nothing mapped to convert (all skipped).");
      return;
    }
    new ConfirmModal(
      this.plugin.app,
      "Back up and convert?",
      `This will copy ${plan.notes} affected note(s) into "${this.plugin.settings.backupFolder}/\u2026" as a backup, then convert ${plan.convert} highlight(s). You can revert afterwards.`,
      "Back up & convert",
      async () => {
        this.busy = true;
        this.render();
        try {
          if (this.plugin.settings.writeReportOnApply) {
            await writeReport(
              this.plugin.app,
              this.result,
              this.plugin.settings.reportFolder,
              this.mapping
            );
          }
          const manifest = await applyMigration(
            this.plugin.app,
            this.mapping,
            this.plugin.settings.includeClass,
            this.plugin.settings.backupFolder,
            this.skipFolders
          );
          new import_obsidian3.Notice(
            `Highlight Migrator: converted ${manifest.totalChanged} highlight(s) in ${manifest.files.length} note(s). Backup: ${manifest.backupFolder}`
          );
        } catch (e) {
          new import_obsidian3.Notice("Highlight Migrator: conversion failed \u2014 see console.");
          console.error(e);
        } finally {
          this.busy = false;
          await this.runScan();
        }
      }
    ).open();
  }
  async runReport() {
    if (!this.result) {
      new import_obsidian3.Notice("Highlight Migrator: scan first.");
      return;
    }
    const path = await writeReport(
      this.plugin.app,
      this.result,
      this.plugin.settings.reportFolder,
      this.mapping
    );
    new import_obsidian3.Notice(`Highlight Migrator: report written to ${path}`);
  }
  render() {
    const c = this.containerEl.children[1];
    c.empty();
    c.addClass("hm-view");
    c.createEl("h2", { text: "Highlight Migrator" });
    c.createEl("p", {
      cls: "hm-intro",
      text: "Convert legacy <mark> HTML highlights to native highlight colours. Scan first, map each colour (or skip it), then back up and convert. Everything is reversible."
    });
    const bar = c.createDiv({ cls: "hm-toolbar" });
    const scanBtn = bar.createEl("button", {
      text: this.busy ? "Working\u2026" : "Scan vault",
      cls: "mod-cta"
    });
    scanBtn.disabled = this.busy;
    scanBtn.onclick = () => this.runScan();
    const reportBtn = bar.createEl("button", { text: "Write report" });
    reportBtn.disabled = this.busy || !this.result;
    reportBtn.onclick = () => this.runReport();
    if (!this.result) {
      c.createEl("p", {
        cls: "hm-empty",
        text: "No scan yet. Click \u201CScan vault\u201D to find highlights."
      });
      return;
    }
    const s = this.result;
    const sum = c.createDiv({ cls: "hm-summary" });
    sum.createEl("span", {
      text: `${s.totalMatches} convertible \xB7 ${s.totalUnsafe} unsafe \xB7 ${s.groups.length} colours \xB7 ${s.fileCount} notes`
    });
    if (s.groups.length === 0) {
      c.createEl("p", {
        cls: "hm-empty",
        text: "No legacy <mark> highlights found. Nothing to migrate \u{1F389}"
      });
      return;
    }
    const table = c.createEl("table", { cls: "hm-table" });
    const head = table.createEl("thead").createEl("tr");
    ["Sample", "Source", "Count", "Notes", "Unsafe", "Map to"].forEach(
      (h) => head.createEl("th", { text: h })
    );
    const body = table.createEl("tbody");
    for (const g of s.groups) {
      const row = body.createEl("tr");
      const sampleTd = row.createEl("td");
      const sw = sampleTd.createDiv({ cls: "hm-swatch" });
      if (g.mode === "hex") {
        sw.style.background = g.raw;
      } else {
        sw.addClass("hm-swatch-class");
        sw.setText("cls");
      }
      row.createEl("td", { text: g.raw, cls: "hm-mono" });
      row.createEl("td", { text: String(g.count) });
      row.createEl("td", { text: String(g.files.size) });
      row.createEl("td", { text: g.unsafe ? String(g.unsafe) : "\u2014" });
      const mapTd = row.createEl("td");
      const sel = mapTd.createEl("select", { cls: "dropdown hm-select" });
      const addOpt = (value, label) => {
        const o = sel.createEl("option", { text: label, value });
        if ((this.mapping[g.key] ?? g.suggested) === value)
          o.selected = true;
      };
      addOpt("skip", "Skip (leave as-is)");
      addOpt("default", "Default (no colour)");
      for (const nc of NATIVE_ORDER) {
        addOpt(nc, `${NATIVE_EMOJI[nc]} ${NATIVE_LABEL[nc]}`);
      }
      const chip = mapTd.createSpan({ cls: "hm-chip" });
      const paintChip = () => {
        const t = this.mapping[g.key] ?? "skip";
        if (t === "skip")
          chip.setText("\u2014");
        else if (t === "default")
          chip.setText("==\xB7==");
        else {
          chip.setText(`==${NATIVE_EMOJI[t]}\u2026==`);
          chip.style.color = NATIVE_SWATCH[t];
        }
      };
      paintChip();
      sel.onchange = () => {
        this.mapping[g.key] = sel.value;
        paintChip();
        this.refreshPlan();
      };
    }
    const footer = c.createDiv({ cls: "hm-footer" });
    this.planEl = footer.createDiv({ cls: "hm-plan" });
    this.refreshPlan();
    const actions = footer.createDiv({ cls: "hm-actions" });
    const applyBtn = actions.createEl("button", {
      text: "Back up & convert",
      cls: "mod-cta"
    });
    applyBtn.disabled = this.busy;
    applyBtn.onclick = () => this.runApply();
    const revertBtn = actions.createEl("button", { text: "Revert last migration" });
    revertBtn.disabled = this.busy;
    revertBtn.onclick = () => this.plugin.revertLast();
  }
  refreshPlan() {
    if (!this.planEl)
      return;
    const p = this.plannedCounts();
    this.planEl.setText(
      `Plan: convert ${p.convert} highlight(s) in ${p.notes} note(s); skip ${p.skip}.`
    );
  }
};

// src/main.ts
var DEFAULT_SETTINGS = {
  includeClass: true,
  backupFolder: "_highlight-backup",
  reportFolder: "Highlight Migration",
  writeReportOnApply: true
};
var HighlightMigratorPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new HighlightMigratorView(leaf, this));
    this.addRibbonIcon("highlighter", "Highlight Migrator", () => this.openView());
    this.addCommand({
      id: "open-migrator",
      name: "Open migrator (scan & map)",
      callback: () => this.openView()
    });
    this.addCommand({
      id: "revert-last-migration",
      name: "Revert last migration",
      callback: () => this.revertLast()
    });
    this.addSettingTab(new HmSettingTab(this.app, this));
  }
  onunload() {
  }
  async openView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }
  async revertLast() {
    const manifests = await listManifests(this.app, this.settings.backupFolder);
    if (manifests.length === 0) {
      new import_obsidian4.Notice("Highlight Migrator: no migrations to revert.");
      return;
    }
    const latest = manifests[0];
    new ConfirmModal(
      this.app,
      "Revert last migration?",
      `Restore ${latest.manifest.files.length} note(s) from backup "${latest.folder}" (migrated ${latest.manifest.createdAt}). Current versions of those notes will be overwritten.`,
      "Revert",
      async () => {
        const { restored, missing } = await revertMigration(this.app, latest.manifest);
        new import_obsidian4.Notice(
          `Highlight Migrator: restored ${restored} note(s)` + (missing.length ? `, ${missing.length} backup(s) missing.` : ".")
        );
      }
    ).open();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var HmSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian4.Setting(containerEl).setName("Convert class-based highlights").setDesc('Also match Highlightr class markup like <mark class="hltr-orange">, not only inline hex.').addToggle(
      (t) => t.setValue(this.plugin.settings.includeClass).onChange(async (v) => {
        this.plugin.settings.includeClass = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Backup folder").setDesc("Timestamped subfolders of untouched note copies are created here before any conversion.").addText(
      (t) => t.setValue(this.plugin.settings.backupFolder).onChange(async (v) => {
        this.plugin.settings.backupFolder = v.trim() || "_highlight-backup";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Report folder").setDesc("Scan report notes (tree + JSON) are written here.").addText(
      (t) => t.setValue(this.plugin.settings.reportFolder).onChange(async (v) => {
        this.plugin.settings.reportFolder = v.trim() || "Highlight Migration";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Write a report when applying").setDesc("Save a scan/mapping report note each time you run a conversion.").addToggle(
      (t) => t.setValue(this.plugin.settings.writeReportOnApply).onChange(async (v) => {
        this.plugin.settings.writeReportOnApply = v;
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3ZpZXcudHMiLCAic3JjL2NvbG9ycy50cyIsICJzcmMvbWlncmF0ZS50cyIsICJzcmMvc2Nhbi50cyIsICJzcmMvbW9kYWxzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4sIFdvcmtzcGFjZUxlYWYsIE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgQXBwLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBIaWdobGlnaHRNaWdyYXRvclZpZXcsIFZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdcIjtcbmltcG9ydCB7IGxpc3RNYW5pZmVzdHMsIHJldmVydE1pZ3JhdGlvbiB9IGZyb20gXCIuL21pZ3JhdGVcIjtcbmltcG9ydCB7IENvbmZpcm1Nb2RhbCB9IGZyb20gXCIuL21vZGFsc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEhtU2V0dGluZ3Mge1xuICBpbmNsdWRlQ2xhc3M6IGJvb2xlYW47XG4gIGJhY2t1cEZvbGRlcjogc3RyaW5nO1xuICByZXBvcnRGb2xkZXI6IHN0cmluZztcbiAgd3JpdGVSZXBvcnRPbkFwcGx5OiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBIbVNldHRpbmdzID0ge1xuICBpbmNsdWRlQ2xhc3M6IHRydWUsXG4gIGJhY2t1cEZvbGRlcjogXCJfaGlnaGxpZ2h0LWJhY2t1cFwiLFxuICByZXBvcnRGb2xkZXI6IFwiSGlnaGxpZ2h0IE1pZ3JhdGlvblwiLFxuICB3cml0ZVJlcG9ydE9uQXBwbHk6IHRydWUsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIaWdobGlnaHRNaWdyYXRvclBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIbVNldHRpbmdzID0gREVGQVVMVF9TRVRUSU5HUztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRSwgKGxlYWYpID0+IG5ldyBIaWdobGlnaHRNaWdyYXRvclZpZXcobGVhZiwgdGhpcykpO1xuXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiaGlnaGxpZ2h0ZXJcIiwgXCJIaWdobGlnaHQgTWlncmF0b3JcIiwgKCkgPT4gdGhpcy5vcGVuVmlldygpKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLW1pZ3JhdG9yXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gbWlncmF0b3IgKHNjYW4gJiBtYXApXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVmlldygpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInJldmVydC1sYXN0LW1pZ3JhdGlvblwiLFxuICAgICAgbmFtZTogXCJSZXZlcnQgbGFzdCBtaWdyYXRpb25cIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLnJldmVydExhc3QoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgSG1TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gIH1cblxuICBvbnVubG9hZCgpIHt9XG5cbiAgYXN5bmMgb3BlblZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFKVswXSA/PyBudWxsO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBWSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyByZXZlcnRMYXN0KCkge1xuICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGxpc3RNYW5pZmVzdHModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuYmFja3VwRm9sZGVyKTtcbiAgICBpZiAobWFuaWZlc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIkhpZ2hsaWdodCBNaWdyYXRvcjogbm8gbWlncmF0aW9ucyB0byByZXZlcnQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsYXRlc3QgPSBtYW5pZmVzdHNbMF07XG4gICAgbmV3IENvbmZpcm1Nb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgXCJSZXZlcnQgbGFzdCBtaWdyYXRpb24/XCIsXG4gICAgICBgUmVzdG9yZSAke2xhdGVzdC5tYW5pZmVzdC5maWxlcy5sZW5ndGh9IG5vdGUocykgZnJvbSBiYWNrdXAgXCIke2xhdGVzdC5mb2xkZXJ9XCIgKG1pZ3JhdGVkICR7bGF0ZXN0Lm1hbmlmZXN0LmNyZWF0ZWRBdH0pLiBDdXJyZW50IHZlcnNpb25zIG9mIHRob3NlIG5vdGVzIHdpbGwgYmUgb3ZlcndyaXR0ZW4uYCxcbiAgICAgIFwiUmV2ZXJ0XCIsXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVzdG9yZWQsIG1pc3NpbmcgfSA9IGF3YWl0IHJldmVydE1pZ3JhdGlvbih0aGlzLmFwcCwgbGF0ZXN0Lm1hbmlmZXN0KTtcbiAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICBgSGlnaGxpZ2h0IE1pZ3JhdG9yOiByZXN0b3JlZCAke3Jlc3RvcmVkfSBub3RlKHMpYCArXG4gICAgICAgICAgICAobWlzc2luZy5sZW5ndGggPyBgLCAke21pc3NpbmcubGVuZ3RofSBiYWNrdXAocykgbWlzc2luZy5gIDogXCIuXCIpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufVxuXG5jbGFzcyBIbVNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBIaWdobGlnaHRNaWdyYXRvclBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBIaWdobGlnaHRNaWdyYXRvclBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvbnZlcnQgY2xhc3MtYmFzZWQgaGlnaGxpZ2h0c1wiKVxuICAgICAgLnNldERlc2MoJ0Fsc28gbWF0Y2ggSGlnaGxpZ2h0ciBjbGFzcyBtYXJrdXAgbGlrZSA8bWFyayBjbGFzcz1cImhsdHItb3JhbmdlXCI+LCBub3Qgb25seSBpbmxpbmUgaGV4LicpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluY2x1ZGVDbGFzcykub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmNsdWRlQ2xhc3MgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJCYWNrdXAgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlRpbWVzdGFtcGVkIHN1YmZvbGRlcnMgb2YgdW50b3VjaGVkIG5vdGUgY29waWVzIGFyZSBjcmVhdGVkIGhlcmUgYmVmb3JlIGFueSBjb252ZXJzaW9uLlwiKVxuICAgICAgLmFkZFRleHQoKHQpID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja3VwRm9sZGVyKS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2t1cEZvbGRlciA9IHYudHJpbSgpIHx8IFwiX2hpZ2hsaWdodC1iYWNrdXBcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVwb3J0IGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJTY2FuIHJlcG9ydCBub3RlcyAodHJlZSArIEpTT04pIGFyZSB3cml0dGVuIGhlcmUuXCIpXG4gICAgICAuYWRkVGV4dCgodCkgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXBvcnRGb2xkZXIpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVwb3J0Rm9sZGVyID0gdi50cmltKCkgfHwgXCJIaWdobGlnaHQgTWlncmF0aW9uXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIldyaXRlIGEgcmVwb3J0IHdoZW4gYXBwbHlpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiU2F2ZSBhIHNjYW4vbWFwcGluZyByZXBvcnQgbm90ZSBlYWNoIHRpbWUgeW91IHJ1biBhIGNvbnZlcnNpb24uXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLndyaXRlUmVwb3J0T25BcHBseSkub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy53cml0ZVJlcG9ydE9uQXBwbHkgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIEhpZ2hsaWdodE1pZ3JhdG9yUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7XG4gIE5BVElWRV9PUkRFUixcbiAgTkFUSVZFX0xBQkVMLFxuICBOQVRJVkVfRU1PSkksXG4gIE5BVElWRV9TV0FUQ0gsXG4gIFRhcmdldCxcbn0gZnJvbSBcIi4vY29sb3JzXCI7XG5pbXBvcnQgeyBTY2FuUmVzdWx0IH0gZnJvbSBcIi4vc2NhblwiO1xuaW1wb3J0IHsgc2NhblZhdWx0LCBhcHBseU1pZ3JhdGlvbiwgd3JpdGVSZXBvcnQgfSBmcm9tIFwiLi9taWdyYXRlXCI7XG5pbXBvcnQgeyBDb25maXJtTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHNcIjtcblxuZXhwb3J0IGNvbnN0IFZJRVdfVFlQRSA9IFwiaGlnaGxpZ2h0LW1pZ3JhdG9yLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIEhpZ2hsaWdodE1pZ3JhdG9yVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSByZXN1bHQ6IFNjYW5SZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXBwaW5nOiBSZWNvcmQ8c3RyaW5nLCBUYXJnZXQ+ID0ge307XG4gIHByaXZhdGUgYnVzeSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcGx1Z2luOiBIaWdobGlnaHRNaWdyYXRvclBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKSB7XG4gICAgcmV0dXJuIFZJRVdfVFlQRTtcbiAgfVxuICBnZXREaXNwbGF5VGV4dCgpIHtcbiAgICByZXR1cm4gXCJIaWdobGlnaHQgTWlncmF0b3JcIjtcbiAgfVxuICBnZXRJY29uKCkge1xuICAgIHJldHVybiBcImhpZ2hsaWdodGVyXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuICBhc3luYyBvbkNsb3NlKCkge31cblxuICBwcml2YXRlIGdldCBza2lwRm9sZGVycygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrdXBGb2xkZXIsIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlcG9ydEZvbGRlcl07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blNjYW4oKSB7XG4gICAgaWYgKHRoaXMuYnVzeSkgcmV0dXJuO1xuICAgIHRoaXMuYnVzeSA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIG5ldyBOb3RpY2UoXCJIaWdobGlnaHQgTWlncmF0b3I6IHNjYW5uaW5nIHZhdWx0XHUyMDI2XCIpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2NhblZhdWx0KFxuICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluY2x1ZGVDbGFzcyxcbiAgICAgICAgdGhpcy5za2lwRm9sZGVyc1xuICAgICAgKTtcbiAgICAgIHRoaXMucmVzdWx0ID0gcmVzdWx0O1xuICAgICAgLy8gU2VlZCBtYXBwaW5nIGZyb20gc3VnZ2VzdGlvbnMsIHByZXNlcnZpbmcgYW55IHByaW9yIGNob2ljZXMuXG4gICAgICBmb3IgKGNvbnN0IGcgb2YgcmVzdWx0Lmdyb3Vwcykge1xuICAgICAgICBpZiAoIShnLmtleSBpbiB0aGlzLm1hcHBpbmcpKSB0aGlzLm1hcHBpbmdbZy5rZXldID0gZy5zdWdnZXN0ZWQ7XG4gICAgICB9XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgSGlnaGxpZ2h0IE1pZ3JhdG9yOiAke3Jlc3VsdC50b3RhbE1hdGNoZXN9IGhpZ2hsaWdodChzKSwgJHtyZXN1bHQuZ3JvdXBzLmxlbmd0aH0gY29sb3VyKHMpLCAke3Jlc3VsdC5maWxlQ291bnR9IG5vdGUocykuYFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiSGlnaGxpZ2h0IE1pZ3JhdG9yOiBzY2FuIGZhaWxlZCBcdTIwMTQgc2VlIGNvbnNvbGUuXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5idXN5ID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGxhbm5lZENvdW50cygpOiB7IGNvbnZlcnQ6IG51bWJlcjsgc2tpcDogbnVtYmVyOyBub3RlczogbnVtYmVyIH0ge1xuICAgIGxldCBjb252ZXJ0ID0gMDtcbiAgICBsZXQgc2tpcCA9IDA7XG4gICAgY29uc3Qgbm90ZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBpZiAoIXRoaXMucmVzdWx0KSByZXR1cm4geyBjb252ZXJ0LCBza2lwLCBub3RlczogMCB9O1xuICAgIGZvciAoY29uc3QgZyBvZiB0aGlzLnJlc3VsdC5ncm91cHMpIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLm1hcHBpbmdbZy5rZXldID8/IFwic2tpcFwiO1xuICAgICAgaWYgKHQgPT09IFwic2tpcFwiKSB7XG4gICAgICAgIHNraXAgKz0gZy5jb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnZlcnQgKz0gZy5jb3VudDtcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGcuZmlsZXMpIG5vdGVzLmFkZChmKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgY29udmVydCwgc2tpcCwgbm90ZXM6IG5vdGVzLnNpemUgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQXBwbHkoKSB7XG4gICAgaWYgKHRoaXMuYnVzeSB8fCAhdGhpcy5yZXN1bHQpIHJldHVybjtcbiAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFubmVkQ291bnRzKCk7XG4gICAgaWYgKHBsYW4uY29udmVydCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIkhpZ2hsaWdodCBNaWdyYXRvcjogbm90aGluZyBtYXBwZWQgdG8gY29udmVydCAoYWxsIHNraXBwZWQpLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbmV3IENvbmZpcm1Nb2RhbChcbiAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgIFwiQmFjayB1cCBhbmQgY29udmVydD9cIixcbiAgICAgIGBUaGlzIHdpbGwgY29weSAke3BsYW4ubm90ZXN9IGFmZmVjdGVkIG5vdGUocykgaW50byBcIiR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja3VwRm9sZGVyfS9cdTIwMjZcIiBhcyBhIGJhY2t1cCwgdGhlbiBjb252ZXJ0ICR7cGxhbi5jb252ZXJ0fSBoaWdobGlnaHQocykuIFlvdSBjYW4gcmV2ZXJ0IGFmdGVyd2FyZHMuYCxcbiAgICAgIFwiQmFjayB1cCAmIGNvbnZlcnRcIixcbiAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5idXN5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Mud3JpdGVSZXBvcnRPbkFwcGx5KSB7XG4gICAgICAgICAgICBhd2FpdCB3cml0ZVJlcG9ydChcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgICAgICAgICB0aGlzLnJlc3VsdCEsXG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlcG9ydEZvbGRlcixcbiAgICAgICAgICAgICAgdGhpcy5tYXBwaW5nXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBtYW5pZmVzdCA9IGF3YWl0IGFwcGx5TWlncmF0aW9uKFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgICAgICAgdGhpcy5tYXBwaW5nLFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5jbHVkZUNsYXNzLFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja3VwRm9sZGVyLFxuICAgICAgICAgICAgdGhpcy5za2lwRm9sZGVyc1xuICAgICAgICAgICk7XG4gICAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICAgIGBIaWdobGlnaHQgTWlncmF0b3I6IGNvbnZlcnRlZCAke21hbmlmZXN0LnRvdGFsQ2hhbmdlZH0gaGlnaGxpZ2h0KHMpIGluICR7bWFuaWZlc3QuZmlsZXMubGVuZ3RofSBub3RlKHMpLiBCYWNrdXA6ICR7bWFuaWZlc3QuYmFja3VwRm9sZGVyfWBcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkhpZ2hsaWdodCBNaWdyYXRvcjogY29udmVyc2lvbiBmYWlsZWQgXHUyMDE0IHNlZSBjb25zb2xlLlwiKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHRoaXMuYnVzeSA9IGZhbHNlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucnVuU2NhbigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blJlcG9ydCgpIHtcbiAgICBpZiAoIXRoaXMucmVzdWx0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiSGlnaGxpZ2h0IE1pZ3JhdG9yOiBzY2FuIGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHdyaXRlUmVwb3J0KFxuICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgdGhpcy5yZXN1bHQsXG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXBvcnRGb2xkZXIsXG4gICAgICB0aGlzLm1hcHBpbmdcbiAgICApO1xuICAgIG5ldyBOb3RpY2UoYEhpZ2hsaWdodCBNaWdyYXRvcjogcmVwb3J0IHdyaXR0ZW4gdG8gJHtwYXRofWApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgY29uc3QgYyA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgYy5lbXB0eSgpO1xuICAgIGMuYWRkQ2xhc3MoXCJobS12aWV3XCIpO1xuXG4gICAgYy5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJIaWdobGlnaHQgTWlncmF0b3JcIiB9KTtcbiAgICBjLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwiaG0taW50cm9cIixcbiAgICAgIHRleHQ6IFwiQ29udmVydCBsZWdhY3kgPG1hcms+IEhUTUwgaGlnaGxpZ2h0cyB0byBuYXRpdmUgaGlnaGxpZ2h0IGNvbG91cnMuIFNjYW4gZmlyc3QsIG1hcCBlYWNoIGNvbG91ciAob3Igc2tpcCBpdCksIHRoZW4gYmFjayB1cCBhbmQgY29udmVydC4gRXZlcnl0aGluZyBpcyByZXZlcnNpYmxlLlwiLFxuICAgIH0pO1xuXG4gICAgLy8gVG9vbGJhclxuICAgIGNvbnN0IGJhciA9IGMuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXRvb2xiYXJcIiB9KTtcbiAgICBjb25zdCBzY2FuQnRuID0gYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IHRoaXMuYnVzeSA/IFwiV29ya2luZ1x1MjAyNlwiIDogXCJTY2FuIHZhdWx0XCIsXG4gICAgICBjbHM6IFwibW9kLWN0YVwiLFxuICAgIH0pO1xuICAgIHNjYW5CdG4uZGlzYWJsZWQgPSB0aGlzLmJ1c3k7XG4gICAgc2NhbkJ0bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5ydW5TY2FuKCk7XG5cbiAgICBjb25zdCByZXBvcnRCdG4gPSBiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIldyaXRlIHJlcG9ydFwiIH0pO1xuICAgIHJlcG9ydEJ0bi5kaXNhYmxlZCA9IHRoaXMuYnVzeSB8fCAhdGhpcy5yZXN1bHQ7XG4gICAgcmVwb3J0QnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLnJ1blJlcG9ydCgpO1xuXG4gICAgaWYgKCF0aGlzLnJlc3VsdCkge1xuICAgICAgYy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICBjbHM6IFwiaG0tZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBzY2FuIHlldC4gQ2xpY2sgXHUyMDFDU2NhbiB2YXVsdFx1MjAxRCB0byBmaW5kIGhpZ2hsaWdodHMuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTdW1tYXJ5XG4gICAgY29uc3QgcyA9IHRoaXMucmVzdWx0O1xuICAgIGNvbnN0IHN1bSA9IGMuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXN1bW1hcnlcIiB9KTtcbiAgICBzdW0uY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIHRleHQ6IGAke3MudG90YWxNYXRjaGVzfSBjb252ZXJ0aWJsZSBcdTAwQjcgJHtzLnRvdGFsVW5zYWZlfSB1bnNhZmUgXHUwMEI3ICR7cy5ncm91cHMubGVuZ3RofSBjb2xvdXJzIFx1MDBCNyAke3MuZmlsZUNvdW50fSBub3Rlc2AsXG4gICAgfSk7XG5cbiAgICBpZiAocy5ncm91cHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIGNsczogXCJobS1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBcIk5vIGxlZ2FjeSA8bWFyaz4gaGlnaGxpZ2h0cyBmb3VuZC4gTm90aGluZyB0byBtaWdyYXRlIFx1RDgzQ1x1REY4OVwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGFibGVcbiAgICBjb25zdCB0YWJsZSA9IGMuY3JlYXRlRWwoXCJ0YWJsZVwiLCB7IGNsczogXCJobS10YWJsZVwiIH0pO1xuICAgIGNvbnN0IGhlYWQgPSB0YWJsZS5jcmVhdGVFbChcInRoZWFkXCIpLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgW1wiU2FtcGxlXCIsIFwiU291cmNlXCIsIFwiQ291bnRcIiwgXCJOb3Rlc1wiLCBcIlVuc2FmZVwiLCBcIk1hcCB0b1wiXS5mb3JFYWNoKChoKSA9PlxuICAgICAgaGVhZC5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogaCB9KVxuICAgICk7XG4gICAgY29uc3QgYm9keSA9IHRhYmxlLmNyZWF0ZUVsKFwidGJvZHlcIik7XG5cbiAgICBmb3IgKGNvbnN0IGcgb2Ygcy5ncm91cHMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcblxuICAgICAgLy8gU2FtcGxlIHN3YXRjaFxuICAgICAgY29uc3Qgc2FtcGxlVGQgPSByb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcbiAgICAgIGNvbnN0IHN3ID0gc2FtcGxlVGQuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXN3YXRjaFwiIH0pO1xuICAgICAgaWYgKGcubW9kZSA9PT0gXCJoZXhcIikge1xuICAgICAgICBzdy5zdHlsZS5iYWNrZ3JvdW5kID0gZy5yYXc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdy5hZGRDbGFzcyhcImhtLXN3YXRjaC1jbGFzc1wiKTtcbiAgICAgICAgc3cuc2V0VGV4dChcImNsc1wiKTtcbiAgICAgIH1cblxuICAgICAgcm93LmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiBnLnJhdywgY2xzOiBcImhtLW1vbm9cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogU3RyaW5nKGcuY291bnQpIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiBTdHJpbmcoZy5maWxlcy5zaXplKSB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogZy51bnNhZmUgPyBTdHJpbmcoZy51bnNhZmUpIDogXCJcdTIwMTRcIiB9KTtcblxuICAgICAgLy8gTWFwcGluZyBzZWxlY3RcbiAgICAgIGNvbnN0IG1hcFRkID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICBjb25zdCBzZWwgPSBtYXBUZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJkcm9wZG93biBobS1zZWxlY3RcIiB9KTtcbiAgICAgIGNvbnN0IGFkZE9wdCA9ICh2YWx1ZTogVGFyZ2V0LCBsYWJlbDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG8gPSBzZWwuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgdmFsdWUgfSk7XG4gICAgICAgIGlmICgodGhpcy5tYXBwaW5nW2cua2V5XSA/PyBnLnN1Z2dlc3RlZCkgPT09IHZhbHVlKSBvLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgIH07XG4gICAgICBhZGRPcHQoXCJza2lwXCIsIFwiU2tpcCAobGVhdmUgYXMtaXMpXCIpO1xuICAgICAgYWRkT3B0KFwiZGVmYXVsdFwiLCBcIkRlZmF1bHQgKG5vIGNvbG91cilcIik7XG4gICAgICBmb3IgKGNvbnN0IG5jIG9mIE5BVElWRV9PUkRFUikge1xuICAgICAgICBhZGRPcHQobmMsIGAke05BVElWRV9FTU9KSVtuY119ICR7TkFUSVZFX0xBQkVMW25jXX1gKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZpZXcgY2hpcCBvZiB0aGUgdGFyZ2V0IGVtb2ppXG4gICAgICBjb25zdCBjaGlwID0gbWFwVGQuY3JlYXRlU3Bhbih7IGNsczogXCJobS1jaGlwXCIgfSk7XG4gICAgICBjb25zdCBwYWludENoaXAgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHQgPSB0aGlzLm1hcHBpbmdbZy5rZXldID8/IFwic2tpcFwiO1xuICAgICAgICBpZiAodCA9PT0gXCJza2lwXCIpIGNoaXAuc2V0VGV4dChcIlx1MjAxNFwiKTtcbiAgICAgICAgZWxzZSBpZiAodCA9PT0gXCJkZWZhdWx0XCIpIGNoaXAuc2V0VGV4dChcIj09XHUwMEI3PT1cIik7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNoaXAuc2V0VGV4dChgPT0ke05BVElWRV9FTU9KSVt0XX1cdTIwMjY9PWApO1xuICAgICAgICAgIGNoaXAuc3R5bGUuY29sb3IgPSBOQVRJVkVfU1dBVENIW3RdO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcGFpbnRDaGlwKCk7XG4gICAgICBzZWwub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFwcGluZ1tnLmtleV0gPSBzZWwudmFsdWUgYXMgVGFyZ2V0O1xuICAgICAgICBwYWludENoaXAoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUGxhbigpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBGb290ZXIgLyBwbGFuXG4gICAgY29uc3QgZm9vdGVyID0gYy5jcmVhdGVEaXYoeyBjbHM6IFwiaG0tZm9vdGVyXCIgfSk7XG4gICAgdGhpcy5wbGFuRWwgPSBmb290ZXIuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXBsYW5cIiB9KTtcbiAgICB0aGlzLnJlZnJlc2hQbGFuKCk7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gZm9vdGVyLmNyZWF0ZURpdih7IGNsczogXCJobS1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgYXBwbHlCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQmFjayB1cCAmIGNvbnZlcnRcIixcbiAgICAgIGNsczogXCJtb2QtY3RhXCIsXG4gICAgfSk7XG4gICAgYXBwbHlCdG4uZGlzYWJsZWQgPSB0aGlzLmJ1c3k7XG4gICAgYXBwbHlCdG4ub25jbGljayA9ICgpID0+IHRoaXMucnVuQXBwbHkoKTtcblxuICAgIGNvbnN0IHJldmVydEJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlJldmVydCBsYXN0IG1pZ3JhdGlvblwiIH0pO1xuICAgIHJldmVydEJ0bi5kaXNhYmxlZCA9IHRoaXMuYnVzeTtcbiAgICByZXZlcnRCdG4ub25jbGljayA9ICgpID0+IHRoaXMucGx1Z2luLnJldmVydExhc3QoKTtcbiAgfVxuXG4gIHByaXZhdGUgcGxhbkVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlZnJlc2hQbGFuKCkge1xuICAgIGlmICghdGhpcy5wbGFuRWwpIHJldHVybjtcbiAgICBjb25zdCBwID0gdGhpcy5wbGFubmVkQ291bnRzKCk7XG4gICAgdGhpcy5wbGFuRWwuc2V0VGV4dChcbiAgICAgIGBQbGFuOiBjb252ZXJ0ICR7cC5jb252ZXJ0fSBoaWdobGlnaHQocykgaW4gJHtwLm5vdGVzfSBub3RlKHMpOyBza2lwICR7cC5za2lwfS5gXG4gICAgKTtcbiAgfVxufVxuIiwgIi8vIE5hdGl2ZSBoaWdobGlnaHQgcGFsZXR0ZSAoT2JzaWRpYW4gaW5zaWRlciBjdXN0b20gaGlnaGxpZ2h0IGNvbG91cnMpLlxuLy8gQW5jaG9ycyBhcmUgYXBwcm94aW1hdGUgc1JHQiB2YWx1ZXMgc2FtcGxlZCBmcm9tIHRoZSBjb2xvdXIgcGlja2VyIHN3YXRjaGVzO1xuLy8gdGhleSBvbmx5IGRyaXZlIHRoZSBcIm5lYXJlc3QgY29sb3VyXCIgc3VnZ2VzdGlvbiwgc28gZXhhY3RuZXNzIGlzbid0IGNyaXRpY2FsLlxuXG5leHBvcnQgdHlwZSBOYXRpdmVDb2xvciA9IFwicmVkXCIgfCBcIm9yYW5nZVwiIHwgXCJ5ZWxsb3dcIiB8IFwiZ3JlZW5cIiB8IFwiYmx1ZVwiIHwgXCJwdXJwbGVcIjtcblxuLy8gQSBtYXBwaW5nIHRhcmdldCBpcyBhIG5hdGl2ZSBjb2xvdXIsIFwiZGVmYXVsdFwiIChwbGFpbiA9PXRleHQ9PSB3aXRoIG5vIGVtb2ppKSxcbi8vIG9yIFwic2tpcFwiIChsZWF2ZSB0aGUgb3JpZ2luYWwgPG1hcms+IHVudG91Y2hlZCkuXG5leHBvcnQgdHlwZSBUYXJnZXQgPSBOYXRpdmVDb2xvciB8IFwiZGVmYXVsdFwiIHwgXCJza2lwXCI7XG5cbmV4cG9ydCBjb25zdCBOQVRJVkVfT1JERVI6IE5hdGl2ZUNvbG9yW10gPSBbXG4gIFwicmVkXCIsXG4gIFwib3JhbmdlXCIsXG4gIFwieWVsbG93XCIsXG4gIFwiZ3JlZW5cIixcbiAgXCJibHVlXCIsXG4gIFwicHVycGxlXCIsXG5dO1xuXG5leHBvcnQgY29uc3QgTkFUSVZFX0VNT0pJOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIHN0cmluZz4gPSB7XG4gIHJlZDogXCJcdUQ4M0RcdUREMzRcIixcbiAgb3JhbmdlOiBcIlx1RDgzRFx1REZFMFwiLFxuICB5ZWxsb3c6IFwiXHVEODNEXHVERkUxXCIsXG4gIGdyZWVuOiBcIlx1RDgzRFx1REZFMlwiLFxuICBibHVlOiBcIlx1RDgzRFx1REQzNVwiLFxuICBwdXJwbGU6IFwiXHVEODNEXHVERkUzXCIsXG59O1xuXG5leHBvcnQgY29uc3QgTkFUSVZFX0xBQkVMOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIHN0cmluZz4gPSB7XG4gIHJlZDogXCJSZWRcIixcbiAgb3JhbmdlOiBcIk9yYW5nZVwiLFxuICB5ZWxsb3c6IFwiWWVsbG93XCIsXG4gIGdyZWVuOiBcIkdyZWVuXCIsXG4gIGJsdWU6IFwiQmx1ZVwiLFxuICBwdXJwbGU6IFwiUHVycGxlXCIsXG59O1xuXG4vLyBQcmV2aWV3IHN3YXRjaCBjb2xvdXJzIGZvciB0aGUgcmV2aWV3IHRhYmxlLlxuZXhwb3J0IGNvbnN0IE5BVElWRV9TV0FUQ0g6IFJlY29yZDxOYXRpdmVDb2xvciwgc3RyaW5nPiA9IHtcbiAgcmVkOiBcIiNmYjQ2NGNcIixcbiAgb3JhbmdlOiBcIiNlOTk3M2ZcIixcbiAgeWVsbG93OiBcIiNlMGRlNzFcIixcbiAgZ3JlZW46IFwiIzQ0Y2Y2ZVwiLFxuICBibHVlOiBcIiMwODZkZGRcIixcbiAgcHVycGxlOiBcIiNhODgyZmZcIixcbn07XG5cbmNvbnN0IE5BVElWRV9BTkNIT1JTOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXT4gPSB7XG4gIHJlZDogWzB4ZmIsIDB4NDYsIDB4NGNdLFxuICBvcmFuZ2U6IFsweGU5LCAweDk3LCAweDNmXSxcbiAgeWVsbG93OiBbMHhlMCwgMHhkZSwgMHg3MV0sXG4gIGdyZWVuOiBbMHg0NCwgMHhjZiwgMHg2ZV0sXG4gIGJsdWU6IFsweDA4LCAweDZkLCAweGRkXSxcbiAgcHVycGxlOiBbMHhhOCwgMHg4MiwgMHhmZl0sXG59O1xuXG5leHBvcnQgdHlwZSBSR0IgPSBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG5cbi8qKiBQYXJzZSBcIiNSUkdHQkJcIiBvciBcIiNSUkdHQkJBQVwiIGludG8gYmFzZSBSR0IgKGFscGhhIGRyb3BwZWQpLiBOdWxsIGlmIGludmFsaWQuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIZXgoaGV4OiBzdHJpbmcpOiBSR0IgfCBudWxsIHtcbiAgY29uc3QgaCA9IGhleC5yZXBsYWNlKC9eIy8sIFwiXCIpO1xuICBpZiAoaC5sZW5ndGggPCA2KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgciA9IHBhcnNlSW50KGguc2xpY2UoMCwgMiksIDE2KTtcbiAgY29uc3QgZyA9IHBhcnNlSW50KGguc2xpY2UoMiwgNCksIDE2KTtcbiAgY29uc3QgYiA9IHBhcnNlSW50KGguc2xpY2UoNCwgNiksIDE2KTtcbiAgaWYgKFtyLCBnLCBiXS5zb21lKChuKSA9PiBOdW1iZXIuaXNOYU4obikpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIFtyLCBnLCBiXTtcbn1cblxuZnVuY3Rpb24gc3JnYlRvTGluZWFyKGM6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHggPSBjIC8gMjU1O1xuICByZXR1cm4geCA8PSAwLjA0MDQ1ID8geCAvIDEyLjkyIDogTWF0aC5wb3coKHggKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbn1cblxuZnVuY3Rpb24gcmdiVG9MYWIoW3IsIGcsIGJdOiBSR0IpOiBSR0Ige1xuICBjb25zdCBSID0gc3JnYlRvTGluZWFyKHIpO1xuICBjb25zdCBHID0gc3JnYlRvTGluZWFyKGcpO1xuICBjb25zdCBCID0gc3JnYlRvTGluZWFyKGIpO1xuICBsZXQgWCA9IFIgKiAwLjQxMjQgKyBHICogMC4zNTc2ICsgQiAqIDAuMTgwNTtcbiAgbGV0IFkgPSBSICogMC4yMTI2ICsgRyAqIDAuNzE1MiArIEIgKiAwLjA3MjI7XG4gIGxldCBaID0gUiAqIDAuMDE5MyArIEcgKiAwLjExOTIgKyBCICogMC45NTA1O1xuICBYIC89IDAuOTUwNDc7XG4gIFogLz0gMS4wODg4MztcbiAgY29uc3QgZiA9ICh0OiBudW1iZXIpID0+ICh0ID4gMC4wMDg4NTYgPyBNYXRoLmNicnQodCkgOiA3Ljc4NyAqIHQgKyAxNiAvIDExNik7XG4gIGNvbnN0IGZ4ID0gZihYKTtcbiAgY29uc3QgZnkgPSBmKFkpO1xuICBjb25zdCBmeiA9IGYoWik7XG4gIHJldHVybiBbMTE2ICogZnkgLSAxNiwgNTAwICogKGZ4IC0gZnkpLCAyMDAgKiAoZnkgLSBmeildO1xufVxuXG5jb25zdCBBTkNIT1JfTEFCOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIFJHQj4gPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gIE5BVElWRV9PUkRFUi5tYXAoKGspID0+IFtrLCByZ2JUb0xhYihOQVRJVkVfQU5DSE9SU1trXSldKVxuKSBhcyBSZWNvcmQ8TmF0aXZlQ29sb3IsIFJHQj47XG5cbi8vIEhpZ2hsaWdodHIncyBzdG9jayBwYXN0ZWwgcGFsZXR0ZSBtYXBzIDE6MSB0byBuYXRpdmUgY29sb3Vycy4gVGhlc2UgcGFzdGVsc1xuLy8gYXJlIGRlc2F0dXJhdGVkLCBzbyBwbGFpbiBuZWFyZXN0LWFuY2hvciBtYXRjaGluZyBtaXNmaXJlcyAoZS5nLiBwYWxlIGdyZWVuXG4vLyAjQkJGQUJCIGxhbmRzIG5lYXJlciB0aGUgeWVsbG93IGFuY2hvcikuIE1hdGNoIHRoZSBrbm93biBkZWZhdWx0cyBleGFjdGx5XG4vLyBmaXJzdCwgYnkgYmFzZSBSR0IgKGFscGhhIGlnbm9yZWQpLCBiZWZvcmUgZmFsbGluZyBiYWNrIHRvIG5lYXJlc3QoKS5cbmNvbnN0IEtOT1dOX0hJR0hMSUdIVFI6IFJlY29yZDxzdHJpbmcsIE5hdGl2ZUNvbG9yPiA9IHtcbiAgRkY1NTgyOiBcInJlZFwiLFxuICBGRkI4NkM6IFwib3JhbmdlXCIsXG4gIEZGRjNBMzogXCJ5ZWxsb3dcIixcbiAgQkJGQUJCOiBcImdyZWVuXCIsXG4gIEFEQ0NGRjogXCJibHVlXCIsXG4gIEQyQjNGRjogXCJwdXJwbGVcIixcbn07XG5cbi8qKiBFeGFjdCBtYXRjaCBmb3IgYSBrbm93biBIaWdobGlnaHRyIGRlZmF1bHQgY29sb3VyLCBvciBudWxsLiBgaGV4YCBtYXkgaW5jbHVkZSAjL2FscGhhLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtub3duSGlnaGxpZ2h0ckNvbG9yKGhleDogc3RyaW5nKTogTmF0aXZlQ29sb3IgfCBudWxsIHtcbiAgY29uc3QgYmFzZSA9IGhleC5yZXBsYWNlKC9eIy8sIFwiXCIpLnNsaWNlKDAsIDYpLnRvVXBwZXJDYXNlKCk7XG4gIHJldHVybiBLTk9XTl9ISUdITElHSFRSW2Jhc2VdID8/IG51bGw7XG59XG5cbi8qKiBOZWFyZXN0IG5hdGl2ZSBjb2xvdXIgdG8gYW4gUkdCLCBieSBDSUU3NiBMYWIgZGlzdGFuY2UuICovXG5leHBvcnQgZnVuY3Rpb24gbmVhcmVzdE5hdGl2ZShyZ2I6IFJHQik6IE5hdGl2ZUNvbG9yIHtcbiAgY29uc3QgbGFiID0gcmdiVG9MYWIocmdiKTtcbiAgbGV0IGJlc3Q6IE5hdGl2ZUNvbG9yID0gXCJ5ZWxsb3dcIjtcbiAgbGV0IGJlc3REID0gSW5maW5pdHk7XG4gIGZvciAoY29uc3QgayBvZiBOQVRJVkVfT1JERVIpIHtcbiAgICBjb25zdCBhID0gQU5DSE9SX0xBQltrXTtcbiAgICBjb25zdCBkID0gKGxhYlswXSAtIGFbMF0pICoqIDIgKyAobGFiWzFdIC0gYVsxXSkgKiogMiArIChsYWJbMl0gLSBhWzJdKSAqKiAyO1xuICAgIGlmIChkIDwgYmVzdEQpIHtcbiAgICAgIGJlc3REID0gZDtcbiAgICAgIGJlc3QgPSBrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYmVzdDtcbn1cblxuLyoqIEJlc3QtZ3Vlc3MgbmF0aXZlIGNvbG91ciBmcm9tIGEgSGlnaGxpZ2h0ciBjbGFzcyBuYW1lIGxpa2UgXCJobHRyLW9yYW5nZVwiLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGd1ZXNzRnJvbUNsYXNzKGNsczogc3RyaW5nKTogTmF0aXZlQ29sb3IgfCBudWxsIHtcbiAgY29uc3QgbiA9IGNscy50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCB0YWJsZTogW3N0cmluZywgTmF0aXZlQ29sb3JdW10gPSBbXG4gICAgW1wicGlua1wiLCBcInJlZFwiXSxcbiAgICBbXCJyb3NlXCIsIFwicmVkXCJdLFxuICAgIFtcInJlZFwiLCBcInJlZFwiXSxcbiAgICBbXCJvcmFuZ2VcIiwgXCJvcmFuZ2VcIl0sXG4gICAgW1wiYW1iZXJcIiwgXCJvcmFuZ2VcIl0sXG4gICAgW1wieWVsbG93XCIsIFwieWVsbG93XCJdLFxuICAgIFtcImdvbGRcIiwgXCJ5ZWxsb3dcIl0sXG4gICAgW1wiZ3JlZW5cIiwgXCJncmVlblwiXSxcbiAgICBbXCJsaW1lXCIsIFwiZ3JlZW5cIl0sXG4gICAgW1widGVhbFwiLCBcImdyZWVuXCJdLFxuICAgIFtcImJsdWVcIiwgXCJibHVlXCJdLFxuICAgIFtcImN5YW5cIiwgXCJibHVlXCJdLFxuICAgIFtcInB1cnBsZVwiLCBcInB1cnBsZVwiXSxcbiAgICBbXCJ2aW9sZXRcIiwgXCJwdXJwbGVcIl0sXG4gICAgW1wibWFnZW50YVwiLCBcInB1cnBsZVwiXSxcbiAgXTtcbiAgZm9yIChjb25zdCBbbmVlZGxlLCBjb2xdIG9mIHRhYmxlKSBpZiAobi5pbmNsdWRlcyhuZWVkbGUpKSByZXR1cm4gY29sO1xuICByZXR1cm4gbnVsbDtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIG5vcm1hbGl6ZVBhdGgsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXJnZXQgfSBmcm9tIFwiLi9jb2xvcnNcIjtcbmltcG9ydCB7IGNvbnZlcnRUZXh0LCBzY2FuVGV4dCwgYnVpbGRTY2FuUmVzdWx0LCBTY2FuUmVzdWx0IH0gZnJvbSBcIi4vc2NhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGlvbk1hbmlmZXN0IHtcbiAgcGx1Z2luOiBcImhpZ2hsaWdodC1taWdyYXRvclwiO1xuICB2ZXJzaW9uOiAxO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgYmFja3VwRm9sZGVyOiBzdHJpbmc7XG4gIGluY2x1ZGVDbGFzczogYm9vbGVhbjtcbiAgbWFwcGluZzogUmVjb3JkPHN0cmluZywgVGFyZ2V0PjtcbiAgZmlsZXM6IHsgcGF0aDogc3RyaW5nOyBiYWNrdXA6IHN0cmluZzsgY2hhbmdlZDogbnVtYmVyIH1bXTtcbiAgdG90YWxDaGFuZ2VkOiBudW1iZXI7XG4gIHRvdGFsU2tpcHBlZDogbnVtYmVyO1xufVxuXG5jb25zdCBNQU5JRkVTVF9OQU1FID0gXCJtYW5pZmVzdC5qc29uXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZvbGRlcihhcHA6IEFwcCwgZm9sZGVyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcGFydHMgPSBub3JtYWxpemVQYXRoKGZvbGRlcikuc3BsaXQoXCIvXCIpO1xuICBsZXQgY3VyID0gXCJcIjtcbiAgZm9yIChjb25zdCBwIG9mIHBhcnRzKSB7XG4gICAgaWYgKCFwKSBjb250aW51ZTtcbiAgICBjdXIgPSBjdXIgPyBgJHtjdXJ9LyR7cH1gIDogcDtcbiAgICBpZiAoIWFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VyKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXIpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyBJZ25vcmUgXCJhbHJlYWR5IGV4aXN0c1wiIHJhY2VzLlxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogRmluZCBhIGJhY2t1cCBmb2xkZXIgbmFtZSB0aGF0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1bmlxdWVCYWNrdXBGb2xkZXIoYXBwOiBBcHAsIGJhc2U6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHN0YW1wID0gbmV3IERhdGUoKVxuICAgIC50b0lTT1N0cmluZygpXG4gICAgLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpXG4gICAgLnJlcGxhY2UoXCJUXCIsIFwiX1wiKVxuICAgIC5zbGljZSgwLCAxOSk7XG4gIGxldCBjYW5kaWRhdGUgPSBub3JtYWxpemVQYXRoKGAke2Jhc2V9LyR7c3RhbXB9YCk7XG4gIGxldCBuID0gMjtcbiAgd2hpbGUgKGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY2FuZGlkYXRlKSkge1xuICAgIGNhbmRpZGF0ZSA9IG5vcm1hbGl6ZVBhdGgoYCR7YmFzZX0vJHtzdGFtcH0tJHtuKyt9YCk7XG4gIH1cbiAgcmV0dXJuIGNhbmRpZGF0ZTtcbn1cblxuLyoqIEFsbCBtYXJrZG93biBmaWxlcyBpbiB0aGUgdmF1bHQuICovXG5mdW5jdGlvbiBtYXJrZG93bkZpbGVzKGFwcDogQXBwKTogVEZpbGVbXSB7XG4gIHJldHVybiBhcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xufVxuXG4vKiogU2NhbiB0aGUgd2hvbGUgdmF1bHQgYW5kIHJldHVybiBncm91cGVkIHJlc3VsdHMuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhblZhdWx0KFxuICBhcHA6IEFwcCxcbiAgaW5jbHVkZUNsYXNzOiBib29sZWFuLFxuICBza2lwRm9sZGVyczogc3RyaW5nW11cbik6IFByb21pc2U8U2NhblJlc3VsdD4ge1xuICBjb25zdCBmaWxlcyA9IG1hcmtkb3duRmlsZXMoYXBwKS5maWx0ZXIoXG4gICAgKGYpID0+ICFza2lwRm9sZGVycy5zb21lKChzKSA9PiBzICYmIGYucGF0aC5zdGFydHNXaXRoKHMgKyBcIi9cIikpXG4gICk7XG4gIGNvbnN0IHNjYW5uZWQ6IHsgcGF0aDogc3RyaW5nOyBzY2FuOiBSZXR1cm5UeXBlPHR5cGVvZiBzY2FuVGV4dD4gfVtdID0gW107XG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGNvbnN0IHRleHQgPSBhd2FpdCBhcHAudmF1bHQuY2FjaGVkUmVhZChmKTtcbiAgICBpZiAoIXRleHQuaW5jbHVkZXMoXCI8bWFya1wiKSkgY29udGludWU7XG4gICAgY29uc3Qgc2NhbiA9IHNjYW5UZXh0KHRleHQsIGluY2x1ZGVDbGFzcyk7XG4gICAgaWYgKHNjYW4uc2l6ZSA+IDApIHNjYW5uZWQucHVzaCh7IHBhdGg6IGYucGF0aCwgc2NhbiB9KTtcbiAgfVxuICByZXR1cm4gYnVpbGRTY2FuUmVzdWx0KHNjYW5uZWQpO1xufVxuXG4vKipcbiAqIEJhY2sgdXAgZXZlcnkgZmlsZSB0aGF0IHdpbGwgYWN0dWFsbHkgY2hhbmdlIHVuZGVyIGBtYXBwaW5nYCwgdGhlbiByZXdyaXRlIGl0LlxuICogUmV0dXJucyB0aGUgbWFuaWZlc3QgKGFsc28gd3JpdHRlbiB0byA8YmFja3VwRm9sZGVyPi9tYW5pZmVzdC5qc29uKS5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGx5TWlncmF0aW9uKFxuICBhcHA6IEFwcCxcbiAgbWFwcGluZzogUmVjb3JkPHN0cmluZywgVGFyZ2V0PixcbiAgaW5jbHVkZUNsYXNzOiBib29sZWFuLFxuICBiYWNrdXBCYXNlOiBzdHJpbmcsXG4gIHNraXBGb2xkZXJzOiBzdHJpbmdbXVxuKTogUHJvbWlzZTxNaWdyYXRpb25NYW5pZmVzdD4ge1xuICBjb25zdCBiYWNrdXBGb2xkZXIgPSBhd2FpdCB1bmlxdWVCYWNrdXBGb2xkZXIoYXBwLCBiYWNrdXBCYXNlKTtcbiAgY29uc3QgZmlsZXMgPSBtYXJrZG93bkZpbGVzKGFwcCkuZmlsdGVyKFxuICAgIChmKSA9PlxuICAgICAgIXNraXBGb2xkZXJzLnNvbWUoKHMpID0+IHMgJiYgZi5wYXRoLnN0YXJ0c1dpdGgocyArIFwiL1wiKSkgJiZcbiAgICAgICFmLnBhdGguc3RhcnRzV2l0aChiYWNrdXBCYXNlICsgXCIvXCIpXG4gICk7XG5cbiAgY29uc3QgbWFuaWZlc3Q6IE1pZ3JhdGlvbk1hbmlmZXN0ID0ge1xuICAgIHBsdWdpbjogXCJoaWdobGlnaHQtbWlncmF0b3JcIixcbiAgICB2ZXJzaW9uOiAxLFxuICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGJhY2t1cEZvbGRlcixcbiAgICBpbmNsdWRlQ2xhc3MsXG4gICAgbWFwcGluZyxcbiAgICBmaWxlczogW10sXG4gICAgdG90YWxDaGFuZ2VkOiAwLFxuICAgIHRvdGFsU2tpcHBlZDogMCxcbiAgfTtcblxuICBsZXQgY3JlYXRlZEJhY2t1cFJvb3QgPSBmYWxzZTtcblxuICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpIHtcbiAgICBjb25zdCBvcmlnaW5hbCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGYpO1xuICAgIGlmICghb3JpZ2luYWwuaW5jbHVkZXMoXCI8bWFya1wiKSkgY29udGludWU7XG4gICAgY29uc3QgeyBvdXQsIGNoYW5nZWQsIHNraXBwZWQgfSA9IGNvbnZlcnRUZXh0KG9yaWdpbmFsLCBtYXBwaW5nLCBpbmNsdWRlQ2xhc3MpO1xuICAgIG1hbmlmZXN0LnRvdGFsU2tpcHBlZCArPSBza2lwcGVkO1xuICAgIGlmIChjaGFuZ2VkID09PSAwIHx8IG91dCA9PT0gb3JpZ2luYWwpIGNvbnRpbnVlO1xuXG4gICAgaWYgKCFjcmVhdGVkQmFja3VwUm9vdCkge1xuICAgICAgYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYmFja3VwRm9sZGVyKTtcbiAgICAgIGNyZWF0ZWRCYWNrdXBSb290ID0gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgYmFja3VwUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7YmFja3VwRm9sZGVyfS8ke2YucGF0aH1gKTtcbiAgICBjb25zdCBiYWNrdXBEaXIgPSBiYWNrdXBQYXRoLnNwbGl0KFwiL1wiKS5zbGljZSgwLCAtMSkuam9pbihcIi9cIik7XG4gICAgYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgYmFja3VwRGlyKTtcbiAgICAvLyBDb3B5IHRoZSB1bnRvdWNoZWQgb3JpZ2luYWwgaW50byB0aGUgYmFja3VwIHRyZWUuXG4gICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShiYWNrdXBQYXRoLCBvcmlnaW5hbCk7XG4gICAgLy8gVGhlbiByZXdyaXRlIHRoZSBsaXZlIG5vdGUuXG4gICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeShmLCBvdXQpO1xuXG4gICAgbWFuaWZlc3QuZmlsZXMucHVzaCh7IHBhdGg6IGYucGF0aCwgYmFja3VwOiBiYWNrdXBQYXRoLCBjaGFuZ2VkIH0pO1xuICAgIG1hbmlmZXN0LnRvdGFsQ2hhbmdlZCArPSBjaGFuZ2VkO1xuICB9XG5cbiAgaWYgKG1hbmlmZXN0LmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBtYW5pZmVzdFBhdGggPSBub3JtYWxpemVQYXRoKGAke2JhY2t1cEZvbGRlcn0vJHtNQU5JRkVTVF9OQU1FfWApO1xuICAgIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUobWFuaWZlc3RQYXRoLCBKU09OLnN0cmluZ2lmeShtYW5pZmVzdCwgbnVsbCwgMikpO1xuICB9XG4gIHJldHVybiBtYW5pZmVzdDtcbn1cblxuLyoqIExpc3QgYmFja3VwIGZvbGRlcnMgdGhhdCBjb250YWluIGEgbWFuaWZlc3QsIG5ld2VzdCBmaXJzdC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0TWFuaWZlc3RzKFxuICBhcHA6IEFwcCxcbiAgYmFja3VwQmFzZTogc3RyaW5nXG4pOiBQcm9taXNlPHsgZm9sZGVyOiBzdHJpbmc7IG1hbmlmZXN0OiBNaWdyYXRpb25NYW5pZmVzdCB9W10+IHtcbiAgY29uc3Qgb3V0OiB7IGZvbGRlcjogc3RyaW5nOyBtYW5pZmVzdDogTWlncmF0aW9uTWFuaWZlc3QgfVtdID0gW107XG4gIGNvbnN0IHJvb3QgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoYmFja3VwQmFzZSkpO1xuICBpZiAoIXJvb3QpIHJldHVybiBvdXQ7XG4gIGNvbnN0IGNoaWxkcmVuID0gKHJvb3QgYXMgYW55KS5jaGlsZHJlbiA/PyBbXTtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgIGNvbnN0IG1mUGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7Y2hpbGQucGF0aH0vJHtNQU5JRkVTVF9OQU1FfWApO1xuICAgIGNvbnN0IG1mID0gYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChtZlBhdGgpO1xuICAgIGlmIChtZiBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkYXRhID0gSlNPTi5wYXJzZShhd2FpdCBhcHAudmF1bHQucmVhZChtZikpIGFzIE1pZ3JhdGlvbk1hbmlmZXN0O1xuICAgICAgICBvdXQucHVzaCh7IGZvbGRlcjogY2hpbGQucGF0aCwgbWFuaWZlc3Q6IGRhdGEgfSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIC8vIFNraXAgdW5yZWFkYWJsZSBtYW5pZmVzdC5cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgb3V0LnNvcnQoKGEsIGIpID0+IGIubWFuaWZlc3QuY3JlYXRlZEF0LmxvY2FsZUNvbXBhcmUoYS5tYW5pZmVzdC5jcmVhdGVkQXQpKTtcbiAgcmV0dXJuIG91dDtcbn1cblxuLyoqIFJlc3RvcmUgZXZlcnkgZmlsZSByZWNvcmRlZCBpbiBhIG1hbmlmZXN0IGZyb20gaXRzIGJhY2t1cCBjb3B5LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldmVydE1pZ3JhdGlvbihcbiAgYXBwOiBBcHAsXG4gIG1hbmlmZXN0OiBNaWdyYXRpb25NYW5pZmVzdFxuKTogUHJvbWlzZTx7IHJlc3RvcmVkOiBudW1iZXI7IG1pc3Npbmc6IHN0cmluZ1tdIH0+IHtcbiAgbGV0IHJlc3RvcmVkID0gMDtcbiAgY29uc3QgbWlzc2luZzogc3RyaW5nW10gPSBbXTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBtYW5pZmVzdC5maWxlcykge1xuICAgIGNvbnN0IGJhY2t1cCA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChlbnRyeS5iYWNrdXApKTtcbiAgICBpZiAoIShiYWNrdXAgaW5zdGFuY2VvZiBURmlsZSkpIHtcbiAgICAgIG1pc3NpbmcucHVzaChlbnRyeS5iYWNrdXApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChiYWNrdXApO1xuICAgIGNvbnN0IHRhcmdldCA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChlbnRyeS5wYXRoKSk7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KHRhcmdldCwgY29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGRpciA9IGVudHJ5LnBhdGguc3BsaXQoXCIvXCIpLnNsaWNlKDAsIC0xKS5qb2luKFwiL1wiKTtcbiAgICAgIGlmIChkaXIpIGF3YWl0IGVuc3VyZUZvbGRlcihhcHAsIGRpcik7XG4gICAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGVudHJ5LnBhdGgsIGNvbnRlbnQpO1xuICAgIH1cbiAgICByZXN0b3JlZCsrO1xuICB9XG4gIHJldHVybiB7IHJlc3RvcmVkLCBtaXNzaW5nIH07XG59XG5cbi8qKiBXcml0ZSBhIGh1bWFuLXJlYWRhYmxlICsgSlNPTiBzY2FuIHJlcG9ydCBub3RlOyByZXR1cm5zIGl0cyBwYXRoLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlUmVwb3J0KFxuICBhcHA6IEFwcCxcbiAgcmVzdWx0OiBTY2FuUmVzdWx0LFxuICByZXBvcnRGb2xkZXI6IHN0cmluZyxcbiAgbWFwcGluZzogUmVjb3JkPHN0cmluZywgVGFyZ2V0PlxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgYXdhaXQgZW5zdXJlRm9sZGVyKGFwcCwgcmVwb3J0Rm9sZGVyKTtcbiAgY29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpXG4gICAgLnRvSVNPU3RyaW5nKClcbiAgICAucmVwbGFjZSgvWzouXS9nLCBcIi1cIilcbiAgICAucmVwbGFjZShcIlRcIiwgXCJfXCIpXG4gICAgLnNsaWNlKDAsIDE5KTtcbiAgLy8gQXZvaWQgY2xvYmJlcmluZyBhbiBleGlzdGluZyByZXBvcnQgaWYgdHdvIHJ1biBpbiB0aGUgc2FtZSBzZWNvbmQuXG4gIGxldCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHtyZXBvcnRGb2xkZXJ9L0hpZ2hsaWdodCBzY2FuICR7c3RhbXB9Lm1kYCk7XG4gIGxldCBuID0gMjtcbiAgd2hpbGUgKGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCkpIHtcbiAgICBwYXRoID0gbm9ybWFsaXplUGF0aChgJHtyZXBvcnRGb2xkZXJ9L0hpZ2hsaWdodCBzY2FuICR7c3RhbXB9LSR7bisrfS5tZGApO1xuICB9XG5cbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW107XG4gIGxpbmVzLnB1c2goXCIjIEhpZ2hsaWdodCBzY2FuIHJlcG9ydFwiLCBcIlwiKTtcbiAgbGluZXMucHVzaChgLSBTY2FubmVkOiAke3N0YW1wfWApO1xuICBsaW5lcy5wdXNoKGAtIERpc3RpbmN0IGNvbG91cnM6ICR7cmVzdWx0Lmdyb3Vwcy5sZW5ndGh9YCk7XG4gIGxpbmVzLnB1c2goYC0gQ29udmVydGlibGUgaGlnaGxpZ2h0czogJHtyZXN1bHQudG90YWxNYXRjaGVzfWApO1xuICBsaW5lcy5wdXNoKGAtIFVuc2FmZSAoc2tpcHBlZCkgaGlnaGxpZ2h0czogJHtyZXN1bHQudG90YWxVbnNhZmV9YCk7XG4gIGxpbmVzLnB1c2goYC0gQWZmZWN0ZWQgbm90ZXM6ICR7cmVzdWx0LmZpbGVDb3VudH1gLCBcIlwiKTtcbiAgbGluZXMucHVzaChcIiMjIENvbG91cnNcIiwgXCJcIik7XG4gIGZvciAoY29uc3QgZyBvZiByZXN1bHQuZ3JvdXBzKSB7XG4gICAgY29uc3QgdGFyZ2V0ID0gbWFwcGluZ1tnLmtleV0gPz8gZy5zdWdnZXN0ZWQ7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGAtICoqJHtnLnJhd30qKiAoJHtnLm1vZGV9KSBcdTIxOTIgXFxgJHt0YXJnZXR9XFxgIFx1MjAxNCAke2cuY291bnR9IGhpZ2hsaWdodChzKWAgK1xuICAgICAgICAoZy51bnNhZmUgPyBgLCAke2cudW5zYWZlfSB1bnNhZmVgIDogXCJcIikgK1xuICAgICAgICBgIGFjcm9zcyAke2cuZmlsZXMuc2l6ZX0gbm90ZShzKWBcbiAgICApO1xuICAgIGZvciAoY29uc3QgZmlsZSBvZiBbLi4uZy5maWxlc10uc29ydCgpKSBsaW5lcy5wdXNoKGAgIC0gJHtmaWxlfWApO1xuICB9XG4gIGxpbmVzLnB1c2goXCJcIiwgXCIjIyBNYWNoaW5lLXJlYWRhYmxlXCIsIFwiXCIsIFwiYGBganNvblwiKTtcbiAgbGluZXMucHVzaChcbiAgICBKU09OLnN0cmluZ2lmeShcbiAgICAgIHtcbiAgICAgICAgc2Nhbm5lZEF0OiBzdGFtcCxcbiAgICAgICAgdG90YWxzOiB7XG4gICAgICAgICAgZGlzdGluY3RDb2xvdXJzOiByZXN1bHQuZ3JvdXBzLmxlbmd0aCxcbiAgICAgICAgICBjb252ZXJ0aWJsZTogcmVzdWx0LnRvdGFsTWF0Y2hlcyxcbiAgICAgICAgICB1bnNhZmU6IHJlc3VsdC50b3RhbFVuc2FmZSxcbiAgICAgICAgICBhZmZlY3RlZE5vdGVzOiByZXN1bHQuZmlsZUNvdW50LFxuICAgICAgICB9LFxuICAgICAgICBjb2xvdXJzOiByZXN1bHQuZ3JvdXBzLm1hcCgoZykgPT4gKHtcbiAgICAgICAgICBrZXk6IGcua2V5LFxuICAgICAgICAgIHJhdzogZy5yYXcsXG4gICAgICAgICAgbW9kZTogZy5tb2RlLFxuICAgICAgICAgIGNvdW50OiBnLmNvdW50LFxuICAgICAgICAgIHVuc2FmZTogZy51bnNhZmUsXG4gICAgICAgICAgc3VnZ2VzdGVkOiBnLnN1Z2dlc3RlZCxcbiAgICAgICAgICB0YXJnZXQ6IG1hcHBpbmdbZy5rZXldID8/IGcuc3VnZ2VzdGVkLFxuICAgICAgICAgIGZpbGVzOiBbLi4uZy5maWxlc10uc29ydCgpLFxuICAgICAgICB9KSksXG4gICAgICB9LFxuICAgICAgbnVsbCxcbiAgICAgIDJcbiAgICApXG4gICk7XG4gIGxpbmVzLnB1c2goXCJgYGBcIiwgXCJcIik7XG5cbiAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShwYXRoLCBsaW5lcy5qb2luKFwiXFxuXCIpKTtcbiAgcmV0dXJuIHBhdGg7XG59XG4iLCAiaW1wb3J0IHtcbiAgTmF0aXZlQ29sb3IsXG4gIFRhcmdldCxcbiAgTkFUSVZFX0VNT0pJLFxuICBwYXJzZUhleCxcbiAgbmVhcmVzdE5hdGl2ZSxcbiAga25vd25IaWdobGlnaHRyQ29sb3IsXG4gIGd1ZXNzRnJvbUNsYXNzLFxuICBSR0IsXG59IGZyb20gXCIuL2NvbG9yc1wiO1xuXG5leHBvcnQgdHlwZSBNb2RlID0gXCJoZXhcIiB8IFwiY2xhc3NcIjtcblxuLy8gT25lIGRpc3RpbmN0IHNvdXJjZSBjb2xvdXIgZm91bmQgYWNyb3NzIHRoZSB2YXVsdC5cbmV4cG9ydCBpbnRlcmZhY2UgQ29sb3JHcm91cCB7XG4gIGtleTogc3RyaW5nOyAvLyBcIiNSUkdHQkJBQVwiICh1cHBlcikgZm9yIGhleCwgb3IgXCJobHRyLXh4eFwiIGZvciBjbGFzc1xuICBtb2RlOiBNb2RlO1xuICByZ2I6IFJHQiB8IG51bGw7IC8vIGZvciBoZXggZ3JvdXBzXG4gIHJhdzogc3RyaW5nOyAvLyByZXByZXNlbnRhdGl2ZSByYXcgdmFsdWUgKG9yaWdpbmFsIGhleCBpbmNsLiBhbHBoYSwgb3IgY2xhc3MpXG4gIGNvdW50OiBudW1iZXI7IC8vIGNvbnZlcnRpYmxlIG9jY3VycmVuY2VzXG4gIHVuc2FmZTogbnVtYmVyOyAvLyBvY2N1cnJlbmNlcyBza2lwcGVkIGFzIHJpc2t5IChtdWx0aWxpbmUgLyBjb250YWlucyA9PSlcbiAgZmlsZXM6IFNldDxzdHJpbmc+O1xuICBzdWdnZXN0ZWQ6IFRhcmdldDsgLy8gbmVhcmVzdC1jb2xvdXIgc3VnZ2VzdGlvblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjYW5SZXN1bHQge1xuICBncm91cHM6IENvbG9yR3JvdXBbXTtcbiAgdG90YWxNYXRjaGVzOiBudW1iZXI7XG4gIHRvdGFsVW5zYWZlOiBudW1iZXI7XG4gIGZpbGVDb3VudDogbnVtYmVyO1xufVxuXG4vLyBNYXRjaCBhbnkgPG1hcmsgLi4uPi4uLjwvbWFyaz4uIE5vbi1ncmVlZHkgaW5uZXIgc28gYWRqYWNlbnQgbWFya3Mgc3RheSBzZXBhcmF0ZS5cbmNvbnN0IE1BUktfUkUgPSAvPG1hcmtcXGIoW14+XSopPihbXFxzXFxTXSo/KTxcXC9tYXJrPi9naTtcblxuaW50ZXJmYWNlIENsYXNzaWZpZWQge1xuICBtb2RlOiBNb2RlO1xuICBrZXk6IHN0cmluZztcbiAgcmF3OiBzdHJpbmc7XG4gIHJnYjogUkdCIHwgbnVsbDtcbn1cblxuLyoqIElkZW50aWZ5IGEgPG1hcms+J3MgY29sb3VyIGZyb20gaXRzIGF0dHJpYnV0ZSBzdHJpbmcuIEhleCB3aW5zIG92ZXIgY2xhc3MuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnkoYXR0cnM6IHN0cmluZywgaW5jbHVkZUNsYXNzOiBib29sZWFuKTogQ2xhc3NpZmllZCB8IG51bGwge1xuICBjb25zdCBzdHlsZU0gPSBhdHRycy5tYXRjaCgvc3R5bGVcXHMqPVxccypcIihbXlwiXSopXCIvaSk7XG4gIGlmIChzdHlsZU0pIHtcbiAgICBjb25zdCBiZyA9IHN0eWxlTVsxXS5tYXRjaChcbiAgICAgIC9iYWNrZ3JvdW5kKD86LWNvbG9yKT9cXHMqOlxccyooI1swLTlBLUZhLWZdezYsOH0pL2lcbiAgICApO1xuICAgIGlmIChiZykge1xuICAgICAgY29uc3QgcmF3ID0gYmdbMV07XG4gICAgICBjb25zdCBrZXkgPSBcIiNcIiArIHJhdy5zbGljZSgxKS50b1VwcGVyQ2FzZSgpO1xuICAgICAgcmV0dXJuIHsgbW9kZTogXCJoZXhcIiwga2V5LCByYXcsIHJnYjogcGFyc2VIZXgocmF3KSB9O1xuICAgIH1cbiAgfVxuICBpZiAoaW5jbHVkZUNsYXNzKSB7XG4gICAgY29uc3QgY2xhc3NNID0gYXR0cnMubWF0Y2goL2NsYXNzXFxzKj1cXHMqXCIoW15cIl0qKVwiL2kpO1xuICAgIGlmIChjbGFzc00pIHtcbiAgICAgIGNvbnN0IGggPSBjbGFzc01bMV0ubWF0Y2goL2hsdHItW2EtejAtOS1dKy9pKTtcbiAgICAgIGlmIChoKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGhbMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIHsgbW9kZTogXCJjbGFzc1wiLCBrZXksIHJhdzoga2V5LCByZ2I6IG51bGwgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBBbiBvY2N1cnJlbmNlIGlzIHVuc2FmZSB0byBhdXRvLWNvbnZlcnQgaWYgaXQgc3BhbnMgbGluZXMgb3IgaG9sZHMgbWFya3VwLiAqL1xuZnVuY3Rpb24gaXNVbnNhZmUoaW5uZXI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGlubmVyLmluY2x1ZGVzKFwiXFxuXCIpIHx8XG4gICAgaW5uZXIuaW5jbHVkZXMoXCI9PVwiKSB8fFxuICAgIGlubmVyLmluY2x1ZGVzKFwiPG1hcmtcIikgfHxcbiAgICBpbm5lci5pbmNsdWRlcyhcIjwvbWFya1wiKVxuICApO1xufVxuXG4vKiogU2NhbiBhIHNpbmdsZSBmaWxlJ3MgdGV4dDsgYWNjdW11bGF0ZSBwZXItY29sb3VyIGNvdW50cy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBpbmNsdWRlQ2xhc3M6IGJvb2xlYW5cbik6IE1hcDxzdHJpbmcsIHsgcmdiOiBSR0IgfCBudWxsOyByYXc6IHN0cmluZzsgbW9kZTogTW9kZTsgY291bnQ6IG51bWJlcjsgdW5zYWZlOiBudW1iZXIgfT4ge1xuICBjb25zdCBvdXQgPSBuZXcgTWFwPFxuICAgIHN0cmluZyxcbiAgICB7IHJnYjogUkdCIHwgbnVsbDsgcmF3OiBzdHJpbmc7IG1vZGU6IE1vZGU7IGNvdW50OiBudW1iZXI7IHVuc2FmZTogbnVtYmVyIH1cbiAgPigpO1xuICBNQVJLX1JFLmxhc3RJbmRleCA9IDA7XG4gIGxldCBtOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG0gPSBNQVJLX1JFLmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG4gICAgY29uc3QgYyA9IGNsYXNzaWZ5KG1bMV0sIGluY2x1ZGVDbGFzcyk7XG4gICAgaWYgKCFjKSBjb250aW51ZTtcbiAgICBjb25zdCByZWMgPVxuICAgICAgb3V0LmdldChjLmtleSkgPz9cbiAgICAgIHsgcmdiOiBjLnJnYiwgcmF3OiBjLnJhdywgbW9kZTogYy5tb2RlLCBjb3VudDogMCwgdW5zYWZlOiAwIH07XG4gICAgaWYgKGlzVW5zYWZlKG1bMl0pKSByZWMudW5zYWZlKys7XG4gICAgZWxzZSByZWMuY291bnQrKztcbiAgICBvdXQuc2V0KGMua2V5LCByZWMpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHN1Z2dlc3RGb3IobW9kZTogTW9kZSwgcmdiOiBSR0IgfCBudWxsLCBrZXk6IHN0cmluZyk6IFRhcmdldCB7XG4gIGlmIChtb2RlID09PSBcImhleFwiKSB7XG4gICAgcmV0dXJuIGtub3duSGlnaGxpZ2h0ckNvbG9yKGtleSkgPz8gKHJnYiA/IG5lYXJlc3ROYXRpdmUocmdiKSA6IFwic2tpcFwiKTtcbiAgfVxuICBpZiAobW9kZSA9PT0gXCJjbGFzc1wiKSByZXR1cm4gZ3Vlc3NGcm9tQ2xhc3Moa2V5KSA/PyBcInNraXBcIjtcbiAgcmV0dXJuIFwic2tpcFwiO1xufVxuXG4vKipcbiAqIEFnZ3JlZ2F0ZSBzY2FubmVkIGZpbGVzIGludG8gdmF1bHQtd2lkZSBjb2xvdXIgZ3JvdXBzLlxuICogYGZpbGVzYCBpcyBhIGxpc3Qgb2YgeyBwYXRoLCBzY2FuIH0gd2hlcmUgYHNjYW5gIGlzIHRoZSBtYXAgZnJvbSBzY2FuVGV4dCgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRTY2FuUmVzdWx0KFxuICBmaWxlczogeyBwYXRoOiBzdHJpbmc7IHNjYW46IFJldHVyblR5cGU8dHlwZW9mIHNjYW5UZXh0PiB9W11cbik6IFNjYW5SZXN1bHQge1xuICBjb25zdCBncm91cHMgPSBuZXcgTWFwPHN0cmluZywgQ29sb3JHcm91cD4oKTtcbiAgbGV0IHRvdGFsTWF0Y2hlcyA9IDA7XG4gIGxldCB0b3RhbFVuc2FmZSA9IDA7XG4gIGNvbnN0IHRvdWNoZWRGaWxlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGxldCBmaWxlVG91Y2hlZCA9IGZhbHNlO1xuICAgIGZvciAoY29uc3QgW2tleSwgaW5mb10gb2YgZi5zY2FuKSB7XG4gICAgICBsZXQgZyA9IGdyb3Vwcy5nZXQoa2V5KTtcbiAgICAgIGlmICghZykge1xuICAgICAgICBnID0ge1xuICAgICAgICAgIGtleSxcbiAgICAgICAgICBtb2RlOiBpbmZvLm1vZGUsXG4gICAgICAgICAgcmdiOiBpbmZvLnJnYixcbiAgICAgICAgICByYXc6IGluZm8ucmF3LFxuICAgICAgICAgIGNvdW50OiAwLFxuICAgICAgICAgIHVuc2FmZTogMCxcbiAgICAgICAgICBmaWxlczogbmV3IFNldDxzdHJpbmc+KCksXG4gICAgICAgICAgc3VnZ2VzdGVkOiBzdWdnZXN0Rm9yKGluZm8ubW9kZSwgaW5mby5yZ2IsIGtleSksXG4gICAgICAgIH07XG4gICAgICAgIGdyb3Vwcy5zZXQoa2V5LCBnKTtcbiAgICAgIH1cbiAgICAgIGcuY291bnQgKz0gaW5mby5jb3VudDtcbiAgICAgIGcudW5zYWZlICs9IGluZm8udW5zYWZlO1xuICAgICAgZy5maWxlcy5hZGQoZi5wYXRoKTtcbiAgICAgIHRvdGFsTWF0Y2hlcyArPSBpbmZvLmNvdW50O1xuICAgICAgdG90YWxVbnNhZmUgKz0gaW5mby51bnNhZmU7XG4gICAgICBpZiAoaW5mby5jb3VudCA+IDAgfHwgaW5mby51bnNhZmUgPiAwKSBmaWxlVG91Y2hlZCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChmaWxlVG91Y2hlZCkgdG91Y2hlZEZpbGVzLmFkZChmLnBhdGgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBncm91cHM6IFsuLi5ncm91cHMudmFsdWVzKCldLnNvcnQoKGEsIGIpID0+IGIuY291bnQgLSBhLmNvdW50KSxcbiAgICB0b3RhbE1hdGNoZXMsXG4gICAgdG90YWxVbnNhZmUsXG4gICAgZmlsZUNvdW50OiB0b3VjaGVkRmlsZXMuc2l6ZSxcbiAgfTtcbn1cblxuLyoqXG4gKiBSZXdyaXRlIDxtYXJrPiBoaWdobGlnaHRzIGluIGB0ZXh0YCBwZXIgdGhlIG1hcHBpbmcuXG4gKiBSZXR1cm5zIHRoZSBuZXcgdGV4dCBwbHVzIGhvdyBtYW55IG1hcmtzIGNoYW5nZWQgLyB3ZXJlIHNraXBwZWQuXG4gKiBBIG1hcHBpbmcgdmFsdWUgb2YgXCJza2lwXCIgKG9yIGEga2V5IG5vdCBwcmVzZW50KSBsZWF2ZXMgdGhlIG1hcmsgdW50b3VjaGVkLlxuICogXCJkZWZhdWx0XCIgcHJvZHVjZXMgPT10ZXh0PT07IGEgbmF0aXZlIGNvbG91ciBwcm9kdWNlcyA9PTxlbW9qaT50ZXh0PT0uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBtYXBwaW5nOiBSZWNvcmQ8c3RyaW5nLCBUYXJnZXQ+LFxuICBpbmNsdWRlQ2xhc3M6IGJvb2xlYW5cbik6IHsgb3V0OiBzdHJpbmc7IGNoYW5nZWQ6IG51bWJlcjsgc2tpcHBlZDogbnVtYmVyIH0ge1xuICBsZXQgY2hhbmdlZCA9IDA7XG4gIGxldCBza2lwcGVkID0gMDtcbiAgY29uc3Qgb3V0ID0gdGV4dC5yZXBsYWNlKE1BUktfUkUsIChmdWxsLCBhdHRyczogc3RyaW5nLCBpbm5lcjogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgYyA9IGNsYXNzaWZ5KGF0dHJzLCBpbmNsdWRlQ2xhc3MpO1xuICAgIGlmICghYykgcmV0dXJuIGZ1bGw7XG4gICAgY29uc3QgdGFyZ2V0ID0gbWFwcGluZ1tjLmtleV07XG4gICAgaWYgKCF0YXJnZXQgfHwgdGFyZ2V0ID09PSBcInNraXBcIikgcmV0dXJuIGZ1bGw7XG4gICAgaWYgKGlzVW5zYWZlKGlubmVyKSkge1xuICAgICAgc2tpcHBlZCsrO1xuICAgICAgcmV0dXJuIGZ1bGw7XG4gICAgfVxuICAgIGNoYW5nZWQrKztcbiAgICBpZiAodGFyZ2V0ID09PSBcImRlZmF1bHRcIikgcmV0dXJuIGA9PSR7aW5uZXJ9PT1gO1xuICAgIHJldHVybiBgPT0ke05BVElWRV9FTU9KSVt0YXJnZXQgYXMgTmF0aXZlQ29sb3JdfSR7aW5uZXJ9PT1gO1xuICB9KTtcbiAgcmV0dXJuIHsgb3V0LCBjaGFuZ2VkLCBza2lwcGVkIH07XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBNb2RhbCwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgQ29uZmlybU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBjb25zdHJ1Y3RvcihcbiAgICBhcHA6IEFwcCxcbiAgICBwcml2YXRlIHRpdGxlOiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBib2R5OiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBjdGE6IHN0cmluZyxcbiAgICBwcml2YXRlIG9uQ29uZmlybTogKCkgPT4gdm9pZCB8IFByb21pc2U8dm9pZD5cbiAgKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICBjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcbiAgICBjb250ZW50RWwuY3JlYXRlRWwoXCJoM1wiLCB7IHRleHQ6IHRoaXMudGl0bGUgfSk7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwicFwiLCB7IHRleHQ6IHRoaXMuYm9keSB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChiKSA9PlxuICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJDYW5jZWxcIikub25DbGljaygoKSA9PiB0aGlzLmNsb3NlKCkpXG4gICAgICApXG4gICAgICAuYWRkQnV0dG9uKChiKSA9PlxuICAgICAgICBiXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQodGhpcy5jdGEpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5vbkNvbmZpcm0oKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQThFOzs7QUNBOUUsSUFBQUMsbUJBQWdEOzs7QUNVekMsSUFBTSxlQUE4QjtBQUFBLEVBQ3pDO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRjtBQUVPLElBQU0sZUFBNEM7QUFBQSxFQUN2RCxLQUFLO0FBQUEsRUFDTCxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxNQUFNO0FBQUEsRUFDTixRQUFRO0FBQ1Y7QUFFTyxJQUFNLGVBQTRDO0FBQUEsRUFDdkQsS0FBSztBQUFBLEVBQ0wsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUNWO0FBR08sSUFBTSxnQkFBNkM7QUFBQSxFQUN4RCxLQUFLO0FBQUEsRUFDTCxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixPQUFPO0FBQUEsRUFDUCxNQUFNO0FB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QUUsS0FBSztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFDRjtBQUVBLElBQU0sZUFBTixjQUEyQixrQ0FBaUI7QUFBQSxFQUcxQyxZQUFZLEtBQVUsUUFBaUM7QUFDckQsVUFBTSxLQUFLLE1BQU07QUFDakIsU0FBSyxTQUFTO0FBQUEsRUFDaEI7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBRWxCLFFBQUkseUJBQVEsV0FBVyxFQUNwQixRQUFRLGdDQUFnQyxFQUN4QyxRQUFRLDBGQUEwRixFQUNsRztBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQUUsU0FBUyxLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQUUsU0FBUyxPQUFPLE1BQU07QUFDbEUsYUFBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEseUZBQXlGLEVBQ2pHO0FBQUEsTUFBUSxDQUFDLE1BQ1IsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLFlBQVksRUFBRSxTQUFTLE9BQU8sTUFBTTtBQUNsRSxhQUFLLE9BQU8sU0FBUyxlQUFlLEVBQUUsS0FBSyxLQUFLO0FBQ2hELGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUVGLFFBQUkseUJBQVEsV0FBVyxFQUNwQixRQUFRLGVBQWUsRUFDdkIsUUFBUSxtREFBbUQsRUFDM0Q7QUFBQSxNQUFRLENBQUMsTUFDUixFQUFFLFNBQVMsS0FBSyxPQUFPLFNBQVMsWUFBWSxFQUFFLFNBQVMsT0FBTyxNQUFNO0FBQ2xFLGFBQUssT0FBTyxTQUFTLGVBQWUsRUFBRSxLQUFLLEtBQUs7QUFDaEQsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx5QkFBUSxXQUFXLEVBQ3BCLFFBQVEsOEJBQThCLEVBQ3RDLFFBQVEsaUVBQWlFLEVBQ3pFO0FBQUEsTUFBVSxDQUFDLE1BQ1YsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLGtCQUFrQixFQUFFLFNBQVMsT0FBTyxNQUFNO0FBQ3hFLGFBQUssT0FBTyxTQUFTLHFCQUFxQjtBQUMxQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNKO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
