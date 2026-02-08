import {
	App,
	Plugin,
	PluginSettingTab, setIcon,
	Setting,
} from "obsidian";

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
		const item = this.addStatusBarItem();
		setIcon(item, 'settings');

		await this.loadSettings();
		this.addSettingTab(new EditorConfigSettingTab(this.app, this));
		this.registerEditorExtension(EditorViewPluginAdapter.create(this));
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
