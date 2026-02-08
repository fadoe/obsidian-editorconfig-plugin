import type { Plugin } from "obsidian";

export interface EditorConfigPluginSettings {
	formatOnTyping: boolean;
	formatOnBlur: boolean;
	debounceDelay: number;
}

export const DEFAULT_SETTINGS: EditorConfigPluginSettings = {
	formatOnTyping: false,
	formatOnBlur: true,
	debounceDelay: 300,
};

export class SettingsService {

	private settings: EditorConfigPluginSettings;

	constructor(private plugin: Plugin) {}

	async load(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.plugin.loadData()
		);
	}

	get(): Readonly<EditorConfigPluginSettings> {
		return this.settings;
	}

	async update(
		partial: Partial<EditorConfigPluginSettings>
	): Promise<void> {
		this.settings = {
			...this.settings,
			...partial,
		};

		await this.plugin.saveData(this.settings);
	}
}
