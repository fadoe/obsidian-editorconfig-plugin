import {
	App,
	FileSystemAdapter,
	MarkdownView,
	Plugin,
	PluginSettingTab, setIcon,
	Setting,
	TFile,
	Vault,
} from "obsidian";

import * as editorconfig from "editorconfig";
import { MarkdownFormatter } from "./MarkdownFormatter";

import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";

interface EditorConfigPluginSettings {
	formatOnTyping: boolean;
	formatOnBlur: boolean;
	debounceDelay: number; // milliseconds
}

const DEFAULT_SETTINGS: EditorConfigPluginSettings = {
	formatOnTyping: false,
	formatOnBlur: true,
	debounceDelay: 300,
};

export default class EditorConfigFormatter extends Plugin {

	settings: EditorConfigPluginSettings;

	async onload() {
		const item = this.addStatusBarItem();
		setIcon(item, 'settings');

		await this.loadSettings();
		this.addSettingTab(new EditorConfigSettingTab(this.app, this));
		this.registerEditorExtension(this.createViewPlugin());
	}

	private createViewPlugin() {
		const plugin = this;

		return ViewPlugin.fromClass(class {

			private debounceTimer: number | null = null;
			private isFormatting = false;
			private lastActivity = 0;

			constructor(private view: EditorView) {}

			update(update: ViewUpdate) {

				if (this.isFormatting) return;

				const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!markdownView) return;

				const file = markdownView.file;
				if (!file) return;

				// Document changed (typing)
				if (update.docChanged) {
					this.lastActivity = Date.now();

					if (plugin.settings.formatOnTyping) {
						this.scheduleFormat(file);
					}
				}

				// Focus lost
				if (update.focusChanged && !this.view.hasFocus) {
					if (plugin.settings.formatOnBlur) {
						this.formatNow(file, true);
					}
				}
			}

			private scheduleFormat(file: TFile) {
				if (this.debounceTimer) {
					window.clearTimeout(this.debounceTimer);
				}

				this.debounceTimer = window.setTimeout(() => {
					if (Date.now() - this.lastActivity >= plugin.settings.debounceDelay) {
						this.formatNow(file, false);
					}
				}, plugin.settings.debounceDelay);
			}

			private async formatNow(file: TFile, applyFinalNewline: boolean) {
				if (this.isFormatting) return;
				this.isFormatting = true;

				try {
					if (!(plugin.app.vault.adapter instanceof FileSystemAdapter)) return;

					const vaultPath = plugin.app.vault.adapter.getBasePath();
					const filePath = `${vaultPath}/${file.path}`;

					let config: editorconfig.KnownProps;
					try {
						config = await editorconfig.parse(filePath);
					} catch {
						return;
					}

					const currentContent = this.view.state.doc.toString();

					// Apply final newline only when explicitly requested (e.g. blur)
					const effectiveConfig: editorconfig.KnownProps = {
						...config,
						insert_final_newline: applyFinalNewline
							? config.insert_final_newline
							: false,
						trim_trailing_whitespace: applyFinalNewline
							? config.trim_trailing_whitespace
							: false,
					};

					const formatter = new MarkdownFormatter(effectiveConfig);
					const newContent = formatter.format(currentContent);

					if (newContent === currentContent) return;

					const oldText = currentContent;
					const newText = newContent;

					let start = 0;
					let oldEnd = oldText.length;
					let newEnd = newText.length;

					// ---- Longest common prefix ----
					while (
						start < oldEnd &&
						start < newEnd &&
						oldText.charCodeAt(start) === newText.charCodeAt(start)
						) {
						start++;
					}

					// ---- Longest common suffix ----
					while (
						oldEnd > start &&
						newEnd > start &&
						oldText.charCodeAt(oldEnd - 1) === newText.charCodeAt(newEnd - 1)
						) {
						oldEnd--;
						newEnd--;
					}

					// No effective change
					if (start === oldEnd && start === newEnd) return;

					// ---- Apply minimal change ----
					this.view.dispatch({
						changes: {
							from: start,
							to: oldEnd,
							insert: newText.slice(start, newEnd),
						},
					});

				} finally {
					this.isFormatting = false;
				}
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class EditorConfigSettingTab extends PluginSettingTab {
	plugin: EditorConfigFormatter;

	constructor(app: App, plugin: EditorConfigFormatter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Format while typing")
			.setDesc("Enable formatting while typing (debounced).")
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.formatOnTyping)
					.onChange(async (value) => {
						this.plugin.settings.formatOnTyping = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Format on focus loss")
			.setDesc("Format file when editor loses focus.")
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.formatOnBlur)
					.onChange(async (value) => {
						this.plugin.settings.formatOnBlur = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Debounce delay")
			.setDesc("Debounce delay in milliseconds (ms).")
			.addText(text =>
				text
					.setValue(String(this.plugin.settings.debounceDelay))
					.onChange(async (value) => {
						const parsed = Number(value);
						if (!isNaN(parsed) && parsed >= 0) {
							this.plugin.settings.debounceDelay = parsed;
							await this.plugin.saveSettings();
						}
					})
			);
	}
}
