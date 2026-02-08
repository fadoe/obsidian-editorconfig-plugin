import { FileSystemAdapter, TFile, Vault } from "obsidian";
import * as editorconfig from "editorconfig";
import { MarkdownFormatter } from "../MarkdownFormatter";

export class FormattingCoordinator {

	constructor(private vault: Vault) {}

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

		let config: editorconfig.KnownProps;

		try {
			config = await editorconfig.parse(filePath);
		} catch {
			return null;
		}

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
		const newContent = formatter.format(content);

		if (newContent === content) {
			return null;
		}

		return newContent;
	}
}
