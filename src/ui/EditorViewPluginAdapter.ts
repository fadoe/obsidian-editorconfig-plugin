import * as editorconfig from "editorconfig";
import type EditorConfigFormatter from "../main";
import {TextDiffService} from "../services/TextDiffService";
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";
import {FileSystemAdapter, MarkdownView, TFile} from "obsidian";

export class EditorViewPluginAdapter {

	static create(plugin: EditorConfigFormatter) {
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

					if (plugin.settings.formatOnTyping) {
						this.scheduleFormat(file);
					}
				}

				if (update.focusChanged && !this.view.hasFocus) {
					if (plugin.settings.formatOnBlur) {
						void this.formatNow(file, true);
					}
				}
			}

			private scheduleFormat(file: TFile) {
				if (this.debounceTimer) {
					window.clearTimeout(this.debounceTimer);
				}

				this.debounceTimer = window.setTimeout(() => {
					if (Date.now() - this.lastActivity >= plugin.settings.debounceDelay) {
						void this.formatNow(file, false);
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

					const effectiveConfig = {
						...config,
						insert_final_newline: applyFinalNewline
							? config.insert_final_newline
							: false,
						trim_trailing_whitespace: applyFinalNewline
							? config.trim_trailing_whitespace
							: false,
					};

					const { MarkdownFormatter } = await import("../MarkdownFormatter");
					const formatter = new MarkdownFormatter(effectiveConfig);
					const newContent = formatter.format(currentContent);

					if (newContent === currentContent) return;

					const diffService = new TextDiffService();
					const change = diffService.calculate(currentContent, newContent);

					if (!change) return;

					this.view.dispatch({
						changes: change,
					});

				} finally {
					this.isFormatting = false;
				}
			}
		});
	}
}
