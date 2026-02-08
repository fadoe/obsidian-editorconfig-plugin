import {FileSystemAdapter, TFile, Vault} from "obsidian";
import {EditorConfigService} from "./EditorConfigService";
import {MarkdownFormattingService} from "./MarkdownFormattingService";
import * as editorconfig from "editorconfig";

export class FormattingCoordinator {

	constructor(
		private vault: Vault,
		private editorConfigService: EditorConfigService,
		private formattingService: MarkdownFormattingService
	) {}

	async format(
		file: TFile,
		content: string,
		applyFinalNewline: boolean
	): Promise<string | null> {

		if (!(this.vault.adapter instanceof FileSystemAdapter)) {
			return null;
		}

		const vaultPath = this.vault.adapter.getBasePath();
		const filePath = `${vaultPath}/${file.path}`;

		const config = await this.editorConfigService.getConfig(filePath);
		if (!config) return null;

		const effectiveConfig: editorconfig.KnownProps = {
			...config,
			insert_final_newline: applyFinalNewline
				? config.insert_final_newline
				: false,
			trim_trailing_whitespace: applyFinalNewline
				? config.trim_trailing_whitespace
				: false,
		};

		const newContent =
			this.formattingService.format(content, effectiveConfig);

		if (newContent === content) {
			return null;
		}

		return newContent;
	}
}
