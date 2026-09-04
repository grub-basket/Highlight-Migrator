import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type HighlightMigratorPlugin from "./main";
import {
  NATIVE_ORDER,
  NATIVE_LABEL,
  NATIVE_EMOJI,
  NATIVE_SWATCH,
  Target,
} from "./colors";
import { ScanResult } from "./scan";
import { scanVault, applyMigration, writeReport } from "./migrate";
import { ConfirmModal } from "./modals";

export const VIEW_TYPE = "highlight-migrator-view";

export class HighlightMigratorView extends ItemView {
  private result: ScanResult | null = null;
  private mapping: Record<string, Target> = {};
  private busy = false;

  constructor(leaf: WorkspaceLeaf, private plugin: HighlightMigratorPlugin) {
    super(leaf);
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
  async onClose() {}

  private get skipFolders(): string[] {
    return [this.plugin.settings.backupFolder, this.plugin.settings.reportFolder];
  }

  private async runScan() {
    if (this.busy) return;
    this.busy = true;
    try {
      new Notice("Highlight Migrator: scanning vault…");
      const result = await scanVault(
        this.plugin.app,
        this.plugin.settings.includeClass,
        this.skipFolders
      );
      this.result = result;
      // Seed mapping from suggestions, preserving any prior choices.
      for (const g of result.groups) {
        if (!(g.key in this.mapping)) this.mapping[g.key] = g.suggested;
      }
      new Notice(
        `Highlight Migrator: ${result.totalMatches} highlight(s), ${result.groups.length} colour(s), ${result.fileCount} note(s).`
      );
    } catch (e) {
      new Notice("Highlight Migrator: scan failed — see console.");
      console.error(e);
    } finally {
      this.busy = false;
      this.render();
    }
  }

  private plannedCounts(): {
    convert: number;
    skip: number;
    undecided: number;
    notes: number;
  } {
    let convert = 0;
    let skip = 0;
    let undecided = 0;
    const notes = new Set<string>();
    if (!this.result) return { convert, skip, undecided, notes: 0 };
    for (const g of this.result.groups) {
      const t = this.mapping[g.key] ?? "unset";
      if (t === "unset") {
        undecided += g.count;
      } else if (t === "skip") {
        skip += g.count;
      } else {
        convert += g.count;
        for (const f of g.files) notes.add(f);
      }
    }
    return { convert, skip, undecided, notes: notes.size };
  }

  private async runApply() {
    if (this.busy || !this.result) return;
    const plan = this.plannedCounts();
    if (plan.convert === 0) {
      new Notice(
        "Highlight Migrator: nothing mapped to a colour yet (choose colours for the rows you want to convert)."
      );
      return;
    }
    new ConfirmModal(
      this.plugin.app,
      "Back up and convert?",
      `This will copy ${plan.notes} affected note(s) into "${this.plugin.settings.backupFolder}/…" as a backup, then convert ${plan.convert} highlight(s). You can revert afterwards.`,
      "Back up & convert",
      async () => {
        this.busy = true;
        this.render();
        try {
          if (this.plugin.settings.writeReportOnApply) {
            await writeReport(
              this.plugin.app,
              this.result!,
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
          new Notice(
            `Highlight Migrator: converted ${manifest.totalChanged} highlight(s) in ${manifest.files.length} note(s). Backup: ${manifest.backupFolder}`
          );
        } catch (e) {
          new Notice("Highlight Migrator: conversion failed — see console.");
          console.error(e);
        } finally {
          this.busy = false;
          await this.runScan();
        }
      }
    ).open();
  }

  private async runReport() {
    if (!this.result) {
      new Notice("Highlight Migrator: scan first.");
      return;
    }
    const path = await writeReport(
      this.plugin.app,
      this.result,
      this.plugin.settings.reportFolder,
      this.mapping
    );
    new Notice(`Highlight Migrator: report written to ${path}`);
  }

  private render() {
    const c = this.containerEl.children[1] as HTMLElement;
    c.empty();
    c.addClass("hm-view");

    c.createEl("h2", { text: "Highlight Migrator" });
    c.createEl("p", {
      cls: "hm-intro",
      text: "Convert legacy <mark> HTML highlights to native highlight colours. Scan first, map each colour (or skip it), then back up and convert. Everything is reversible.",
    });

    // Toolbar
    const bar = c.createDiv({ cls: "hm-toolbar" });
    const scanBtn = bar.createEl("button", {
      text: this.busy ? "Working…" : "Scan vault",
      cls: "mod-cta",
    });
    scanBtn.disabled = this.busy;
    scanBtn.onclick = () => this.runScan();

    const reportBtn = bar.createEl("button", { text: "Write report" });
    reportBtn.disabled = this.busy || !this.result;
    reportBtn.onclick = () => this.runReport();

    if (!this.result) {
      c.createEl("p", {
        cls: "hm-empty",
        text: "No scan yet. Click “Scan vault” to find highlights.",
      });
      return;
    }

    // Summary
    const s = this.result;
    const sum = c.createDiv({ cls: "hm-summary" });
    sum.createEl("span", {
      text: `${s.totalMatches} convertible · ${s.totalUnsafe} unsafe · ${s.groups.length} colours · ${s.fileCount} notes`,
    });

    if (s.groups.length === 0) {
      c.createEl("p", {
        cls: "hm-empty",
        text: "No legacy <mark> highlights found. Nothing to migrate 🎉",
      });
      return;
    }

    // Table
    const table = c.createEl("table", { cls: "hm-table" });
    const head = table.createEl("thead").createEl("tr");
    ["Sample", "Source", "Count", "Notes", "Unsafe", "Map to"].forEach((h) =>
      head.createEl("th", { text: h })
    );
    const body = table.createEl("tbody");

    for (const g of s.groups) {
      const row = body.createEl("tr");

      // Sample swatch
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
      row.createEl("td", { text: g.unsafe ? String(g.unsafe) : "—" });

      // Mapping select
      const mapTd = row.createEl("td");
      const sel = mapTd.createEl("select", { cls: "dropdown hm-select" });
      const addOpt = (value: Target, label: string) => {
        const o = sel.createEl("option", { text: label, value });
        if ((this.mapping[g.key] ?? g.suggested) === value) o.selected = true;
      };
      addOpt("unset", "— choose —");
      addOpt("skip", "Skip (leave as-is)");
      addOpt("default", "Default (no colour)");
      for (const nc of NATIVE_ORDER) {
        addOpt(nc, `${NATIVE_EMOJI[nc]} ${NATIVE_LABEL[nc]}`);
      }
      // Preview chip of the target emoji
      const chip = mapTd.createSpan({ cls: "hm-chip" });
      const paintChip = () => {
        const t = this.mapping[g.key] ?? "unset";
        chip.style.color = "";
        if (t === "unset") chip.setText("(undecided)");
        else if (t === "skip") chip.setText("(kept as-is)");
        else if (t === "default") chip.setText("==·==");
        else {
          chip.setText(`==${NATIVE_EMOJI[t]}…==`);
          chip.style.color = NATIVE_SWATCH[t];
        }
      };
      paintChip();
      sel.onchange = () => {
        this.mapping[g.key] = sel.value as Target;
        paintChip();
        this.refreshPlan();
      };
    }

    // Footer / plan
    const footer = c.createDiv({ cls: "hm-footer" });
    this.planEl = footer.createDiv({ cls: "hm-plan" });
    this.refreshPlan();

    const actions = footer.createDiv({ cls: "hm-actions" });
    const applyBtn = actions.createEl("button", {
      text: "Back up & convert",
      cls: "mod-cta",
    });
    applyBtn.disabled = this.busy;
    applyBtn.onclick = () => this.runApply();

    const revertBtn = actions.createEl("button", { text: "Revert last migration" });
    revertBtn.disabled = this.busy;
    revertBtn.onclick = () => this.plugin.revertLast();
  }

  private planEl: HTMLElement | null = null;
  private refreshPlan() {
    if (!this.planEl) return;
    const p = this.plannedCounts();
    this.planEl.setText(
      `Plan: convert ${p.convert} highlight(s) in ${p.notes} note(s); skip ${p.skip}; undecided ${p.undecided}.`
    );
  }
}
