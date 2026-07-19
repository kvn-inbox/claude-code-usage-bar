const { Plugin, PluginSettingTab, Setting, Notice, requestUrl } = require("obsidian");
const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

// Undocumented endpoint used internally by claude.ai's own "Usage" settings page
// and by Claude Code itself. It returns the exact same session/weekly percentages
// shown at claude.ai -> Settings -> Usage. No public docs; could change without notice.
const USAGE_ENDPOINT = "https://api.anthropic.com/api/oauth/usage";

const DEFAULT_SETTINGS = {
  refreshSeconds: 120, // community reports this endpoint 429s aggressively below ~60-180s
  warnPercent: 80,
  showWeekly: true,
  showScoped: true,
  credentialsPath: path.join(os.homedir(), ".claude", ".credentials.json"),
};

function formatMinutes(totalMinutes) {
  if (totalMinutes == null || isNaN(totalMinutes)) return "?";
  const clamped = Math.max(0, totalMinutes);
  const h = Math.floor(clamped / 60);
  const m = Math.round(clamped % 60);
  return h > 0 ? `${h}h${m}m` : `${m}m`;
}

module.exports = class ClaudeCodeUsageBarPlugin extends Plugin {
  async onload() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    this.userAgent = "claude-code/2.1.158"; // fallback; refined below if `claude --version` resolves

    this.statusBarEl = this.addStatusBarItem();
    this.statusBarEl.addClass("claude-usage-bar-item");
    this.statusBarEl.setText("Claude: …");
    this.statusBarEl.style.cursor = "pointer";
    this.registerDomEvent(this.statusBarEl, "click", () => this.refresh(true));

    this.addSettingTab(new ClaudeUsageSettingTab(this.app, this));

    this.detectClaudeVersion().finally(() => this.refresh());

    const intervalId = window.setInterval(
      () => this.refresh(),
      Math.max(60, this.settings.refreshSeconds) * 1000
    );
    this.registerInterval(intervalId);
  }

  detectClaudeVersion() {
    return new Promise((resolve) => {
      exec("claude --version", { timeout: 10000, windowsHide: true }, (err, stdout) => {
        if (!err && stdout) {
          const m = stdout.trim().match(/^(\S+)/);
          if (m) this.userAgent = `claude-code/${m[1]}`;
        }
        resolve();
      });
    });
  }

  readCredentials() {
    const raw = fs.readFileSync(this.settings.credentialsPath, "utf8");
    const data = JSON.parse(raw);
    const oauth = data && data.claudeAiOauth;
    if (!oauth || !oauth.accessToken) {
      throw new Error("No claudeAiOauth.accessToken in credentials file");
    }
    return oauth;
  }

  async fetchUsage() {
    let oauth;
    try {
      oauth = this.readCredentials();
    } catch (e) {
      throw new Error(`Can't read Claude Code credentials (${this.settings.credentialsPath}): ${e.message}`);
    }

    // Obsidian's renderer is Chromium, and Chromium's own fetch()/XHR refuse to let JS set
    // "User-Agent" (it's on the browser's forbidden-header list) — it gets silently dropped,
    // Anthropic then sees a non-claude-code client and the endpoint errors out. Obsidian's
    // requestUrl() goes through Electron's net stack instead, so custom headers actually land.
    let res;
    try {
      res = await requestUrl({
        url: USAGE_ENDPOINT,
        method: "GET",
        headers: {
          Authorization: `Bearer ${oauth.accessToken}`,
          "User-Agent": this.userAgent,
          "anthropic-beta": "oauth-2025-04-20",
        },
        throw: false,
      });
    } catch (e) {
      throw new Error(`Network error calling usage endpoint: ${(e && e.message) || e}`);
    }

    if (res.status === 401) {
      throw new Error("401 Unauthorized — token expired. Run `claude` (Claude Code CLI) once to refresh it.");
    }
    if (res.status === 429) {
      throw new Error("429 Rate limited by Anthropic — increase the refresh interval in settings.");
    }
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}: ${(res.text || "").slice(0, 200)}`);
    }
    try {
      return res.json;
    } catch (e) {
      throw new Error(`Could not parse usage response as JSON: ${(e && e.message) || e}`);
    }
  }

  async refresh(verbose = false) {
    try {
      const data = await this.fetchUsage();
      const session = data.five_hour;
      const weekly = data.seven_day;
      const scoped = Array.isArray(data.limits)
        ? data.limits.find((l) => l.kind === "weekly_scoped")
        : null;

      if (!session || !weekly) {
        throw new Error("Unexpected response shape from usage endpoint");
      }

      const sessionPct = Math.round(session.utilization);
      const weeklyPct = Math.round(weekly.utilization);
      const remainingMin = session.resets_at
        ? Math.round((new Date(session.resets_at).getTime() - Date.now()) / 60000)
        : null;

      let text = `Claude: ${sessionPct}% session`;
      if (this.settings.showWeekly) text += ` · ${weeklyPct}% week`;
      if (this.settings.showScoped && scoped) {
        const label = (scoped.scope && scoped.scope.model && scoped.scope.model.display_name) || "model";
        text += ` · ${Math.round(scoped.percent)}% ${label}`;
      }
      this.statusBarEl.setText(text);

      const warn = sessionPct >= this.settings.warnPercent || weeklyPct >= this.settings.warnPercent;
      this.statusBarEl.toggleClass("claude-usage-warning", warn);

      const tooltipLines = [
        `Session: ${sessionPct}% used, resets in ${formatMinutes(remainingMin)} (${new Date(
          session.resets_at
        ).toLocaleString()})`,
        `Weekly (all models): ${weeklyPct}% used, resets ${new Date(weekly.resets_at).toLocaleString()}`,
      ];
      if (scoped) {
        const label = (scoped.scope && scoped.scope.model && scoped.scope.model.display_name) || "model";
        tooltipLines.push(`Weekly (${label}): ${Math.round(scoped.percent)}% used`);
      }
      tooltipLines.push("Click to refresh now.");
      this.statusBarEl.setAttribute("aria-label", tooltipLines.join("\n"));

      if (verbose) new Notice(text);
    } catch (e) {
      this.statusBarEl.setText("Claude: usage error");
      this.statusBarEl.removeClass("claude-usage-warning");
      const msg = String((e && e.message) || e);
      this.statusBarEl.setAttribute("aria-label", msg);
      if (verbose) new Notice(`Claude usage error: ${msg}`);
    }
  }

  onunload() {}

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class ClaudeUsageSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Claude Code Usage Bar" });
    containerEl.createEl("p", {
      text:
        "Shows your real Claude plan usage (same % as claude.ai -> Settings -> Usage) in the status bar, " +
        "read via your local Claude Code CLI OAuth token. Undocumented endpoint — may break if Anthropic changes it.",
    });

    new Setting(containerEl)
      .setName("Refresh interval (seconds)")
      .setDesc("Minimum 60s enforced. This endpoint has been reported to rate-limit aggressively if polled too often.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.refreshSeconds)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!isNaN(n) && n >= 60) {
            this.plugin.settings.refreshSeconds = n;
            await this.plugin.saveSettings();
            new Notice("Reload the plugin (toggle off/on) for the new interval to take effect.");
          }
        })
      );

    new Setting(containerEl)
      .setName("Warning threshold (%)")
      .setDesc("Status bar text turns red once session or weekly usage reaches this percentage.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.warnPercent)).onChange(async (value) => {
          const n = parseInt(value, 10);
          if (!isNaN(n)) {
            this.plugin.settings.warnPercent = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Show weekly (all models)")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showWeekly).onChange(async (value) => {
          this.plugin.settings.showWeekly = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Show weekly scoped model limit (e.g. Fable)")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showScoped).onChange(async (value) => {
          this.plugin.settings.showScoped = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Credentials file path")
      .setDesc("Path to Claude Code's .credentials.json (contains your OAuth token).")
      .addText((text) =>
        text.setValue(this.plugin.settings.credentialsPath).onChange(async (value) => {
          this.plugin.settings.credentialsPath = value.trim() || DEFAULT_SETTINGS.credentialsPath;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName("Test now").addButton((btn) =>
      btn.setButtonText("Refresh").onClick(async () => {
        await this.plugin.refresh(true);
      })
    );
  }
}
