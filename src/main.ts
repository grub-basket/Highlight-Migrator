import { Plugin, WorkspaceLeaf, Notice, PluginSettingTab, App, Setting } from "obsidian";
import { HighlightMigratorView, VIEW_TYPE } from "./view";
import { listManifests, revertMigration } from "./migrate";
import { ConfirmModal } from "./modals";

export interface HmSettings {
  includeClass: boolean;
  backupFolder: string;
  reportFolder: string;
  writeReportOnApply: boolean;
}

const DEFAULT_SETTINGS: HmSettings = {
  includeClass: true,
  backupFolder: "_highlight-backup",
  reportFolder: "Highlight Migration",
  writeReportOnApply: true,
};

export default class HighlightMigratorPlugin extends Plugin {
  settings: HmSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new HighlightMigratorView(leaf, this));

    this.addRibbonIcon("highlighter", "Highlight Migrator", () => this.openView());

    this.addCommand({
      id: "open-highlight-migrator",
      name: "Open migrator (scan & map)",
      callback: () => this.openView(),
    });

    this.addCommand({
      id: "revert-last-highlight-migration",
      name: "Revert last migration",
      callback: () => this.revertLast(),
    });

    this.addSettingTab(new HmSettingTab(this.app, this));
  }

  onunload() {}

  async openView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_TYPE)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async revertLast() {
    const manifests = await listManifests(this.app, this.settings.backupFolder);
    if (manifests.length === 0) {
      new Notice("Highlight Migrator: no migrations to revert.");
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
        new Notice(
          `Highlight Migrator: restored ${restored} note(s)` +
            (missing.length ? `, ${missing.length} backup(s) missing.` : ".")
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
}

class HmSettingTab extends PluginSettingTab {
  plugin: HighlightMigratorPlugin;

  constructor(app: App, plugin: HighlightMigratorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Convert class-based highlights")
      .setDesc('Also match Highlightr class markup like <mark class="hltr-orange">, not only inline hex.')
      .addToggle((t) =>
        t.setValue(this.plugin.settings.includeClass).onChange(async (v) => {
          this.plugin.settings.includeClass = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Backup folder")
      .setDesc("Timestamped subfolders of untouched note copies are created here before any conversion.")
      .addText((t) =>
        t.setValue(this.plugin.settings.backupFolder).onChange(async (v) => {
          this.plugin.settings.backupFolder = v.trim() || "_highlight-backup";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Report folder")
      .setDesc("Scan report notes (tree + JSON) are written here.")
      .addText((t) =>
        t.setValue(this.plugin.settings.reportFolder).onChange(async (v) => {
          this.plugin.settings.reportFolder = v.trim() || "Highlight Migration";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Write a report when applying")
      .setDesc("Save a scan/mapping report note each time you run a conversion.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.writeReportOnApply).onChange(async (v) => {
          this.plugin.settings.writeReportOnApply = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
