import { App, normalizePath, TFile } from "obsidian";
import { Target } from "./colors";
import { convertText, scanText, buildScanResult, ScanResult } from "./scan";

export interface MigrationManifest {
  plugin: "highlight-migrator";
  version: 1;
  createdAt: string;
  backupFolder: string;
  includeClass: boolean;
  mapping: Record<string, Target>;
  files: { path: string; backup: string; changed: number }[];
  totalChanged: number;
  totalSkipped: number;
}

const MANIFEST_NAME = "manifest.json";

async function ensureFolder(app: App, folder: string): Promise<void> {
  const parts = normalizePath(folder).split("/");
  let cur = "";
  for (const p of parts) {
    if (!p) continue;
    cur = cur ? `${cur}/${p}` : p;
    if (!app.vault.getAbstractFileByPath(cur)) {
      try {
        await app.vault.createFolder(cur);
      } catch (e) {
        // Ignore "already exists" races.
      }
    }
  }
}

/** Find a backup folder name that doesn't already exist. */
export async function uniqueBackupFolder(app: App, base: string): Promise<string> {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  let candidate = normalizePath(`${base}/${stamp}`);
  let n = 2;
  while (app.vault.getAbstractFileByPath(candidate)) {
    candidate = normalizePath(`${base}/${stamp}-${n++}`);
  }
  return candidate;
}

/** All markdown files in the vault. */
function markdownFiles(app: App): TFile[] {
  return app.vault.getMarkdownFiles();
}

/** Scan the whole vault and return grouped results. */
export async function scanVault(
  app: App,
  includeClass: boolean,
  skipFolders: string[]
): Promise<ScanResult> {
  const files = markdownFiles(app).filter(
    (f) => !skipFolders.some((s) => s && f.path.startsWith(s + "/"))
  );
  const scanned: { path: string; scan: ReturnType<typeof scanText> }[] = [];
  for (const f of files) {
    const text = await app.vault.cachedRead(f);
    if (!text.includes("<mark")) continue;
    const scan = scanText(text, includeClass);
    if (scan.size > 0) scanned.push({ path: f.path, scan });
  }
  return buildScanResult(scanned);
}

/**
 * Back up every file that will actually change under `mapping`, then rewrite it.
 * Returns the manifest (also written to <backupFolder>/manifest.json).
 */
export async function applyMigration(
  app: App,
  mapping: Record<string, Target>,
  includeClass: boolean,
  backupBase: string,
  skipFolders: string[]
): Promise<MigrationManifest> {
  const backupFolder = await uniqueBackupFolder(app, backupBase);
  const files = markdownFiles(app).filter(
    (f) =>
      !skipFolders.some((s) => s && f.path.startsWith(s + "/")) &&
      !f.path.startsWith(backupBase + "/")
  );

  const manifest: MigrationManifest = {
    plugin: "highlight-migrator",
    version: 1,
    createdAt: new Date().toISOString(),
    backupFolder,
    includeClass,
    mapping,
    files: [],
    totalChanged: 0,
    totalSkipped: 0,
  };

  let createdBackupRoot = false;

  for (const f of files) {
    const original = await app.vault.read(f);
    if (!original.includes("<mark")) continue;
    const { out, changed, skipped } = convertText(original, mapping, includeClass);
    manifest.totalSkipped += skipped;
    if (changed === 0 || out === original) continue;

    if (!createdBackupRoot) {
      await ensureFolder(app, backupFolder);
      createdBackupRoot = true;
    }
    const backupPath = normalizePath(`${backupFolder}/${f.path}`);
    const backupDir = backupPath.split("/").slice(0, -1).join("/");
    await ensureFolder(app, backupDir);
    // Copy the untouched original into the backup tree.
    await app.vault.create(backupPath, original);
    // Then rewrite the live note.
    await app.vault.modify(f, out);

    manifest.files.push({ path: f.path, backup: backupPath, changed });
    manifest.totalChanged += changed;
  }

  if (manifest.files.length > 0) {
    const manifestPath = normalizePath(`${backupFolder}/${MANIFEST_NAME}`);
    await app.vault.create(manifestPath, JSON.stringify(manifest, null, 2));
  }
  return manifest;
}

/** List backup folders that contain a manifest, newest first. */
export async function listManifests(
  app: App,
  backupBase: string
): Promise<{ folder: string; manifest: MigrationManifest }[]> {
  const out: { folder: string; manifest: MigrationManifest }[] = [];
  const root = app.vault.getAbstractFileByPath(normalizePath(backupBase));
  if (!root) return out;
  const children = (root as any).children ?? [];
  for (const child of children) {
    const mfPath = normalizePath(`${child.path}/${MANIFEST_NAME}`);
    const mf = app.vault.getAbstractFileByPath(mfPath);
    if (mf instanceof TFile) {
      try {
        const data = JSON.parse(await app.vault.read(mf)) as MigrationManifest;
        out.push({ folder: child.path, manifest: data });
      } catch (e) {
        // Skip unreadable manifest.
      }
    }
  }
  out.sort((a, b) => b.manifest.createdAt.localeCompare(a.manifest.createdAt));
  return out;
}

/** Restore every file recorded in a manifest from its backup copy. */
export async function revertMigration(
  app: App,
  manifest: MigrationManifest
): Promise<{ restored: number; missing: string[] }> {
  let restored = 0;
  const missing: string[] = [];
  for (const entry of manifest.files) {
    const backup = app.vault.getAbstractFileByPath(normalizePath(entry.backup));
    if (!(backup instanceof TFile)) {
      missing.push(entry.backup);
      continue;
    }
    const content = await app.vault.read(backup);
    const target = app.vault.getAbstractFileByPath(normalizePath(entry.path));
    if (target instanceof TFile) {
      await app.vault.modify(target, content);
    } else {
      const dir = entry.path.split("/").slice(0, -1).join("/");
      if (dir) await ensureFolder(app, dir);
      await app.vault.create(entry.path, content);
    }
    restored++;
  }
  return { restored, missing };
}

/** Write a human-readable + JSON scan report note; returns its path. */
export async function writeReport(
  app: App,
  result: ScanResult,
  reportFolder: string,
  mapping: Record<string, Target>
): Promise<string> {
  await ensureFolder(app, reportFolder);
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  // Avoid clobbering an existing report if two run in the same second.
  let path = normalizePath(`${reportFolder}/Highlight scan ${stamp}.md`);
  let n = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = normalizePath(`${reportFolder}/Highlight scan ${stamp}-${n++}.md`);
  }

  const lines: string[] = [];
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
      `- **${g.raw}** (${g.mode}) → \`${target}\` — ${g.count} highlight(s)` +
        (g.unsafe ? `, ${g.unsafe} unsafe` : "") +
        ` across ${g.files.size} note(s)`
    );
    for (const file of [...g.files].sort()) lines.push(`  - ${file}`);
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
          affectedNotes: result.fileCount,
        },
        colours: result.groups.map((g) => ({
          key: g.key,
          raw: g.raw,
          mode: g.mode,
          count: g.count,
          unsafe: g.unsafe,
          suggested: g.suggested,
          target: mapping[g.key] ?? g.suggested,
          files: [...g.files].sort(),
        })),
      },
      null,
      2
    )
  );
  lines.push("```", "");

  await app.vault.create(path, lines.join("\n"));
  return path;
}
