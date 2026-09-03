# Highlight Migrator

An Obsidian plugin that converts legacy `<mark>` HTML highlights — like those written by the Highlightr plugin — into Obsidian's native highlight colours (`==🔴text==`), with a guided, fully reversible workflow.

Obsidian's native highlight colours use an emoji marker right after the opening `==`. This plugin finds your existing HTML highlights, lets you decide how each colour maps, backs up every affected note, and then does the conversion — so a whole vault's worth of highlights moves over in one reviewed pass.

## Features

- **Vault scan** finds every legacy `<mark>` highlight and groups them by distinct colour, with per-colour occurrence and note counts. It detects both inline hex (`<mark style="background:#RRGGBBAA">`) and Highlightr class markup (`<mark class="hltr-…">`).
- **Full-tab review** shows a table that maps each source colour to a native colour (Red, Orange, Yellow, Green, Blue, Purple), plain Default (no colour), or Skip. Each row has a colour swatch, counts, and a live preview of the resulting syntax, with a running conversion plan.
- **Smart suggestions**: the six stock Highlightr colours are matched exactly to their native equivalents; any other colour falls back to the nearest native colour by perceptual (CIELAB) distance. You can override every suggestion per row.
- **Backup before writing**: every affected note is copied — untouched — into a timestamped folder alongside a `manifest.json`, before any conversion runs. Backup folder names are collision-checked, so a backup never overwrites an earlier one.
- **Revert**: restore every note in a migration from its backup copies, from the review tab or the "Revert last migration" command.
- **Scan report note** (optional): a report with a human-readable tree and a machine-readable JSON block recording the colours found and the mapping used.
- **Safe by default**: highlights that span multiple lines or already contain `==` are detected and left untouched rather than risk corrupting them, and the count of skipped highlights is shown. Conversion is idempotent, so re-running never double-converts.

## Usage

1. Open the migrator from the ribbon (highlighter icon) or the command **Highlight Migrator: Open migrator**.
2. Click **Scan vault**. Review the table of colours found.
3. For each colour, choose a native colour, Default, or Skip. Suggestions are pre-filled.
4. Click **Back up & convert**. Affected notes are copied to the backup folder first, then converted.
5. If you want to undo, click **Revert last migration** (or run the command).

## Requirements

The plugin converts highlights on Obsidian 1.7.2 and later. The converted syntax (`==🔴text==`) renders as coloured highlights in builds that support native highlight colours; on builds that don't, the emoji marker shows as literal text.

## Installing

### From the community plugins directory

Search for "Highlight Migrator" in **Settings → Community plugins** and install it.

### With BRAT

Add the repository `grub-basket/Highlight-Migrator` in the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.

### Manually

Copy `main.js`, `manifest.json`, and `styles.css` from the latest release into `<vault>/.obsidian/plugins/highlight-migrator/`, then enable the plugin.

## Settings

- Convert class-based (`hltr-*`) highlights, in addition to inline hex.
- Set the backup folder and report folder names.
- Write a scan report note on each conversion.

## Building

```bash
pnpm install
pnpm run build
```

The build type-checks with `tsc` and bundles `main.js` with esbuild.

## License

[MIT](LICENSE).
