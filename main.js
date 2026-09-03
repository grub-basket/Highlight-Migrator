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
      } catch {
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
      } catch {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL3ZpZXcudHMiLCAic3JjL2NvbG9ycy50cyIsICJzcmMvbWlncmF0ZS50cyIsICJzcmMvc2Nhbi50cyIsICJzcmMvbW9kYWxzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBQbHVnaW4sIFdvcmtzcGFjZUxlYWYsIE5vdGljZSwgUGx1Z2luU2V0dGluZ1RhYiwgQXBwLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBIaWdobGlnaHRNaWdyYXRvclZpZXcsIFZJRVdfVFlQRSB9IGZyb20gXCIuL3ZpZXdcIjtcbmltcG9ydCB7IGxpc3RNYW5pZmVzdHMsIHJldmVydE1pZ3JhdGlvbiB9IGZyb20gXCIuL21pZ3JhdGVcIjtcbmltcG9ydCB7IENvbmZpcm1Nb2RhbCB9IGZyb20gXCIuL21vZGFsc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEhtU2V0dGluZ3Mge1xuICBpbmNsdWRlQ2xhc3M6IGJvb2xlYW47XG4gIGJhY2t1cEZvbGRlcjogc3RyaW5nO1xuICByZXBvcnRGb2xkZXI6IHN0cmluZztcbiAgd3JpdGVSZXBvcnRPbkFwcGx5OiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBIbVNldHRpbmdzID0ge1xuICBpbmNsdWRlQ2xhc3M6IHRydWUsXG4gIGJhY2t1cEZvbGRlcjogXCJfaGlnaGxpZ2h0LWJhY2t1cFwiLFxuICByZXBvcnRGb2xkZXI6IFwiSGlnaGxpZ2h0IE1pZ3JhdGlvblwiLFxuICB3cml0ZVJlcG9ydE9uQXBwbHk6IHRydWUsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIaWdobGlnaHRNaWdyYXRvclBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIbVNldHRpbmdzID0gREVGQVVMVF9TRVRUSU5HUztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRSwgKGxlYWYpID0+IG5ldyBIaWdobGlnaHRNaWdyYXRvclZpZXcobGVhZiwgdGhpcykpO1xuXG4gICAgdGhpcy5hZGRSaWJib25JY29uKFwiaGlnaGxpZ2h0ZXJcIiwgXCJIaWdobGlnaHQgTWlncmF0b3JcIiwgKCkgPT4gdGhpcy5vcGVuVmlldygpKTtcblxuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJvcGVuLW1pZ3JhdG9yXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gbWlncmF0b3IgKHNjYW4gJiBtYXApXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5vcGVuVmlldygpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcInJldmVydC1sYXN0LW1pZ3JhdGlvblwiLFxuICAgICAgbmFtZTogXCJSZXZlcnQgbGFzdCBtaWdyYXRpb25cIixcbiAgICAgIGNhbGxiYWNrOiAoKSA9PiB0aGlzLnJldmVydExhc3QoKSxcbiAgICB9KTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgSG1TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gIH1cblxuICBvbnVubG9hZCgpIHt9XG5cbiAgYXN5bmMgb3BlblZpZXcoKSB7XG4gICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuICAgIGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFKVswXSA/PyBudWxsO1xuICAgIGlmICghbGVhZikge1xuICAgICAgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKFwidGFiXCIpO1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBWSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICB9XG4gICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gIH1cblxuICBhc3luYyByZXZlcnRMYXN0KCkge1xuICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGxpc3RNYW5pZmVzdHModGhpcy5hcHAsIHRoaXMuc2V0dGluZ3MuYmFja3VwRm9sZGVyKTtcbiAgICBpZiAobWFuaWZlc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIkhpZ2hsaWdodCBNaWdyYXRvcjogbm8gbWlncmF0aW9ucyB0byByZXZlcnQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsYXRlc3QgPSBtYW5pZmVzdHNbMF07XG4gICAgbmV3IENvbmZpcm1Nb2RhbChcbiAgICAgIHRoaXMuYXBwLFxuICAgICAgXCJSZXZlcnQgbGFzdCBtaWdyYXRpb24/XCIsXG4gICAgICBgUmVzdG9yZSAke2xhdGVzdC5tYW5pZmVzdC5maWxlcy5sZW5ndGh9IG5vdGUocykgZnJvbSBiYWNrdXAgXCIke2xhdGVzdC5mb2xkZXJ9XCIgKG1pZ3JhdGVkICR7bGF0ZXN0Lm1hbmlmZXN0LmNyZWF0ZWRBdH0pLiBDdXJyZW50IHZlcnNpb25zIG9mIHRob3NlIG5vdGVzIHdpbGwgYmUgb3ZlcndyaXR0ZW4uYCxcbiAgICAgIFwiUmV2ZXJ0XCIsXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVzdG9yZWQsIG1pc3NpbmcgfSA9IGF3YWl0IHJldmVydE1pZ3JhdGlvbih0aGlzLmFwcCwgbGF0ZXN0Lm1hbmlmZXN0KTtcbiAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICBgSGlnaGxpZ2h0IE1pZ3JhdG9yOiByZXN0b3JlZCAke3Jlc3RvcmVkfSBub3RlKHMpYCArXG4gICAgICAgICAgICAobWlzc2luZy5sZW5ndGggPyBgLCAke21pc3NpbmcubGVuZ3RofSBiYWNrdXAocykgbWlzc2luZy5gIDogXCIuXCIpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxufVxuXG5jbGFzcyBIbVNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBIaWdobGlnaHRNaWdyYXRvclBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBIaWdobGlnaHRNaWdyYXRvclBsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNvbnZlcnQgY2xhc3MtYmFzZWQgaGlnaGxpZ2h0c1wiKVxuICAgICAgLnNldERlc2MoJ0Fsc28gbWF0Y2ggSGlnaGxpZ2h0ciBjbGFzcyBtYXJrdXAgbGlrZSA8bWFyayBjbGFzcz1cImhsdHItb3JhbmdlXCI+LCBub3Qgb25seSBpbmxpbmUgaGV4LicpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmluY2x1ZGVDbGFzcykub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbmNsdWRlQ2xhc3MgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgLnNldE5hbWUoXCJCYWNrdXAgZm9sZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIlRpbWVzdGFtcGVkIHN1YmZvbGRlcnMgb2YgdW50b3VjaGVkIG5vdGUgY29waWVzIGFyZSBjcmVhdGVkIGhlcmUgYmVmb3JlIGFueSBjb252ZXJzaW9uLlwiKVxuICAgICAgLmFkZFRleHQoKHQpID0+XG4gICAgICAgIHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja3VwRm9sZGVyKS5vbkNoYW5nZShhc3luYyAodikgPT4ge1xuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmJhY2t1cEZvbGRlciA9IHYudHJpbSgpIHx8IFwiX2hpZ2hsaWdodC1iYWNrdXBcIjtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiUmVwb3J0IGZvbGRlclwiKVxuICAgICAgLnNldERlc2MoXCJTY2FuIHJlcG9ydCBub3RlcyAodHJlZSArIEpTT04pIGFyZSB3cml0dGVuIGhlcmUuXCIpXG4gICAgICAuYWRkVGV4dCgodCkgPT5cbiAgICAgICAgdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXBvcnRGb2xkZXIpLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVwb3J0Rm9sZGVyID0gdi50cmltKCkgfHwgXCJIaWdobGlnaHQgTWlncmF0aW9uXCI7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIldyaXRlIGEgcmVwb3J0IHdoZW4gYXBwbHlpbmdcIilcbiAgICAgIC5zZXREZXNjKFwiU2F2ZSBhIHNjYW4vbWFwcGluZyByZXBvcnQgbm90ZSBlYWNoIHRpbWUgeW91IHJ1biBhIGNvbnZlcnNpb24uXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0KSA9PlxuICAgICAgICB0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLndyaXRlUmVwb3J0T25BcHBseSkub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcbiAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy53cml0ZVJlcG9ydE9uQXBwbHkgPSB2O1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBOb3RpY2UgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB0eXBlIEhpZ2hsaWdodE1pZ3JhdG9yUGx1Z2luIGZyb20gXCIuL21haW5cIjtcbmltcG9ydCB7XG4gIE5BVElWRV9PUkRFUixcbiAgTkFUSVZFX0xBQkVMLFxuICBOQVRJVkVfRU1PSkksXG4gIE5BVElWRV9TV0FUQ0gsXG4gIFRhcmdldCxcbn0gZnJvbSBcIi4vY29sb3JzXCI7XG5pbXBvcnQgeyBTY2FuUmVzdWx0IH0gZnJvbSBcIi4vc2NhblwiO1xuaW1wb3J0IHsgc2NhblZhdWx0LCBhcHBseU1pZ3JhdGlvbiwgd3JpdGVSZXBvcnQgfSBmcm9tIFwiLi9taWdyYXRlXCI7XG5pbXBvcnQgeyBDb25maXJtTW9kYWwgfSBmcm9tIFwiLi9tb2RhbHNcIjtcblxuZXhwb3J0IGNvbnN0IFZJRVdfVFlQRSA9IFwiaGlnaGxpZ2h0LW1pZ3JhdG9yLXZpZXdcIjtcblxuZXhwb3J0IGNsYXNzIEhpZ2hsaWdodE1pZ3JhdG9yVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcHJpdmF0ZSByZXN1bHQ6IFNjYW5SZXN1bHQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXBwaW5nOiBSZWNvcmQ8c3RyaW5nLCBUYXJnZXQ+ID0ge307XG4gIHByaXZhdGUgYnVzeSA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHByaXZhdGUgcGx1Z2luOiBIaWdobGlnaHRNaWdyYXRvclBsdWdpbikge1xuICAgIHN1cGVyKGxlYWYpO1xuICB9XG5cbiAgZ2V0Vmlld1R5cGUoKSB7XG4gICAgcmV0dXJuIFZJRVdfVFlQRTtcbiAgfVxuICBnZXREaXNwbGF5VGV4dCgpIHtcbiAgICByZXR1cm4gXCJIaWdobGlnaHQgTWlncmF0b3JcIjtcbiAgfVxuICBnZXRJY29uKCkge1xuICAgIHJldHVybiBcImhpZ2hsaWdodGVyXCI7XG4gIH1cblxuICBhc3luYyBvbk9wZW4oKSB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuICBhc3luYyBvbkNsb3NlKCkge31cblxuICBwcml2YXRlIGdldCBza2lwRm9sZGVycygpOiBzdHJpbmdbXSB7XG4gICAgcmV0dXJuIFt0aGlzLnBsdWdpbi5zZXR0aW5ncy5iYWNrdXBGb2xkZXIsIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlcG9ydEZvbGRlcl07XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blNjYW4oKSB7XG4gICAgaWYgKHRoaXMuYnVzeSkgcmV0dXJuO1xuICAgIHRoaXMuYnVzeSA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIG5ldyBOb3RpY2UoXCJIaWdobGlnaHQgTWlncmF0b3I6IHNjYW5uaW5nIHZhdWx0XHUyMDI2XCIpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2NhblZhdWx0KFxuICAgICAgICB0aGlzLnBsdWdpbi5hcHAsXG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmluY2x1ZGVDbGFzcyxcbiAgICAgICAgdGhpcy5za2lwRm9sZGVyc1xuICAgICAgKTtcbiAgICAgIHRoaXMucmVzdWx0ID0gcmVzdWx0O1xuICAgICAgLy8gU2VlZCBtYXBwaW5nIGZyb20gc3VnZ2VzdGlvbnMsIHByZXNlcnZpbmcgYW55IHByaW9yIGNob2ljZXMuXG4gICAgICBmb3IgKGNvbnN0IGcgb2YgcmVzdWx0Lmdyb3Vwcykge1xuICAgICAgICBpZiAoIShnLmtleSBpbiB0aGlzLm1hcHBpbmcpKSB0aGlzLm1hcHBpbmdbZy5rZXldID0gZy5zdWdnZXN0ZWQ7XG4gICAgICB9XG4gICAgICBuZXcgTm90aWNlKFxuICAgICAgICBgSGlnaGxpZ2h0IE1pZ3JhdG9yOiAke3Jlc3VsdC50b3RhbE1hdGNoZXN9IGhpZ2hsaWdodChzKSwgJHtyZXN1bHQuZ3JvdXBzLmxlbmd0aH0gY29sb3VyKHMpLCAke3Jlc3VsdC5maWxlQ291bnR9IG5vdGUocykuYFxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBuZXcgTm90aWNlKFwiSGlnaGxpZ2h0IE1pZ3JhdG9yOiBzY2FuIGZhaWxlZCBcdTIwMTQgc2VlIGNvbnNvbGUuXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdGhpcy5idXN5ID0gZmFsc2U7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGxhbm5lZENvdW50cygpOiB7IGNvbnZlcnQ6IG51bWJlcjsgc2tpcDogbnVtYmVyOyBub3RlczogbnVtYmVyIH0ge1xuICAgIGxldCBjb252ZXJ0ID0gMDtcbiAgICBsZXQgc2tpcCA9IDA7XG4gICAgY29uc3Qgbm90ZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBpZiAoIXRoaXMucmVzdWx0KSByZXR1cm4geyBjb252ZXJ0LCBza2lwLCBub3RlczogMCB9O1xuICAgIGZvciAoY29uc3QgZyBvZiB0aGlzLnJlc3VsdC5ncm91cHMpIHtcbiAgICAgIGNvbnN0IHQgPSB0aGlzLm1hcHBpbmdbZy5rZXldID8/IFwic2tpcFwiO1xuICAgICAgaWYgKHQgPT09IFwic2tpcFwiKSB7XG4gICAgICAgIHNraXAgKz0gZy5jb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnZlcnQgKz0gZy5jb3VudDtcbiAgICAgICAgZm9yIChjb25zdCBmIG9mIGcuZmlsZXMpIG5vdGVzLmFkZChmKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgY29udmVydCwgc2tpcCwgbm90ZXM6IG5vdGVzLnNpemUgfTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcnVuQXBwbHkoKSB7XG4gICAgaWYgKHRoaXMuYnVzeSB8fCAhdGhpcy5yZXN1bHQpIHJldHVybjtcbiAgICBjb25zdCBwbGFuID0gdGhpcy5wbGFubmVkQ291bnRzKCk7XG4gICAgaWYgKHBsYW4uY29udmVydCA9PT0gMCkge1xuICAgICAgbmV3IE5vdGljZShcIkhpZ2hsaWdodCBNaWdyYXRvcjogbm90aGluZyBtYXBwZWQgdG8gY29udmVydCAoYWxsIHNraXBwZWQpLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbmV3IENvbmZpcm1Nb2RhbChcbiAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgIFwiQmFjayB1cCBhbmQgY29udmVydD9cIixcbiAgICAgIGBUaGlzIHdpbGwgY29weSAke3BsYW4ubm90ZXN9IGFmZmVjdGVkIG5vdGUocykgaW50byBcIiR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja3VwRm9sZGVyfS9cdTIwMjZcIiBhcyBhIGJhY2t1cCwgdGhlbiBjb252ZXJ0ICR7cGxhbi5jb252ZXJ0fSBoaWdobGlnaHQocykuIFlvdSBjYW4gcmV2ZXJ0IGFmdGVyd2FyZHMuYCxcbiAgICAgIFwiQmFjayB1cCAmIGNvbnZlcnRcIixcbiAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5idXN5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Mud3JpdGVSZXBvcnRPbkFwcGx5KSB7XG4gICAgICAgICAgICBhd2FpdCB3cml0ZVJlcG9ydChcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgICAgICAgICB0aGlzLnJlc3VsdCEsXG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlcG9ydEZvbGRlcixcbiAgICAgICAgICAgICAgdGhpcy5tYXBwaW5nXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBtYW5pZmVzdCA9IGF3YWl0IGFwcGx5TWlncmF0aW9uKFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgICAgICAgdGhpcy5tYXBwaW5nLFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuaW5jbHVkZUNsYXNzLFxuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFja3VwRm9sZGVyLFxuICAgICAgICAgICAgdGhpcy5za2lwRm9sZGVyc1xuICAgICAgICAgICk7XG4gICAgICAgICAgbmV3IE5vdGljZShcbiAgICAgICAgICAgIGBIaWdobGlnaHQgTWlncmF0b3I6IGNvbnZlcnRlZCAke21hbmlmZXN0LnRvdGFsQ2hhbmdlZH0gaGlnaGxpZ2h0KHMpIGluICR7bWFuaWZlc3QuZmlsZXMubGVuZ3RofSBub3RlKHMpLiBCYWNrdXA6ICR7bWFuaWZlc3QuYmFja3VwRm9sZGVyfWBcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgbmV3IE5vdGljZShcIkhpZ2hsaWdodCBNaWdyYXRvcjogY29udmVyc2lvbiBmYWlsZWQgXHUyMDE0IHNlZSBjb25zb2xlLlwiKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHRoaXMuYnVzeSA9IGZhbHNlO1xuICAgICAgICAgIGF3YWl0IHRoaXMucnVuU2NhbigpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKS5vcGVuKCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJ1blJlcG9ydCgpIHtcbiAgICBpZiAoIXRoaXMucmVzdWx0KSB7XG4gICAgICBuZXcgTm90aWNlKFwiSGlnaGxpZ2h0IE1pZ3JhdG9yOiBzY2FuIGZpcnN0LlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcGF0aCA9IGF3YWl0IHdyaXRlUmVwb3J0KFxuICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgdGhpcy5yZXN1bHQsXG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZXBvcnRGb2xkZXIsXG4gICAgICB0aGlzLm1hcHBpbmdcbiAgICApO1xuICAgIG5ldyBOb3RpY2UoYEhpZ2hsaWdodCBNaWdyYXRvcjogcmVwb3J0IHdyaXR0ZW4gdG8gJHtwYXRofWApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgY29uc3QgYyA9IHRoaXMuY29udGFpbmVyRWwuY2hpbGRyZW5bMV0gYXMgSFRNTEVsZW1lbnQ7XG4gICAgYy5lbXB0eSgpO1xuICAgIGMuYWRkQ2xhc3MoXCJobS12aWV3XCIpO1xuXG4gICAgYy5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJIaWdobGlnaHQgTWlncmF0b3JcIiB9KTtcbiAgICBjLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICBjbHM6IFwiaG0taW50cm9cIixcbiAgICAgIHRleHQ6IFwiQ29udmVydCBsZWdhY3kgPG1hcms+IEhUTUwgaGlnaGxpZ2h0cyB0byBuYXRpdmUgaGlnaGxpZ2h0IGNvbG91cnMuIFNjYW4gZmlyc3QsIG1hcCBlYWNoIGNvbG91ciAob3Igc2tpcCBpdCksIHRoZW4gYmFjayB1cCBhbmQgY29udmVydC4gRXZlcnl0aGluZyBpcyByZXZlcnNpYmxlLlwiLFxuICAgIH0pO1xuXG4gICAgLy8gVG9vbGJhclxuICAgIGNvbnN0IGJhciA9IGMuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXRvb2xiYXJcIiB9KTtcbiAgICBjb25zdCBzY2FuQnRuID0gYmFyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IHRoaXMuYnVzeSA/IFwiV29ya2luZ1x1MjAyNlwiIDogXCJTY2FuIHZhdWx0XCIsXG4gICAgICBjbHM6IFwibW9kLWN0YVwiLFxuICAgIH0pO1xuICAgIHNjYW5CdG4uZGlzYWJsZWQgPSB0aGlzLmJ1c3k7XG4gICAgc2NhbkJ0bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5ydW5TY2FuKCk7XG5cbiAgICBjb25zdCByZXBvcnRCdG4gPSBiYXIuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIldyaXRlIHJlcG9ydFwiIH0pO1xuICAgIHJlcG9ydEJ0bi5kaXNhYmxlZCA9IHRoaXMuYnVzeSB8fCAhdGhpcy5yZXN1bHQ7XG4gICAgcmVwb3J0QnRuLm9uY2xpY2sgPSAoKSA9PiB0aGlzLnJ1blJlcG9ydCgpO1xuXG4gICAgaWYgKCF0aGlzLnJlc3VsdCkge1xuICAgICAgYy5jcmVhdGVFbChcInBcIiwge1xuICAgICAgICBjbHM6IFwiaG0tZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBzY2FuIHlldC4gQ2xpY2sgXHUyMDFDU2NhbiB2YXVsdFx1MjAxRCB0byBmaW5kIGhpZ2hsaWdodHMuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBTdW1tYXJ5XG4gICAgY29uc3QgcyA9IHRoaXMucmVzdWx0O1xuICAgIGNvbnN0IHN1bSA9IGMuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXN1bW1hcnlcIiB9KTtcbiAgICBzdW0uY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgIHRleHQ6IGAke3MudG90YWxNYXRjaGVzfSBjb252ZXJ0aWJsZSBcdTAwQjcgJHtzLnRvdGFsVW5zYWZlfSB1bnNhZmUgXHUwMEI3ICR7cy5ncm91cHMubGVuZ3RofSBjb2xvdXJzIFx1MDBCNyAke3MuZmlsZUNvdW50fSBub3Rlc2AsXG4gICAgfSk7XG5cbiAgICBpZiAocy5ncm91cHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjLmNyZWF0ZUVsKFwicFwiLCB7XG4gICAgICAgIGNsczogXCJobS1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBcIk5vIGxlZ2FjeSA8bWFyaz4gaGlnaGxpZ2h0cyBmb3VuZC4gTm90aGluZyB0byBtaWdyYXRlIFx1RDgzQ1x1REY4OVwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVGFibGVcbiAgICBjb25zdCB0YWJsZSA9IGMuY3JlYXRlRWwoXCJ0YWJsZVwiLCB7IGNsczogXCJobS10YWJsZVwiIH0pO1xuICAgIGNvbnN0IGhlYWQgPSB0YWJsZS5jcmVhdGVFbChcInRoZWFkXCIpLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgW1wiU2FtcGxlXCIsIFwiU291cmNlXCIsIFwiQ291bnRcIiwgXCJOb3Rlc1wiLCBcIlVuc2FmZVwiLCBcIk1hcCB0b1wiXS5mb3JFYWNoKChoKSA9PlxuICAgICAgaGVhZC5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogaCB9KVxuICAgICk7XG4gICAgY29uc3QgYm9keSA9IHRhYmxlLmNyZWF0ZUVsKFwidGJvZHlcIik7XG5cbiAgICBmb3IgKGNvbnN0IGcgb2Ygcy5ncm91cHMpIHtcbiAgICAgIGNvbnN0IHJvdyA9IGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcblxuICAgICAgLy8gU2FtcGxlIHN3YXRjaFxuICAgICAgY29uc3Qgc2FtcGxlVGQgPSByb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcbiAgICAgIGNvbnN0IHN3ID0gc2FtcGxlVGQuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXN3YXRjaFwiIH0pO1xuICAgICAgaWYgKGcubW9kZSA9PT0gXCJoZXhcIikge1xuICAgICAgICBzdy5zdHlsZS5iYWNrZ3JvdW5kID0gZy5yYXc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdy5hZGRDbGFzcyhcImhtLXN3YXRjaC1jbGFzc1wiKTtcbiAgICAgICAgc3cuc2V0VGV4dChcImNsc1wiKTtcbiAgICAgIH1cblxuICAgICAgcm93LmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiBnLnJhdywgY2xzOiBcImhtLW1vbm9cIiB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogU3RyaW5nKGcuY291bnQpIH0pO1xuICAgICAgcm93LmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiBTdHJpbmcoZy5maWxlcy5zaXplKSB9KTtcbiAgICAgIHJvdy5jcmVhdGVFbChcInRkXCIsIHsgdGV4dDogZy51bnNhZmUgPyBTdHJpbmcoZy51bnNhZmUpIDogXCJcdTIwMTRcIiB9KTtcblxuICAgICAgLy8gTWFwcGluZyBzZWxlY3RcbiAgICAgIGNvbnN0IG1hcFRkID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICBjb25zdCBzZWwgPSBtYXBUZC5jcmVhdGVFbChcInNlbGVjdFwiLCB7IGNsczogXCJkcm9wZG93biBobS1zZWxlY3RcIiB9KTtcbiAgICAgIGNvbnN0IGFkZE9wdCA9ICh2YWx1ZTogVGFyZ2V0LCBsYWJlbDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG8gPSBzZWwuY3JlYXRlRWwoXCJvcHRpb25cIiwgeyB0ZXh0OiBsYWJlbCwgdmFsdWUgfSk7XG4gICAgICAgIGlmICgodGhpcy5tYXBwaW5nW2cua2V5XSA/PyBnLnN1Z2dlc3RlZCkgPT09IHZhbHVlKSBvLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgIH07XG4gICAgICBhZGRPcHQoXCJza2lwXCIsIFwiU2tpcCAobGVhdmUgYXMtaXMpXCIpO1xuICAgICAgYWRkT3B0KFwiZGVmYXVsdFwiLCBcIkRlZmF1bHQgKG5vIGNvbG91cilcIik7XG4gICAgICBmb3IgKGNvbnN0IG5jIG9mIE5BVElWRV9PUkRFUikge1xuICAgICAgICBhZGRPcHQobmMsIGAke05BVElWRV9FTU9KSVtuY119ICR7TkFUSVZFX0xBQkVMW25jXX1gKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZpZXcgY2hpcCBvZiB0aGUgdGFyZ2V0IGVtb2ppXG4gICAgICBjb25zdCBjaGlwID0gbWFwVGQuY3JlYXRlU3Bhbih7IGNsczogXCJobS1jaGlwXCIgfSk7XG4gICAgICBjb25zdCBwYWludENoaXAgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHQgPSB0aGlzLm1hcHBpbmdbZy5rZXldID8/IFwic2tpcFwiO1xuICAgICAgICBpZiAodCA9PT0gXCJza2lwXCIpIGNoaXAuc2V0VGV4dChcIlx1MjAxNFwiKTtcbiAgICAgICAgZWxzZSBpZiAodCA9PT0gXCJkZWZhdWx0XCIpIGNoaXAuc2V0VGV4dChcIj09XHUwMEI3PT1cIik7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNoaXAuc2V0VGV4dChgPT0ke05BVElWRV9FTU9KSVt0XX1cdTIwMjY9PWApO1xuICAgICAgICAgIGNoaXAuc3R5bGUuY29sb3IgPSBOQVRJVkVfU1dBVENIW3RdO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcGFpbnRDaGlwKCk7XG4gICAgICBzZWwub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMubWFwcGluZ1tnLmtleV0gPSBzZWwudmFsdWUgYXMgVGFyZ2V0O1xuICAgICAgICBwYWludENoaXAoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoUGxhbigpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBGb290ZXIgLyBwbGFuXG4gICAgY29uc3QgZm9vdGVyID0gYy5jcmVhdGVEaXYoeyBjbHM6IFwiaG0tZm9vdGVyXCIgfSk7XG4gICAgdGhpcy5wbGFuRWwgPSBmb290ZXIuY3JlYXRlRGl2KHsgY2xzOiBcImhtLXBsYW5cIiB9KTtcbiAgICB0aGlzLnJlZnJlc2hQbGFuKCk7XG5cbiAgICBjb25zdCBhY3Rpb25zID0gZm9vdGVyLmNyZWF0ZURpdih7IGNsczogXCJobS1hY3Rpb25zXCIgfSk7XG4gICAgY29uc3QgYXBwbHlCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiQmFjayB1cCAmIGNvbnZlcnRcIixcbiAgICAgIGNsczogXCJtb2QtY3RhXCIsXG4gICAgfSk7XG4gICAgYXBwbHlCdG4uZGlzYWJsZWQgPSB0aGlzLmJ1c3k7XG4gICAgYXBwbHlCdG4ub25jbGljayA9ICgpID0+IHRoaXMucnVuQXBwbHkoKTtcblxuICAgIGNvbnN0IHJldmVydEJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoXCJidXR0b25cIiwgeyB0ZXh0OiBcIlJldmVydCBsYXN0IG1pZ3JhdGlvblwiIH0pO1xuICAgIHJldmVydEJ0bi5kaXNhYmxlZCA9IHRoaXMuYnVzeTtcbiAgICByZXZlcnRCdG4ub25jbGljayA9ICgpID0+IHRoaXMucGx1Z2luLnJldmVydExhc3QoKTtcbiAgfVxuXG4gIHByaXZhdGUgcGxhbkVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlZnJlc2hQbGFuKCkge1xuICAgIGlmICghdGhpcy5wbGFuRWwpIHJldHVybjtcbiAgICBjb25zdCBwID0gdGhpcy5wbGFubmVkQ291bnRzKCk7XG4gICAgdGhpcy5wbGFuRWwuc2V0VGV4dChcbiAgICAgIGBQbGFuOiBjb252ZXJ0ICR7cC5jb252ZXJ0fSBoaWdobGlnaHQocykgaW4gJHtwLm5vdGVzfSBub3RlKHMpOyBza2lwICR7cC5za2lwfS5gXG4gICAgKTtcbiAgfVxufVxuIiwgIi8vIE5hdGl2ZSBoaWdobGlnaHQgcGFsZXR0ZSAoT2JzaWRpYW4gaW5zaWRlciBjdXN0b20gaGlnaGxpZ2h0IGNvbG91cnMpLlxuLy8gQW5jaG9ycyBhcmUgYXBwcm94aW1hdGUgc1JHQiB2YWx1ZXMgc2FtcGxlZCBmcm9tIHRoZSBjb2xvdXIgcGlja2VyIHN3YXRjaGVzO1xuLy8gdGhleSBvbmx5IGRyaXZlIHRoZSBcIm5lYXJlc3QgY29sb3VyXCIgc3VnZ2VzdGlvbiwgc28gZXhhY3RuZXNzIGlzbid0IGNyaXRpY2FsLlxuXG5leHBvcnQgdHlwZSBOYXRpdmVDb2xvciA9IFwicmVkXCIgfCBcIm9yYW5nZVwiIHwgXCJ5ZWxsb3dcIiB8IFwiZ3JlZW5cIiB8IFwiYmx1ZVwiIHwgXCJwdXJwbGVcIjtcblxuLy8gQSBtYXBwaW5nIHRhcmdldCBpcyBhIG5hdGl2ZSBjb2xvdXIsIFwiZGVmYXVsdFwiIChwbGFpbiA9PXRleHQ9PSB3aXRoIG5vIGVtb2ppKSxcbi8vIG9yIFwic2tpcFwiIChsZWF2ZSB0aGUgb3JpZ2luYWwgPG1hcms+IHVudG91Y2hlZCkuXG5leHBvcnQgdHlwZSBUYXJnZXQgPSBOYXRpdmVDb2xvciB8IFwiZGVmYXVsdFwiIHwgXCJza2lwXCI7XG5cbmV4cG9ydCBjb25zdCBOQVRJVkVfT1JERVI6IE5hdGl2ZUNvbG9yW10gPSBbXG4gIFwicmVkXCIsXG4gIFwib3JhbmdlXCIsXG4gIFwieWVsbG93XCIsXG4gIFwiZ3JlZW5cIixcbiAgXCJibHVlXCIsXG4gIFwicHVycGxlXCIsXG5dO1xuXG5leHBvcnQgY29uc3QgTkFUSVZFX0VNT0pJOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIHN0cmluZz4gPSB7XG4gIHJlZDogXCJcdUQ4M0RcdUREMzRcIixcbiAgb3JhbmdlOiBcIlx1RDgzRFx1REZFMFwiLFxuICB5ZWxsb3c6IFwiXHVEODNEXHVERkUxXCIsXG4gIGdyZWVuOiBcIlx1RDgzRFx1REZFMlwiLFxuICBibHVlOiBcIlx1RDgzRFx1REQzNVwiLFxuICBwdXJwbGU6IFwiXHVEODNEXHVERkUzXCIsXG59O1xuXG5leHBvcnQgY29uc3QgTkFUSVZFX0xBQkVMOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIHN0cmluZz4gPSB7XG4gIHJlZDogXCJSZWRcIixcbiAgb3JhbmdlOiBcIk9yYW5nZVwiLFxuICB5ZWxsb3c6IFwiWWVsbG93XCIsXG4gIGdyZWVuOiBcIkdyZWVuXCIsXG4gIGJsdWU6IFwiQmx1ZVwiLFxuICBwdXJwbGU6IFwiUHVycGxlXCIsXG59O1xuXG4vLyBQcmV2aWV3IHN3YXRjaCBjb2xvdXJzIGZvciB0aGUgcmV2aWV3IHRhYmxlLlxuZXhwb3J0IGNvbnN0IE5BVElWRV9TV0FUQ0g6IFJlY29yZDxOYXRpdmVDb2xvciwgc3RyaW5nPiA9IHtcbiAgcmVkOiBcIiNmYjQ2NGNcIixcbiAgb3JhbmdlOiBcIiNlOTk3M2ZcIixcbiAgeWVsbG93OiBcIiNlMGRlNzFcIixcbiAgZ3JlZW46IFwiIzQ0Y2Y2ZVwiLFxuICBibHVlOiBcIiMwODZkZGRcIixcbiAgcHVycGxlOiBcIiNhODgyZmZcIixcbn07XG5cbmNvbnN0IE5BVElWRV9BTkNIT1JTOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXT4gPSB7XG4gIHJlZDogWzB4ZmIsIDB4NDYsIDB4NGNdLFxuICBvcmFuZ2U6IFsweGU5LCAweDk3LCAweDNmXSxcbiAgeWVsbG93OiBbMHhlMCwgMHhkZSwgMHg3MV0sXG4gIGdyZWVuOiBbMHg0NCwgMHhjZiwgMHg2ZV0sXG4gIGJsdWU6IFsweDA4LCAweDZkLCAweGRkXSxcbiAgcHVycGxlOiBbMHhhOCwgMHg4MiwgMHhmZl0sXG59O1xuXG5leHBvcnQgdHlwZSBSR0IgPSBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl07XG5cbi8qKiBQYXJzZSBcIiNSUkdHQkJcIiBvciBcIiNSUkdHQkJBQVwiIGludG8gYmFzZSBSR0IgKGFscGhhIGRyb3BwZWQpLiBOdWxsIGlmIGludmFsaWQuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VIZXgoaGV4OiBzdHJpbmcpOiBSR0IgfCBudWxsIHtcbiAgY29uc3QgaCA9IGhleC5yZXBsYWNlKC9eIy8sIFwiXCIpO1xuICBpZiAoaC5sZW5ndGggPCA2KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgciA9IHBhcnNlSW50KGguc2xpY2UoMCwgMiksIDE2KTtcbiAgY29uc3QgZyA9IHBhcnNlSW50KGguc2xpY2UoMiwgNCksIDE2KTtcbiAgY29uc3QgYiA9IHBhcnNlSW50KGguc2xpY2UoNCwgNiksIDE2KTtcbiAgaWYgKFtyLCBnLCBiXS5zb21lKChuKSA9PiBOdW1iZXIuaXNOYU4obikpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIFtyLCBnLCBiXTtcbn1cblxuZnVuY3Rpb24gc3JnYlRvTGluZWFyKGM6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHggPSBjIC8gMjU1O1xuICByZXR1cm4geCA8PSAwLjA0MDQ1ID8geCAvIDEyLjkyIDogTWF0aC5wb3coKHggKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbn1cblxuZnVuY3Rpb24gcmdiVG9MYWIoW3IsIGcsIGJdOiBSR0IpOiBSR0Ige1xuICBjb25zdCBSID0gc3JnYlRvTGluZWFyKHIpO1xuICBjb25zdCBHID0gc3JnYlRvTGluZWFyKGcpO1xuICBjb25zdCBCID0gc3JnYlRvTGluZWFyKGIpO1xuICBsZXQgWCA9IFIgKiAwLjQxMjQgKyBHICogMC4zNTc2ICsgQiAqIDAuMTgwNTtcbiAgbGV0IFkgPSBSICogMC4yMTI2ICsgRyAqIDAuNzE1MiArIEIgKiAwLjA3MjI7XG4gIGxldCBaID0gUiAqIDAuMDE5MyArIEcgKiAwLjExOTIgKyBCICogMC45NTA1O1xuICBYIC89IDAuOTUwNDc7XG4gIFogLz0gMS4wODg4MztcbiAgY29uc3QgZiA9ICh0OiBudW1iZXIpID0+ICh0ID4gMC4wMDg4NTYgPyBNYXRoLmNicnQodCkgOiA3Ljc4NyAqIHQgKyAxNiAvIDExNik7XG4gIGNvbnN0IGZ4ID0gZihYKTtcbiAgY29uc3QgZnkgPSBmKFkpO1xuICBjb25zdCBmeiA9IGYoWik7XG4gIHJldHVybiBbMTE2ICogZnkgLSAxNiwgNTAwICogKGZ4IC0gZnkpLCAyMDAgKiAoZnkgLSBmeildO1xufVxuXG5jb25zdCBBTkNIT1JfTEFCOiBSZWNvcmQ8TmF0aXZlQ29sb3IsIFJHQj4gPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gIE5BVElWRV9PUkRFUi5tYXAoKGspID0+IFtrLCByZ2JUb0xhYihOQVRJVkVfQU5DSE9SU1trXSldKVxuKSBhcyBSZWNvcmQ8TmF0aXZlQ29sb3IsIFJHQj47XG5cbi8vIEhpZ2hsaWdodHIncyBzdG9jayBwYXN0ZWwgcGFsZXR0ZSBtYXBzIDE6MSB0byBuYXRpdmUgY29sb3Vycy4gVGhlc2UgcGFzdGVsc1xuLy8gYXJlIGRlc2F0dXJhdGVkLCBzbyBwbGFpbiBuZWFyZXN0LWFuY2hvciBtYXRjaGluZyBtaXNmaXJlcyAoZS5nLiBwYWxlIGdyZWVuXG4vLyAjQkJGQUJCIGxhbmRzIG5lYXJlciB0aGUgeWVsbG93IGFuY2hvcikuIE1hdGNoIHRoZSBrbm93biBkZWZhdWx0cyBleGFjdGx5XG4vLyBmaXJzdCwgYnkgYmFzZSBSR0IgKGFscGhhIGlnbm9yZWQpLCBiZWZvcmUgZmFsbGluZyBiYWNrIHRvIG5lYXJlc3QoKS5cbmNvbnN0IEtOT1dOX0hJR0hMSUdIVFI6IFJlY29yZDxzdHJpbmcsIE5hdGl2ZUNvbG9yPiA9IHtcbiAgRkY1NTgyOiBcInJlZFwiLFxuICBGRkI4NkM6IFwib3JhbmdlXCIsXG4gIEZGRjNBMzogXCJ5ZWxsb3dcIixcbiAgQkJGQUJCOiBcImdyZWVuXCIsXG4gIEFEQ0NGRjogXCJibHVlXCIsXG4gIEQyQjNGRjogXCJwdXJwbGVcIixcbn07XG5cbi8qKiBFeGFjdCBtYXRjaCBmb3IgYSBrbm93biBIaWdobGlnaHRyIGRlZmF1bHQgY29sb3VyLCBvciBudWxsLiBgaGV4YCBtYXkgaW5jbHVkZSAjL2FscGhhLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtub3duSGlnaGxpZ2h0ckNvbG9yKGhleDogc3RyaW5nKTogTmF0aXZlQ29sb3IgfCBudWxsIHtcbiAgY29uc3QgYmFzZSA9IGhleC5yZXBsYWNlKC9eIy8sIFwiXCIpLnNsaWNlKDAsIDYpLnRvVXBwZXJDYXNlKCk7XG4gIHJldHVybiBLTk9XTl9ISUdITElHSFRSW2Jhc2VdID8/IG51bGw7XG59XG5cbi8qKiBOZWFyZXN0IG5hdGl2ZSBjb2xvdXIgdG8gYW4gUkdCLCBieSBDSUU3NiBMYWIgZGlzdGFuY2UuICovXG5leHBvcnQgZnVuY3Rpb24gbmVhcmVzdE5hdGl2ZShyZ2I6IFJHQik6IE5hdGl2ZUNvbG9yIHtcbiAgY29uc3QgbGFiID0gcmdiVG9MYWIocmdiKTtcbiAgbGV0IGJlc3Q6IE5hdGl2ZUNvbG9yID0gXCJ5ZWxsb3dcIjtcbiAgbGV0IGJlc3REID0gSW5maW5pdHk7XG4gIGZvciAoY29uc3QgayBvZiBOQVRJVkVfT1JERVIpIHtcbiAgICBjb25zdCBhID0gQU5DSE9SX0xBQltrXTtcbiAgICBjb25zdCBkID0gKGxhYlswXSAtIGFbMF0pICoqIDIgKyAobGFiWzFdIC0gYVsxXSkgKiogMiArIChsYWJbMl0gLSBhWzJdKSAqKiAyO1xuICAgIGlmIChkIDwgYmVzdEQpIHtcbiAgICAgIGJlc3REID0gZDtcbiAgICAgIGJlc3QgPSBrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYmVzdDtcbn1cblxuLyoqIEJlc3QtZ3Vlc3MgbmF0aXZlIGNvbG91ciBmcm9tIGEgSGlnaGxpZ2h0ciBjbGFzcyBuYW1lIGxpa2UgXCJobHRyLW9yYW5nZVwiLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGd1ZXNzRnJvbUNsYXNzKGNsczogc3RyaW5nKTogTmF0aXZlQ29sb3IgfCBudWxsIHtcbiAgY29uc3QgbiA9IGNscy50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCB0YWJsZTogW3N0cmluZywgTmF0aXZlQ29sb3JdW10gPSBbXG4gICAgW1wicGlua1wiLCBcInJlZFwiXSxcbiAgICBbXCJyb3NlXCIsIFwicmVkXCJdLFxuICAgIFtcInJlZFwiLCBcInJlZFwiXSxcbiAgICBbXCJvcmFuZ2VcIiwgXCJvcmFuZ2VcIl0sXG4gICAgW1wiYW1iZXJcIiwgXCJvcmFuZ2VcIl0sXG4gICAgW1wieWVsbG93XCIsIFwieWVsbG93XCJdLFxuICAgIFtcImdvbGRcIiwgXCJ5ZWxsb3dcIl0sXG4gICAgW1wiZ3JlZW5cIiwgXCJncmVlblwiXSxcbiAgICBbXCJsaW1lXCIsIFwiZ3JlZW5cIl0sXG4gICAgW1widGVhbFwiLCBcImdyZWVuXCJdLFxuICAgIFtcImJsdWVcIiwgXCJibHVlXCJdLFxuICAgIFtcImN5YW5cIiwgXCJibHVlXCJdLFxuICAgIFtcInB1cnBsZVwiLCBcInB1cnBsZVwiXSxcbiAgICBbXCJ2aW9sZXRcIiwgXCJwdXJwbGVcIl0sXG4gICAgW1wibWFnZW50YVwiLCBcInB1cnBsZVwiXSxcbiAgXTtcbiAgZm9yIChjb25zdCBbbmVlZGxlLCBjb2xdIG9mIHRhYmxlKSBpZiAobi5pbmNsdWRlcyhuZWVkbGUpKSByZXR1cm4gY29sO1xuICByZXR1cm4gbnVsbDtcbn1cbiIsICJpbXBvcnQgeyBBcHAsIG5vcm1hbGl6ZVBhdGgsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBUYXJnZXQgfSBmcm9tIFwiLi9jb2xvcnNcIjtcbmltcG9ydCB7IGNvbnZlcnRUZXh0LCBzY2FuVGV4dCwgYnVpbGRTY2FuUmVzdWx0LCBTY2FuUmVzdWx0IH0gZnJvbSBcIi4vc2NhblwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1pZ3JhdGlvbk1hbmlmZXN0IHtcbiAgcGx1Z2luOiBcImhpZ2hsaWdodC1taWdyYXRvclwiO1xuICB2ZXJzaW9uOiAxO1xuICBjcmVhdGVkQXQ6IHN0cmluZztcbiAgYmFja3VwRm9sZGVyOiBzdHJpbmc7XG4gIGluY2x1ZGVDbGFzczogYm9vbGVhbjtcbiAgbWFwcGluZzogUmVjb3JkPHN0cmluZywgVGFyZ2V0PjtcbiAgZmlsZXM6IHsgcGF0aDogc3RyaW5nOyBiYWNrdXA6IHN0cmluZzsgY2hhbmdlZDogbnVtYmVyIH1bXTtcbiAgdG90YWxDaGFuZ2VkOiBudW1iZXI7XG4gIHRvdGFsU2tpcHBlZDogbnVtYmVyO1xufVxuXG5jb25zdCBNQU5JRkVTVF9OQU1FID0gXCJtYW5pZmVzdC5qc29uXCI7XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUZvbGRlcihhcHA6IEFwcCwgZm9sZGVyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcGFydHMgPSBub3JtYWxpemVQYXRoKGZvbGRlcikuc3BsaXQoXCIvXCIpO1xuICBsZXQgY3VyID0gXCJcIjtcbiAgZm9yIChjb25zdCBwIG9mIHBhcnRzKSB7XG4gICAgaWYgKCFwKSBjb250aW51ZTtcbiAgICBjdXIgPSBjdXIgPyBgJHtjdXJ9LyR7cH1gIDogcDtcbiAgICBpZiAoIWFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VyKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihjdXIpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIElnbm9yZSBcImFscmVhZHkgZXhpc3RzXCIgcmFjZXMuXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBGaW5kIGEgYmFja3VwIGZvbGRlciBuYW1lIHRoYXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVuaXF1ZUJhY2t1cEZvbGRlcihhcHA6IEFwcCwgYmFzZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3Qgc3RhbXAgPSBuZXcgRGF0ZSgpXG4gICAgLnRvSVNPU3RyaW5nKClcbiAgICAucmVwbGFjZSgvWzouXS9nLCBcIi1cIilcbiAgICAucmVwbGFjZShcIlRcIiwgXCJfXCIpXG4gICAgLnNsaWNlKDAsIDE5KTtcbiAgbGV0IGNhbmRpZGF0ZSA9IG5vcm1hbGl6ZVBhdGgoYCR7YmFzZX0vJHtzdGFtcH1gKTtcbiAgbGV0IG4gPSAyO1xuICB3aGlsZSAoYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjYW5kaWRhdGUpKSB7XG4gICAgY2FuZGlkYXRlID0gbm9ybWFsaXplUGF0aChgJHtiYXNlfS8ke3N0YW1wfS0ke24rK31gKTtcbiAgfVxuICByZXR1cm4gY2FuZGlkYXRlO1xufVxuXG4vKiogQWxsIG1hcmtkb3duIGZpbGVzIGluIHRoZSB2YXVsdC4gKi9cbmZ1bmN0aW9uIG1hcmtkb3duRmlsZXMoYXBwOiBBcHApOiBURmlsZVtdIHtcbiAgcmV0dXJuIGFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG59XG5cbi8qKiBTY2FuIHRoZSB3aG9sZSB2YXVsdCBhbmQgcmV0dXJuIGdyb3VwZWQgcmVzdWx0cy4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzY2FuVmF1bHQoXG4gIGFwcDogQXBwLFxuICBpbmNsdWRlQ2xhc3M6IGJvb2xlYW4sXG4gIHNraXBGb2xkZXJzOiBzdHJpbmdbXVxuKTogUHJvbWlzZTxTY2FuUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVzID0gbWFya2Rvd25GaWxlcyhhcHApLmZpbHRlcihcbiAgICAoZikgPT4gIXNraXBGb2xkZXJzLnNvbWUoKHMpID0+IHMgJiYgZi5wYXRoLnN0YXJ0c1dpdGgocyArIFwiL1wiKSlcbiAgKTtcbiAgY29uc3Qgc2Nhbm5lZDogeyBwYXRoOiBzdHJpbmc7IHNjYW46IFJldHVyblR5cGU8dHlwZW9mIHNjYW5UZXh0PiB9W10gPSBbXTtcbiAgZm9yIChjb25zdCBmIG9mIGZpbGVzKSB7XG4gICAgY29uc3QgdGV4dCA9IGF3YWl0IGFwcC52YXVsdC5jYWNoZWRSZWFkKGYpO1xuICAgIGlmICghdGV4dC5pbmNsdWRlcyhcIjxtYXJrXCIpKSBjb250aW51ZTtcbiAgICBjb25zdCBzY2FuID0gc2NhblRleHQodGV4dCwgaW5jbHVkZUNsYXNzKTtcbiAgICBpZiAoc2Nhbi5zaXplID4gMCkgc2Nhbm5lZC5wdXNoKHsgcGF0aDogZi5wYXRoLCBzY2FuIH0pO1xuICB9XG4gIHJldHVybiBidWlsZFNjYW5SZXN1bHQoc2Nhbm5lZCk7XG59XG5cbi8qKlxuICogQmFjayB1cCBldmVyeSBmaWxlIHRoYXQgd2lsbCBhY3R1YWxseSBjaGFuZ2UgdW5kZXIgYG1hcHBpbmdgLCB0aGVuIHJld3JpdGUgaXQuXG4gKiBSZXR1cm5zIHRoZSBtYW5pZmVzdCAoYWxzbyB3cml0dGVuIHRvIDxiYWNrdXBGb2xkZXI+L21hbmlmZXN0Lmpzb24pLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwbHlNaWdyYXRpb24oXG4gIGFwcDogQXBwLFxuICBtYXBwaW5nOiBSZWNvcmQ8c3RyaW5nLCBUYXJnZXQ+LFxuICBpbmNsdWRlQ2xhc3M6IGJvb2xlYW4sXG4gIGJhY2t1cEJhc2U6IHN0cmluZyxcbiAgc2tpcEZvbGRlcnM6IHN0cmluZ1tdXG4pOiBQcm9taXNlPE1pZ3JhdGlvbk1hbmlmZXN0PiB7XG4gIGNvbnN0IGJhY2t1cEZvbGRlciA9IGF3YWl0IHVuaXF1ZUJhY2t1cEZvbGRlcihhcHAsIGJhY2t1cEJhc2UpO1xuICBjb25zdCBmaWxlcyA9IG1hcmtkb3duRmlsZXMoYXBwKS5maWx0ZXIoXG4gICAgKGYpID0+XG4gICAgICAhc2tpcEZvbGRlcnMuc29tZSgocykgPT4gcyAmJiBmLnBhdGguc3RhcnRzV2l0aChzICsgXCIvXCIpKSAmJlxuICAgICAgIWYucGF0aC5zdGFydHNXaXRoKGJhY2t1cEJhc2UgKyBcIi9cIilcbiAgKTtcblxuICBjb25zdCBtYW5pZmVzdDogTWlncmF0aW9uTWFuaWZlc3QgPSB7XG4gICAgcGx1Z2luOiBcImhpZ2hsaWdodC1taWdyYXRvclwiLFxuICAgIHZlcnNpb246IDEsXG4gICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgYmFja3VwRm9sZGVyLFxuICAgIGluY2x1ZGVDbGFzcyxcbiAgICBtYXBwaW5nLFxuICAgIGZpbGVzOiBbXSxcbiAgICB0b3RhbENoYW5nZWQ6IDAsXG4gICAgdG90YWxTa2lwcGVkOiAwLFxuICB9O1xuXG4gIGxldCBjcmVhdGVkQmFja3VwUm9vdCA9IGZhbHNlO1xuXG4gIGZvciAoY29uc3QgZiBvZiBmaWxlcykge1xuICAgIGNvbnN0IG9yaWdpbmFsID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoZik7XG4gICAgaWYgKCFvcmlnaW5hbC5pbmNsdWRlcyhcIjxtYXJrXCIpKSBjb250aW51ZTtcbiAgICBjb25zdCB7IG91dCwgY2hhbmdlZCwgc2tpcHBlZCB9ID0gY29udmVydFRleHQob3JpZ2luYWwsIG1hcHBpbmcsIGluY2x1ZGVDbGFzcyk7XG4gICAgbWFuaWZlc3QudG90YWxTa2lwcGVkICs9IHNraXBwZWQ7XG4gICAgaWYgKGNoYW5nZWQgPT09IDAgfHwgb3V0ID09PSBvcmlnaW5hbCkgY29udGludWU7XG5cbiAgICBpZiAoIWNyZWF0ZWRCYWNrdXBSb290KSB7XG4gICAgICBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBiYWNrdXBGb2xkZXIpO1xuICAgICAgY3JlYXRlZEJhY2t1cFJvb3QgPSB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBiYWNrdXBQYXRoID0gbm9ybWFsaXplUGF0aChgJHtiYWNrdXBGb2xkZXJ9LyR7Zi5wYXRofWApO1xuICAgIGNvbnN0IGJhY2t1cERpciA9IGJhY2t1cFBhdGguc3BsaXQoXCIvXCIpLnNsaWNlKDAsIC0xKS5qb2luKFwiL1wiKTtcbiAgICBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBiYWNrdXBEaXIpO1xuICAgIC8vIENvcHkgdGhlIHVudG91Y2hlZCBvcmlnaW5hbCBpbnRvIHRoZSBiYWNrdXAgdHJlZS5cbiAgICBhd2FpdCBhcHAudmF1bHQuY3JlYXRlKGJhY2t1cFBhdGgsIG9yaWdpbmFsKTtcbiAgICAvLyBUaGVuIHJld3JpdGUgdGhlIGxpdmUgbm90ZS5cbiAgICBhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGYsIG91dCk7XG5cbiAgICBtYW5pZmVzdC5maWxlcy5wdXNoKHsgcGF0aDogZi5wYXRoLCBiYWNrdXA6IGJhY2t1cFBhdGgsIGNoYW5nZWQgfSk7XG4gICAgbWFuaWZlc3QudG90YWxDaGFuZ2VkICs9IGNoYW5nZWQ7XG4gIH1cblxuICBpZiAobWFuaWZlc3QuZmlsZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IG1hbmlmZXN0UGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7YmFja3VwRm9sZGVyfS8ke01BTklGRVNUX05BTUV9YCk7XG4gICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShtYW5pZmVzdFBhdGgsIEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKSk7XG4gIH1cbiAgcmV0dXJuIG1hbmlmZXN0O1xufVxuXG4vKiogTGlzdCBiYWNrdXAgZm9sZGVycyB0aGF0IGNvbnRhaW4gYSBtYW5pZmVzdCwgbmV3ZXN0IGZpcnN0LiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpc3RNYW5pZmVzdHMoXG4gIGFwcDogQXBwLFxuICBiYWNrdXBCYXNlOiBzdHJpbmdcbik6IFByb21pc2U8eyBmb2xkZXI6IHN0cmluZzsgbWFuaWZlc3Q6IE1pZ3JhdGlvbk1hbmlmZXN0IH1bXT4ge1xuICBjb25zdCBvdXQ6IHsgZm9sZGVyOiBzdHJpbmc7IG1hbmlmZXN0OiBNaWdyYXRpb25NYW5pZmVzdCB9W10gPSBbXTtcbiAgY29uc3Qgcm9vdCA9IGFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplUGF0aChiYWNrdXBCYXNlKSk7XG4gIGlmICghcm9vdCkgcmV0dXJuIG91dDtcbiAgY29uc3QgY2hpbGRyZW4gPSAocm9vdCBhcyBhbnkpLmNoaWxkcmVuID8/IFtdO1xuICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgY29uc3QgbWZQYXRoID0gbm9ybWFsaXplUGF0aChgJHtjaGlsZC5wYXRofS8ke01BTklGRVNUX05BTUV9YCk7XG4gICAgY29uc3QgbWYgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG1mUGF0aCk7XG4gICAgaWYgKG1mIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKGF3YWl0IGFwcC52YXVsdC5yZWFkKG1mKSkgYXMgTWlncmF0aW9uTWFuaWZlc3Q7XG4gICAgICAgIG91dC5wdXNoKHsgZm9sZGVyOiBjaGlsZC5wYXRoLCBtYW5pZmVzdDogZGF0YSB9KTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBTa2lwIHVucmVhZGFibGUgbWFuaWZlc3QuXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG91dC5zb3J0KChhLCBiKSA9PiBiLm1hbmlmZXN0LmNyZWF0ZWRBdC5sb2NhbGVDb21wYXJlKGEubWFuaWZlc3QuY3JlYXRlZEF0KSk7XG4gIHJldHVybiBvdXQ7XG59XG5cbi8qKiBSZXN0b3JlIGV2ZXJ5IGZpbGUgcmVjb3JkZWQgaW4gYSBtYW5pZmVzdCBmcm9tIGl0cyBiYWNrdXAgY29weS4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXZlcnRNaWdyYXRpb24oXG4gIGFwcDogQXBwLFxuICBtYW5pZmVzdDogTWlncmF0aW9uTWFuaWZlc3Rcbik6IFByb21pc2U8eyByZXN0b3JlZDogbnVtYmVyOyBtaXNzaW5nOiBzdHJpbmdbXSB9PiB7XG4gIGxldCByZXN0b3JlZCA9IDA7XG4gIGNvbnN0IG1pc3Npbmc6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgZW50cnkgb2YgbWFuaWZlc3QuZmlsZXMpIHtcbiAgICBjb25zdCBiYWNrdXAgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZW50cnkuYmFja3VwKSk7XG4gICAgaWYgKCEoYmFja3VwIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICBtaXNzaW5nLnB1c2goZW50cnkuYmFja3VwKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgYXBwLnZhdWx0LnJlYWQoYmFja3VwKTtcbiAgICBjb25zdCB0YXJnZXQgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZVBhdGgoZW50cnkucGF0aCkpO1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgYXdhaXQgYXBwLnZhdWx0Lm1vZGlmeSh0YXJnZXQsIGNvbnRlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBkaXIgPSBlbnRyeS5wYXRoLnNwbGl0KFwiL1wiKS5zbGljZSgwLCAtMSkuam9pbihcIi9cIik7XG4gICAgICBpZiAoZGlyKSBhd2FpdCBlbnN1cmVGb2xkZXIoYXBwLCBkaXIpO1xuICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShlbnRyeS5wYXRoLCBjb250ZW50KTtcbiAgICB9XG4gICAgcmVzdG9yZWQrKztcbiAgfVxuICByZXR1cm4geyByZXN0b3JlZCwgbWlzc2luZyB9O1xufVxuXG4vKiogV3JpdGUgYSBodW1hbi1yZWFkYWJsZSArIEpTT04gc2NhbiByZXBvcnQgbm90ZTsgcmV0dXJucyBpdHMgcGF0aC4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZVJlcG9ydChcbiAgYXBwOiBBcHAsXG4gIHJlc3VsdDogU2NhblJlc3VsdCxcbiAgcmVwb3J0Rm9sZGVyOiBzdHJpbmcsXG4gIG1hcHBpbmc6IFJlY29yZDxzdHJpbmcsIFRhcmdldD5cbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGF3YWl0IGVuc3VyZUZvbGRlcihhcHAsIHJlcG9ydEZvbGRlcik7XG4gIGNvbnN0IHN0YW1wID0gbmV3IERhdGUoKVxuICAgIC50b0lTT1N0cmluZygpXG4gICAgLnJlcGxhY2UoL1s6Ll0vZywgXCItXCIpXG4gICAgLnJlcGxhY2UoXCJUXCIsIFwiX1wiKVxuICAgIC5zbGljZSgwLCAxOSk7XG4gIC8vIEF2b2lkIGNsb2JiZXJpbmcgYW4gZXhpc3RpbmcgcmVwb3J0IGlmIHR3byBydW4gaW4gdGhlIHNhbWUgc2Vjb25kLlxuICBsZXQgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cmVwb3J0Rm9sZGVyfS9IaWdobGlnaHQgc2NhbiAke3N0YW1wfS5tZGApO1xuICBsZXQgbiA9IDI7XG4gIHdoaWxlIChhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpKSB7XG4gICAgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7cmVwb3J0Rm9sZGVyfS9IaWdobGlnaHQgc2NhbiAke3N0YW1wfS0ke24rK30ubWRgKTtcbiAgfVxuXG4gIGNvbnN0IGxpbmVzOiBzdHJpbmdbXSA9IFtdO1xuICBsaW5lcy5wdXNoKFwiIyBIaWdobGlnaHQgc2NhbiByZXBvcnRcIiwgXCJcIik7XG4gIGxpbmVzLnB1c2goYC0gU2Nhbm5lZDogJHtzdGFtcH1gKTtcbiAgbGluZXMucHVzaChgLSBEaXN0aW5jdCBjb2xvdXJzOiAke3Jlc3VsdC5ncm91cHMubGVuZ3RofWApO1xuICBsaW5lcy5wdXNoKGAtIENvbnZlcnRpYmxlIGhpZ2hsaWdodHM6ICR7cmVzdWx0LnRvdGFsTWF0Y2hlc31gKTtcbiAgbGluZXMucHVzaChgLSBVbnNhZmUgKHNraXBwZWQpIGhpZ2hsaWdodHM6ICR7cmVzdWx0LnRvdGFsVW5zYWZlfWApO1xuICBsaW5lcy5wdXNoKGAtIEFmZmVjdGVkIG5vdGVzOiAke3Jlc3VsdC5maWxlQ291bnR9YCwgXCJcIik7XG4gIGxpbmVzLnB1c2goXCIjIyBDb2xvdXJzXCIsIFwiXCIpO1xuICBmb3IgKGNvbnN0IGcgb2YgcmVzdWx0Lmdyb3Vwcykge1xuICAgIGNvbnN0IHRhcmdldCA9IG1hcHBpbmdbZy5rZXldID8/IGcuc3VnZ2VzdGVkO1xuICAgIGxpbmVzLnB1c2goXG4gICAgICBgLSAqKiR7Zy5yYXd9KiogKCR7Zy5tb2RlfSkgXHUyMTkyIFxcYCR7dGFyZ2V0fVxcYCBcdTIwMTQgJHtnLmNvdW50fSBoaWdobGlnaHQocylgICtcbiAgICAgICAgKGcudW5zYWZlID8gYCwgJHtnLnVuc2FmZX0gdW5zYWZlYCA6IFwiXCIpICtcbiAgICAgICAgYCBhY3Jvc3MgJHtnLmZpbGVzLnNpemV9IG5vdGUocylgXG4gICAgKTtcbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgWy4uLmcuZmlsZXNdLnNvcnQoKSkgbGluZXMucHVzaChgICAtICR7ZmlsZX1gKTtcbiAgfVxuICBsaW5lcy5wdXNoKFwiXCIsIFwiIyMgTWFjaGluZS1yZWFkYWJsZVwiLCBcIlwiLCBcImBgYGpzb25cIik7XG4gIGxpbmVzLnB1c2goXG4gICAgSlNPTi5zdHJpbmdpZnkoXG4gICAgICB7XG4gICAgICAgIHNjYW5uZWRBdDogc3RhbXAsXG4gICAgICAgIHRvdGFsczoge1xuICAgICAgICAgIGRpc3RpbmN0Q29sb3VyczogcmVzdWx0Lmdyb3Vwcy5sZW5ndGgsXG4gICAgICAgICAgY29udmVydGlibGU6IHJlc3VsdC50b3RhbE1hdGNoZXMsXG4gICAgICAgICAgdW5zYWZlOiByZXN1bHQudG90YWxVbnNhZmUsXG4gICAgICAgICAgYWZmZWN0ZWROb3RlczogcmVzdWx0LmZpbGVDb3VudCxcbiAgICAgICAgfSxcbiAgICAgICAgY29sb3VyczogcmVzdWx0Lmdyb3Vwcy5tYXAoKGcpID0+ICh7XG4gICAgICAgICAga2V5OiBnLmtleSxcbiAgICAgICAgICByYXc6IGcucmF3LFxuICAgICAgICAgIG1vZGU6IGcubW9kZSxcbiAgICAgICAgICBjb3VudDogZy5jb3VudCxcbiAgICAgICAgICB1bnNhZmU6IGcudW5zYWZlLFxuICAgICAgICAgIHN1Z2dlc3RlZDogZy5zdWdnZXN0ZWQsXG4gICAgICAgICAgdGFyZ2V0OiBtYXBwaW5nW2cua2V5XSA/PyBnLnN1Z2dlc3RlZCxcbiAgICAgICAgICBmaWxlczogWy4uLmcuZmlsZXNdLnNvcnQoKSxcbiAgICAgICAgfSkpLFxuICAgICAgfSxcbiAgICAgIG51bGwsXG4gICAgICAyXG4gICAgKVxuICApO1xuICBsaW5lcy5wdXNoKFwiYGBgXCIsIFwiXCIpO1xuXG4gIGF3YWl0IGFwcC52YXVsdC5jcmVhdGUocGF0aCwgbGluZXMuam9pbihcIlxcblwiKSk7XG4gIHJldHVybiBwYXRoO1xufVxuIiwgImltcG9ydCB7XG4gIE5hdGl2ZUNvbG9yLFxuICBUYXJnZXQsXG4gIE5BVElWRV9FTU9KSSxcbiAgcGFyc2VIZXgsXG4gIG5lYXJlc3ROYXRpdmUsXG4gIGtub3duSGlnaGxpZ2h0ckNvbG9yLFxuICBndWVzc0Zyb21DbGFzcyxcbiAgUkdCLFxufSBmcm9tIFwiLi9jb2xvcnNcIjtcblxuZXhwb3J0IHR5cGUgTW9kZSA9IFwiaGV4XCIgfCBcImNsYXNzXCI7XG5cbi8vIE9uZSBkaXN0aW5jdCBzb3VyY2UgY29sb3VyIGZvdW5kIGFjcm9zcyB0aGUgdmF1bHQuXG5leHBvcnQgaW50ZXJmYWNlIENvbG9yR3JvdXAge1xuICBrZXk6IHN0cmluZzsgLy8gXCIjUlJHR0JCQUFcIiAodXBwZXIpIGZvciBoZXgsIG9yIFwiaGx0ci14eHhcIiBmb3IgY2xhc3NcbiAgbW9kZTogTW9kZTtcbiAgcmdiOiBSR0IgfCBudWxsOyAvLyBmb3IgaGV4IGdyb3Vwc1xuICByYXc6IHN0cmluZzsgLy8gcmVwcmVzZW50YXRpdmUgcmF3IHZhbHVlIChvcmlnaW5hbCBoZXggaW5jbC4gYWxwaGEsIG9yIGNsYXNzKVxuICBjb3VudDogbnVtYmVyOyAvLyBjb252ZXJ0aWJsZSBvY2N1cnJlbmNlc1xuICB1bnNhZmU6IG51bWJlcjsgLy8gb2NjdXJyZW5jZXMgc2tpcHBlZCBhcyByaXNreSAobXVsdGlsaW5lIC8gY29udGFpbnMgPT0pXG4gIGZpbGVzOiBTZXQ8c3RyaW5nPjtcbiAgc3VnZ2VzdGVkOiBUYXJnZXQ7IC8vIG5lYXJlc3QtY29sb3VyIHN1Z2dlc3Rpb25cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTY2FuUmVzdWx0IHtcbiAgZ3JvdXBzOiBDb2xvckdyb3VwW107XG4gIHRvdGFsTWF0Y2hlczogbnVtYmVyO1xuICB0b3RhbFVuc2FmZTogbnVtYmVyO1xuICBmaWxlQ291bnQ6IG51bWJlcjtcbn1cblxuLy8gTWF0Y2ggYW55IDxtYXJrIC4uLj4uLi48L21hcms+LiBOb24tZ3JlZWR5IGlubmVyIHNvIGFkamFjZW50IG1hcmtzIHN0YXkgc2VwYXJhdGUuXG5jb25zdCBNQVJLX1JFID0gLzxtYXJrXFxiKFtePl0qKT4oW1xcc1xcU10qPyk8XFwvbWFyaz4vZ2k7XG5cbmludGVyZmFjZSBDbGFzc2lmaWVkIHtcbiAgbW9kZTogTW9kZTtcbiAga2V5OiBzdHJpbmc7XG4gIHJhdzogc3RyaW5nO1xuICByZ2I6IFJHQiB8IG51bGw7XG59XG5cbi8qKiBJZGVudGlmeSBhIDxtYXJrPidzIGNvbG91ciBmcm9tIGl0cyBhdHRyaWJ1dGUgc3RyaW5nLiBIZXggd2lucyBvdmVyIGNsYXNzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzaWZ5KGF0dHJzOiBzdHJpbmcsIGluY2x1ZGVDbGFzczogYm9vbGVhbik6IENsYXNzaWZpZWQgfCBudWxsIHtcbiAgY29uc3Qgc3R5bGVNID0gYXR0cnMubWF0Y2goL3N0eWxlXFxzKj1cXHMqXCIoW15cIl0qKVwiL2kpO1xuICBpZiAoc3R5bGVNKSB7XG4gICAgY29uc3QgYmcgPSBzdHlsZU1bMV0ubWF0Y2goXG4gICAgICAvYmFja2dyb3VuZCg/Oi1jb2xvcik/XFxzKjpcXHMqKCNbMC05QS1GYS1mXXs2LDh9KS9pXG4gICAgKTtcbiAgICBpZiAoYmcpIHtcbiAgICAgIGNvbnN0IHJhdyA9IGJnWzFdO1xuICAgICAgY29uc3Qga2V5ID0gXCIjXCIgKyByYXcuc2xpY2UoMSkudG9VcHBlckNhc2UoKTtcbiAgICAgIHJldHVybiB7IG1vZGU6IFwiaGV4XCIsIGtleSwgcmF3LCByZ2I6IHBhcnNlSGV4KHJhdykgfTtcbiAgICB9XG4gIH1cbiAgaWYgKGluY2x1ZGVDbGFzcykge1xuICAgIGNvbnN0IGNsYXNzTSA9IGF0dHJzLm1hdGNoKC9jbGFzc1xccyo9XFxzKlwiKFteXCJdKilcIi9pKTtcbiAgICBpZiAoY2xhc3NNKSB7XG4gICAgICBjb25zdCBoID0gY2xhc3NNWzFdLm1hdGNoKC9obHRyLVthLXowLTktXSsvaSk7XG4gICAgICBpZiAoaCkge1xuICAgICAgICBjb25zdCBrZXkgPSBoWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiB7IG1vZGU6IFwiY2xhc3NcIiwga2V5LCByYXc6IGtleSwgcmdiOiBudWxsIH07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogQW4gb2NjdXJyZW5jZSBpcyB1bnNhZmUgdG8gYXV0by1jb252ZXJ0IGlmIGl0IHNwYW5zIGxpbmVzIG9yIGhvbGRzIG1hcmt1cC4gKi9cbmZ1bmN0aW9uIGlzVW5zYWZlKGlubmVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBpbm5lci5pbmNsdWRlcyhcIlxcblwiKSB8fFxuICAgIGlubmVyLmluY2x1ZGVzKFwiPT1cIikgfHxcbiAgICBpbm5lci5pbmNsdWRlcyhcIjxtYXJrXCIpIHx8XG4gICAgaW5uZXIuaW5jbHVkZXMoXCI8L21hcmtcIilcbiAgKTtcbn1cblxuLyoqIFNjYW4gYSBzaW5nbGUgZmlsZSdzIHRleHQ7IGFjY3VtdWxhdGUgcGVyLWNvbG91ciBjb3VudHMuICovXG5leHBvcnQgZnVuY3Rpb24gc2NhblRleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgaW5jbHVkZUNsYXNzOiBib29sZWFuXG4pOiBNYXA8c3RyaW5nLCB7IHJnYjogUkdCIHwgbnVsbDsgcmF3OiBzdHJpbmc7IG1vZGU6IE1vZGU7IGNvdW50OiBudW1iZXI7IHVuc2FmZTogbnVtYmVyIH0+IHtcbiAgY29uc3Qgb3V0ID0gbmV3IE1hcDxcbiAgICBzdHJpbmcsXG4gICAgeyByZ2I6IFJHQiB8IG51bGw7IHJhdzogc3RyaW5nOyBtb2RlOiBNb2RlOyBjb3VudDogbnVtYmVyOyB1bnNhZmU6IG51bWJlciB9XG4gID4oKTtcbiAgTUFSS19SRS5sYXN0SW5kZXggPSAwO1xuICBsZXQgbTogUmVnRXhwRXhlY0FycmF5IHwgbnVsbDtcbiAgd2hpbGUgKChtID0gTUFSS19SRS5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGMgPSBjbGFzc2lmeShtWzFdLCBpbmNsdWRlQ2xhc3MpO1xuICAgIGlmICghYykgY29udGludWU7XG4gICAgY29uc3QgcmVjID1cbiAgICAgIG91dC5nZXQoYy5rZXkpID8/XG4gICAgICB7IHJnYjogYy5yZ2IsIHJhdzogYy5yYXcsIG1vZGU6IGMubW9kZSwgY291bnQ6IDAsIHVuc2FmZTogMCB9O1xuICAgIGlmIChpc1Vuc2FmZShtWzJdKSkgcmVjLnVuc2FmZSsrO1xuICAgIGVsc2UgcmVjLmNvdW50Kys7XG4gICAgb3V0LnNldChjLmtleSwgcmVjKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBzdWdnZXN0Rm9yKG1vZGU6IE1vZGUsIHJnYjogUkdCIHwgbnVsbCwga2V5OiBzdHJpbmcpOiBUYXJnZXQge1xuICBpZiAobW9kZSA9PT0gXCJoZXhcIikge1xuICAgIHJldHVybiBrbm93bkhpZ2hsaWdodHJDb2xvcihrZXkpID8/IChyZ2IgPyBuZWFyZXN0TmF0aXZlKHJnYikgOiBcInNraXBcIik7XG4gIH1cbiAgaWYgKG1vZGUgPT09IFwiY2xhc3NcIikgcmV0dXJuIGd1ZXNzRnJvbUNsYXNzKGtleSkgPz8gXCJza2lwXCI7XG4gIHJldHVybiBcInNraXBcIjtcbn1cblxuLyoqXG4gKiBBZ2dyZWdhdGUgc2Nhbm5lZCBmaWxlcyBpbnRvIHZhdWx0LXdpZGUgY29sb3VyIGdyb3Vwcy5cbiAqIGBmaWxlc2AgaXMgYSBsaXN0IG9mIHsgcGF0aCwgc2NhbiB9IHdoZXJlIGBzY2FuYCBpcyB0aGUgbWFwIGZyb20gc2NhblRleHQoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkU2NhblJlc3VsdChcbiAgZmlsZXM6IHsgcGF0aDogc3RyaW5nOyBzY2FuOiBSZXR1cm5UeXBlPHR5cGVvZiBzY2FuVGV4dD4gfVtdXG4pOiBTY2FuUmVzdWx0IHtcbiAgY29uc3QgZ3JvdXBzID0gbmV3IE1hcDxzdHJpbmcsIENvbG9yR3JvdXA+KCk7XG4gIGxldCB0b3RhbE1hdGNoZXMgPSAwO1xuICBsZXQgdG90YWxVbnNhZmUgPSAwO1xuICBjb25zdCB0b3VjaGVkRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IGYgb2YgZmlsZXMpIHtcbiAgICBsZXQgZmlsZVRvdWNoZWQgPSBmYWxzZTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGluZm9dIG9mIGYuc2Nhbikge1xuICAgICAgbGV0IGcgPSBncm91cHMuZ2V0KGtleSk7XG4gICAgICBpZiAoIWcpIHtcbiAgICAgICAgZyA9IHtcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbW9kZTogaW5mby5tb2RlLFxuICAgICAgICAgIHJnYjogaW5mby5yZ2IsXG4gICAgICAgICAgcmF3OiBpbmZvLnJhdyxcbiAgICAgICAgICBjb3VudDogMCxcbiAgICAgICAgICB1bnNhZmU6IDAsXG4gICAgICAgICAgZmlsZXM6IG5ldyBTZXQ8c3RyaW5nPigpLFxuICAgICAgICAgIHN1Z2dlc3RlZDogc3VnZ2VzdEZvcihpbmZvLm1vZGUsIGluZm8ucmdiLCBrZXkpLFxuICAgICAgICB9O1xuICAgICAgICBncm91cHMuc2V0KGtleSwgZyk7XG4gICAgICB9XG4gICAgICBnLmNvdW50ICs9IGluZm8uY291bnQ7XG4gICAgICBnLnVuc2FmZSArPSBpbmZvLnVuc2FmZTtcbiAgICAgIGcuZmlsZXMuYWRkKGYucGF0aCk7XG4gICAgICB0b3RhbE1hdGNoZXMgKz0gaW5mby5jb3VudDtcbiAgICAgIHRvdGFsVW5zYWZlICs9IGluZm8udW5zYWZlO1xuICAgICAgaWYgKGluZm8uY291bnQgPiAwIHx8IGluZm8udW5zYWZlID4gMCkgZmlsZVRvdWNoZWQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoZmlsZVRvdWNoZWQpIHRvdWNoZWRGaWxlcy5hZGQoZi5wYXRoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ3JvdXBzOiBbLi4uZ3JvdXBzLnZhbHVlcygpXS5zb3J0KChhLCBiKSA9PiBiLmNvdW50IC0gYS5jb3VudCksXG4gICAgdG90YWxNYXRjaGVzLFxuICAgIHRvdGFsVW5zYWZlLFxuICAgIGZpbGVDb3VudDogdG91Y2hlZEZpbGVzLnNpemUsXG4gIH07XG59XG5cbi8qKlxuICogUmV3cml0ZSA8bWFyaz4gaGlnaGxpZ2h0cyBpbiBgdGV4dGAgcGVyIHRoZSBtYXBwaW5nLlxuICogUmV0dXJucyB0aGUgbmV3IHRleHQgcGx1cyBob3cgbWFueSBtYXJrcyBjaGFuZ2VkIC8gd2VyZSBza2lwcGVkLlxuICogQSBtYXBwaW5nIHZhbHVlIG9mIFwic2tpcFwiIChvciBhIGtleSBub3QgcHJlc2VudCkgbGVhdmVzIHRoZSBtYXJrIHVudG91Y2hlZC5cbiAqIFwiZGVmYXVsdFwiIHByb2R1Y2VzID09dGV4dD09OyBhIG5hdGl2ZSBjb2xvdXIgcHJvZHVjZXMgPT08ZW1vamk+dGV4dD09LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udmVydFRleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgbWFwcGluZzogUmVjb3JkPHN0cmluZywgVGFyZ2V0PixcbiAgaW5jbHVkZUNsYXNzOiBib29sZWFuXG4pOiB7IG91dDogc3RyaW5nOyBjaGFuZ2VkOiBudW1iZXI7IHNraXBwZWQ6IG51bWJlciB9IHtcbiAgbGV0IGNoYW5nZWQgPSAwO1xuICBsZXQgc2tpcHBlZCA9IDA7XG4gIGNvbnN0IG91dCA9IHRleHQucmVwbGFjZShNQVJLX1JFLCAoZnVsbCwgYXR0cnM6IHN0cmluZywgaW5uZXI6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGMgPSBjbGFzc2lmeShhdHRycywgaW5jbHVkZUNsYXNzKTtcbiAgICBpZiAoIWMpIHJldHVybiBmdWxsO1xuICAgIGNvbnN0IHRhcmdldCA9IG1hcHBpbmdbYy5rZXldO1xuICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldCA9PT0gXCJza2lwXCIpIHJldHVybiBmdWxsO1xuICAgIGlmIChpc1Vuc2FmZShpbm5lcikpIHtcbiAgICAgIHNraXBwZWQrKztcbiAgICAgIHJldHVybiBmdWxsO1xuICAgIH1cbiAgICBjaGFuZ2VkKys7XG4gICAgaWYgKHRhcmdldCA9PT0gXCJkZWZhdWx0XCIpIHJldHVybiBgPT0ke2lubmVyfT09YDtcbiAgICByZXR1cm4gYD09JHtOQVRJVkVfRU1PSklbdGFyZ2V0IGFzIE5hdGl2ZUNvbG9yXX0ke2lubmVyfT09YDtcbiAgfSk7XG4gIHJldHVybiB7IG91dCwgY2hhbmdlZCwgc2tpcHBlZCB9O1xufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIENvbmZpcm1Nb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgY29uc3RydWN0b3IoXG4gICAgYXBwOiBBcHAsXG4gICAgcHJpdmF0ZSB0aXRsZTogc3RyaW5nLFxuICAgIHByaXZhdGUgYm9keTogc3RyaW5nLFxuICAgIHByaXZhdGUgY3RhOiBzdHJpbmcsXG4gICAgcHJpdmF0ZSBvbkNvbmZpcm06ICgpID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+XG4gICkge1xuICAgIHN1cGVyKGFwcCk7XG4gIH1cblxuICBvbk9wZW4oKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmNyZWF0ZUVsKFwiaDNcIiwgeyB0ZXh0OiB0aGlzLnRpdGxlIH0pO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiB0aGlzLmJvZHkgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLmFkZEJ1dHRvbigoYikgPT5cbiAgICAgICAgYi5zZXRCdXR0b25UZXh0KFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5jbG9zZSgpKVxuICAgICAgKVxuICAgICAgLmFkZEJ1dHRvbigoYikgPT5cbiAgICAgICAgYlxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KHRoaXMuY3RhKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMub25Db25maXJtKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG1CQUE4RTs7O0FDQTlFLElBQUFDLG1CQUFnRDs7O0FDVXpDLElBQU0sZUFBOEI7QUFBQSxFQUN6QztBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0Y7QUFFTyxJQUFNLGVBQTRDO0FBQUEsRUFDdkQsS0FBSztBQUFBLEVBQ0wsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUNWO0FBRU8sSUFBTSxlQUE0QztBQUFBLEVBQ3ZELEtBQUs7QUFBQSxFQUNMLFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFBQSxFQUNSLE9BQU87QUFBQSxFQUNQLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFDVjtBQUdPLElBQU0sZ0JBQTZDO0FBQUEsRUFDeEQsS0FBSztBQUFBLEVBQ0wsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsTUFBTTtBQUFBLEVBQ04s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QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixTQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxrQkFBa0IsTUFBTSxLQUFLLFNBQVMsQ0FBQztBQUFBLEVBQzNFO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxLQUFLLFNBQVMsS0FBSyxRQUFRO0FBQUEsRUFDbkM7QUFDRjtBQUVBLElBQU0sZUFBTixjQUEyQixrQ0FBaUI7QUFBQSxFQUcxQyxZQUFZLEtBQVUsUUFBaUM7QUFDckQsVUFBTSxLQUFLLE1BQU07QUFDakIsU0FBSyxTQUFTO0FBQUEsRUFDaEI7QUFBQSxFQUVBLFVBQWdCO0FBQ2QsVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBRWxCLFFBQUkseUJBQVEsV0FBVyxFQUNwQixRQUFRLGdDQUFnQyxFQUN4QyxRQUFRLDBGQUEwRixFQUNsRztBQUFBLE1BQVUsQ0FBQyxNQUNWLEVBQUUsU0FBUyxLQUFLLE9BQU8sU0FBUyxZQUFZLEVBQUUsU0FBUyxPQUFPLE1BQU07QUFDbEUsYUFBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFFRixRQUFJLHlCQUFRLFdBQVcsRUFDcEIsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEseUZBQXlGLEVBQ2pHO0FBQUEsTUFBUSxDQUFDLE1BQ1IsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLFlBQVksRUFBRSxTQUFTLE9BQU8sTUFBTTtBQUNsRSxhQUFLLE9BQU8sU0FBUyxlQUFlLEVBQUUsS0FBSyxLQUFLO0FBQ2hELGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNqQyxDQUFDO0FBQUEsSUFDSDtBQUVGLFFBQUkseUJBQVEsV0FBVyxFQUNwQixRQUFRLGVBQWUsRUFDdkIsUUFBUSxtREFBbUQsRUFDM0Q7QUFBQSxNQUFRLENBQUMsTUFDUixFQUFFLFNBQVMsS0FBSyxPQUFPLFNBQVMsWUFBWSxFQUFFLFNBQVMsT0FBTyxNQUFNO0FBQ2xFLGFBQUssT0FBTyxTQUFTLGVBQWUsRUFBRSxLQUFLLEtBQUs7QUFDaEQsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2pDLENBQUM7QUFBQSxJQUNIO0FBRUYsUUFBSSx5QkFBUSxXQUFXLEVBQ3BCLFFBQVEsOEJBQThCLEVBQ3RDLFFBQVEsaUVBQWlFLEVBQ3pFO0FBQUEsTUFBVSxDQUFDLE1BQ1YsRUFBRSxTQUFTLEtBQUssT0FBTyxTQUFTLGtCQUFrQixFQUFFLFNBQVMsT0FBTyxNQUFNO0FBQ3hFLGFBQUssT0FBTyxTQUFTLHFCQUFxQjtBQUMxQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDakMsQ0FBQztBQUFBLElBQ0g7QUFBQSxFQUNKO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=
