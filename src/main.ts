import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

import { EditorConfigService } from "./services/EditorConfigService";
import { MarkdownFormattingService } from "./services/MarkdownFormattingService";
import { FormattingCoordinator } from "./services/FormattingCoordinator";
import { TextDiffService } from "./services/TextDiffService";
import { EditorViewPluginAdapter } from "./ui/EditorViewPluginAdapter";
import { SettingsService } from "./services/SettingsService";

export default class EditorConfigFormatter extends Plugin {

	private settingsService!: SettingsService;

	async onload() {
		this.settingsService = new SettingsService(this);
		await this.settingsService.load();

		this.addSettingTab(new EditorConfigSettingTab(this.app, this, this.settingsService));

		const editorConfigService = new EditorConfigService();
		const markdownFormattingService = new MarkdownFormattingService();

		const formattingCoordinator = new FormattingCoordinator(
			this.app.vault,
			editorConfigService,
			markdownFormattingService
		);

		const textDiffService = new TextDiffService();

		this.registerEditorExtension(
			EditorViewPluginAdapter.create(this, formattingCoordinator, textDiffService, this.settingsService)
		);
	}
}

class EditorConfigSettingTab extends PluginSettingTab {

	constructor(
		app: App,
		plugin: EditorConfigFormatter,
		private settingsService: SettingsService
	) {
		super(app, plugin);
	}

	display(): void {

		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Format while typing")
			.setDesc("Enable formatting while typing (debounced).")
			.addToggle(toggle =>
				toggle
					.setValue(this.settingsService.get().formatOnTyping)
					.onChange(async (value) => {
						await this.settingsService.update({
							formatOnTyping: value
						});
					})
			);

		new Setting(containerEl)
			.setName("Format on focus loss")
			.setDesc("Format file when editor loses focus.")
			.addToggle(toggle =>
				toggle
					.setValue(this.settingsService.get().formatOnBlur)
					.onChange(async (value) => {
						await this.settingsService.update({
							formatOnBlur: value
						});
					})
			);

		new Setting(containerEl)
			.setName("Debounce delay")
			.setDesc("Debounce delay in milliseconds (ms).")
			.addText(text =>
				text
					.setValue(
						String(this.settingsService.get().debounceDelay)
					)
					.onChange(async (value) => {
						const parsed = Number(value);

						if (!isNaN(parsed) && parsed >= 0) {
							await this.settingsService.update({
								debounceDelay: parsed
							});
						}
					})
			);
	}
}
