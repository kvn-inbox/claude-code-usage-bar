# Claude Code Usage Bar

*[English](#english) · [Русский](#русский)*

An Obsidian plugin that shows your real Claude plan usage — session % and weekly % —
live in the status bar. Same numbers as `claude.ai → Settings → Usage`.

```
Claude: 42% session · 18% week · 7% Fable
```

---

## English

### How it works

The plugin reads the OAuth access token that **Claude Code CLI** stores locally at
`~/.claude/.credentials.json` after you run `claude login` (or any `claude` session),
and calls Anthropic's usage endpoint with it — the same undocumented endpoint
`claude.ai`'s own Usage settings page and Claude Code itself use.

It does **not** depend on any other Obsidian plugin (e.g. Claudian, Claude Sidebar, etc).
The only requirement is that Claude Code CLI is installed and logged in on the same
machine, so the credentials file exists.

### Installation

**Via BRAT (recommended — auto-updates)**

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins.
2. BRAT → "Add Beta plugin" → paste `kvn-inbox/claude-code-usage-bar` → Add Plugin.
3. Enable "Claude Code Usage Bar" in Community Plugins.

**Manual**

1. Download `main.js`, `manifest.json`, `styles.css` from the
   [latest release](https://github.com/kvn-inbox/claude-code-usage-bar/releases/latest).
2. Copy them into `<your-vault>/.obsidian/plugins/claude-code-usage-bar/`.
3. Reload Obsidian plugins and enable "Claude Code Usage Bar".

### Settings

- **Refresh interval** — minimum 60s enforced; the endpoint rate-limits aggressively
  if polled more often.
- **Warning threshold** — status bar text turns red once session or weekly usage
  reaches this percentage.
- **Show weekly (all models)** — toggle the weekly-all-models percentage.
- **Show weekly scoped model limit** — toggle a per-model weekly limit if present.
- **Credentials file path** — override if your Claude Code credentials live elsewhere.

Click the status bar item at any time to force an immediate refresh.

### Caveats

The usage endpoint (`api.anthropic.com/api/oauth/usage`) is undocumented and internal
to claude.ai / Claude Code — it could change or break without notice. If you see
"Claude: usage error" in the status bar, hover it for the underlying error message.

---

## Русский

Плагин для Obsidian, который показывает реальный расход лимитов Claude — процент за
сессию и за неделю — прямо в статусной строке. Те же цифры, что в
`claude.ai → Settings → Usage`.

```
Claude: 42% session · 18% week · 7% Fable
```

### Как это работает

Плагин читает OAuth-токен, который **Claude Code CLI** сохраняет локально в
`~/.claude/.credentials.json` после команды `claude login` (или любой сессии `claude`),
и обращается с ним к usage-эндпоинту Anthropic — тому же недокументированному
эндпоинту, что использует страница Usage на `claude.ai` и сам Claude Code.

Плагин **не** зависит ни от какого другого плагина Obsidian (Claudian, Claude Sidebar
и т.п.). Единственное требование — чтобы на этой же машине был установлен и
залогинен Claude Code CLI, тогда файл с токеном существует.

### Установка

**Через BRAT (рекомендуется — с автообновлениями)**

1. Установите [BRAT](https://github.com/TfTHacker/obsidian42-brat) из Community Plugins.
2. BRAT → «Add Beta plugin» → вставьте `kvn-inbox/claude-code-usage-bar` → Add Plugin.
3. Включите «Claude Code Usage Bar» в списке плагинов.

**Вручную**

1. Скачайте `main.js`, `manifest.json`, `styles.css` из
   [последнего релиза](https://github.com/kvn-inbox/claude-code-usage-bar/releases/latest).
2. Скопируйте их в `<ваш-волт>/.obsidian/plugins/claude-code-usage-bar/`.
3. Перезагрузите плагины в Obsidian и включите «Claude Code Usage Bar».

### Настройки

- **Refresh interval** — интервал обновления, минимум 60 сек; при более частых
  запросах эндпоинт агрессивно отдаёт 429.
- **Warning threshold** — порог, при котором текст в статус-баре краснеет
  (по сессии или по неделе).
- **Show weekly (all models)** — показывать недельный процент по всем моделям.
- **Show weekly scoped model limit** — показывать отдельный недельный лимит по
  конкретной модели, если он есть.
- **Credentials file path** — путь к файлу с токеном, если он лежит не по умолчанию.

Клик по элементу статус-бара мгновенно обновляет данные.

### Оговорки

Usage-эндпоинт (`api.anthropic.com/api/oauth/usage`) недокументированный и внутренний
для claude.ai / Claude Code — он может измениться или сломаться без предупреждения.
Если в статус-баре появилось «Claude: usage error», наведите курсор — во всплывающей
подсказке будет текст ошибки.

---

## License

MIT
