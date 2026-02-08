import type EditorConfigFormatter from "../main";
import {TextDiffService} from "../services/TextDiffService";
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import {MarkdownView, TFile} from "obsidian";
import {FormattingCoordinator} from "../services/FormattingCoordinator";
import {SettingsService} from "../services/SettingsService";
import {DebounceScheduler} from "../services/DebounceScheduler";

export class EditorViewPluginAdapter {

	static create(
		plugin: EditorConfigFormatter,
		coordinator: FormattingCoordinator,
		diffService: TextDiffService,
		settingsService: SettingsService,
		debounceScheduler: DebounceScheduler
	) {

		let instanceCounter = 0;
		return ViewPlugin.fromClass(class {

			private isFormatting = false;
			private readonly debounceKey: string;

			constructor(private view: EditorView) {
				this.debounceKey = `format-${instanceCounter++}`;
			}

			update(update: ViewUpdate): void {

				if (this.isFormatting) return;

				const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
				if (!markdownView) return;

				const file = markdownView.file;
				if (!file) return;

				if (update.docChanged) {
					if (settingsService.get().formatOnTyping) {
						debounceScheduler.schedule(
							this.debounceKey,
							() => {
								void this.formatNow(file, false);
							},
							settingsService.get().debounceDelay
						);
					}
				}

				if (update.focusChanged && !this.view.hasFocus) {
					if (settingsService.get().formatOnBlur) {
						debounceScheduler.cancel(this.debounceKey);
						void this.formatNow(file, true);
					}
				}
			}

			destroy() {
				debounceScheduler.cancel(this.debounceKey);
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
