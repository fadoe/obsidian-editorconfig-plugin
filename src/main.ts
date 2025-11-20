import { Plugin, TFile } from "obsidian";
import * as editorconfig from "editorconfig";
import { MarkdownFormatter } from "./MarkdownFormatter";

export default class EditorConfigFormatter extends Plugin {
	async onload() {

		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				if (file instanceof TFile && file.extension === "md") {
					await this.applyEditorConfig(file);
				}
			})
		);

		this.addCommand({
			id: "format-md-editorconfig",
			name: "Editorconfig: Formate file with editorconfig",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (file && file.extension === "md") {
					if (!checking) {
						this.applyEditorConfig(file);
					}

					return true;
				}

				return false;
			},
		});
	}

	async applyEditorConfig(file: TFile) {
		const vaultPath = this.app.vault.adapter.getBasePath();
		const filePath = `${vaultPath}/${file.path}`;
		const config = await editorconfig.parse(filePath);

		const content = await this.app.vault.read(file);
		const formatter = new MarkdownFormatter(config);
		const newContent = formatter.format(content);

		if (newContent !== content) {
			await this.app.vault.modify(file, newContent);
			console.log(`.editorconfig used on ${file.path}`);
		}
	}
}
