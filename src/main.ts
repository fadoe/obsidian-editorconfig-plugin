import {App, Plugin, PluginSettingTab, Setting,} from "obsidian";

import {EditorConfigService} from "./services/EditorConfigService";
import {MarkdownFormattingService} from "./services/MarkdownFormattingService";
import {FormattingCoordinator} from "./services/FormattingCoordinator";
import {TextDiffService} from "./services/TextDiffService";
import {EditorViewPluginAdapter} from "./ui/EditorViewPluginAdapter";

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
		await this.loadSettings();
		this.addSettingTab(new EditorConfigSettingTab(this.app, this));

		const editorConfigService = new EditorConfigService();
		const markdownFormattingService = new MarkdownFormattingService();
		const formattingCoordinator = new FormattingCoordinator(
			this.app.vault,
			editorConfigService,
			markdownFormattingService
		);
		const textDiffService = new TextDiffService();

		this.registerEditorExtension(
			EditorViewPluginAdapter.create(
				this,
				formattingCoordinator,
				textDiffService
			)
		);
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
