import type EditorConfigFormatter from "../main";
import {TextDiffService} from "../services/TextDiffService";
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import {MarkdownView, TFile} from "obsidian";
import {FormattingCoordinator} from "../services/FormattingCoordinator";
import {SettingsService} from "../services/SettingsService";

export class EditorViewPluginAdapter {

	static create(
		plugin: EditorConfigFormatter,
		coordinator: FormattingCoordinator,
		diffService: TextDiffService,
		settingsService: SettingsService
	) {
		return ViewPlugin.fromClass(class {

			private debounceTimer: number | null = null;
			private isFormatting = false;
			private lastActivity = 0;

			constructor(private view: EditorView) {}

			update(update: ViewUpdate): void {
				if (this.isFormatting) return;

				const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!markdownView) return;

				const file = markdownView.file;
				if (!file) return;

				if (update.docChanged) {
					this.lastActivity = Date.now();

					if (settingsService.get().formatOnTyping) {
						this.scheduleFormat(file);
					}
				}

				if (update.focusChanged && !this.view.hasFocus) {
					if (settingsService.get().formatOnBlur) {
						void this.formatNow(file, true);
					}
				}
			}

			private scheduleFormat(file: TFile) {
				if (this.debounceTimer) {
					window.clearTimeout(this.debounceTimer);
				}

				this.debounceTimer = window.setTimeout(() => {
					if (Date.now() - this.lastActivity >= settingsService.get().debounceDelay) {
						void this.formatNow(file, false);
					}
				}, settingsService.get().debounceDelay);
			}

			private async formatNow(
				file: TFile,
				applyFinalNewline: boolean
			) {
				if (this.isFormatting) return;
				this.isFormatting = true;

				try {
					const currentContent = this.view.state.doc.toString();
					const newContent = await coordinator.format(file, currentContent, applyFinalNewline);

					if (!newContent) return;

					const change = diffService.calculate(currentContent, newContent);

					if (!change) return;

					this.view.dispatch({ changes: change });
				} finally {
					this.isFormatting = false;
				}
			}
		});
	}
}
