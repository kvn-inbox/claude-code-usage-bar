# Claude Code Usage Bar

An Obsidian plugin that shows your real Claude plan usage — session % and weekly % —
live in the status bar. Same numbers as `claude.ai → Settings → Usage`.

![status bar example](https://img.shields.io/badge/status%20bar-Claude%3A%2042%25%20session%20%C2%B7%2018%25%20week-blue)

## How it works

The plugin reads the OAuth access token that **Claude Code CLI** stores locally at
`~/.claude/.credentials.json` after you run `claude login` (or any `claude` session),
and calls Anthropic's usage endpoint with it — the same undocumented endpoint
`claude.ai`'s own Usage settings page and Claude Code itself use.

It does **not** depend on any other Obsidian plugin (e.g. Claudian, Claude Sidebar, etc).
The only requirement is that Claude Code CLI is installed and logged in on the same
machine, so the credentials file exists.

## Installation

### Via BRAT (recommended — auto-updates)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. BRAT → "Add Beta plugin" → paste `kvn-inbox/claude-code-usage-bar` → Add Plugin.
3. Enable "Claude Code Usage Bar" in Community Plugins.

### Manual

1. Download `main.js`, `manifest.json`, `styles.css` from the
   [latest release](https://github.com/kvn-inbox/claude-code-usage-bar/releases/latest).
2. Copy them into `<your-vault>/.obsidian/plugins/claude-code-usage-bar/`.
3. Reload Obsidian plugins and enable "Claude Code Usage Bar".

## Settings

- **Refresh interval** — minimum 60s enforced; the endpoint rate-limits aggressively
  if polled more often.
- **Warning threshold** — status bar text turns red once session or weekly usage
  reaches this percentage.
- **Show weekly (all models)** — toggle the weekly-all-models percentage.
- **Show weekly scoped model limit** — toggle a per-model weekly limit if present.
- **Credentials file path** — override if your Claude Code credentials live elsewhere.

Click the status bar item at any time to force an immediate refresh.

## Caveats

The usage endpoint (`api.anthropic.com/api/oauth/usage`) is undocumented and internal
to claude.ai / Claude Code — it could change or break without notice. If you see
"Claude: usage error" in the status bar, hover it for the underlying error message.

## License

MIT
