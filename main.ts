import { Plugin, TFile } from "obsidian";
import * as editorconfig from "editorconfig";

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
		const lines = content.split(/\r?\n/);

		let inCodeBlock = false;
		let inFrontmatter = false;
		const newLines: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			// Detect frontmatter block
			if (i === 0 && line.trim() === "---") {
				inFrontmatter = true;
				newLines.push(line);
				continue;
			}
			if (inFrontmatter) {
				newLines.push(line);
				if (line.trim() === "---") inFrontmatter = false;
				continue;
			}

			// Detect code block
			if (line.trim().startsWith("```")) {
				inCodeBlock = !inCodeBlock;
				newLines.push(line);
				continue;
			}

			if (inCodeBlock) {
				newLines.push(line);
				continue;
			}

			// Process normal Markdown text
			const leadingWhitespaceMatch = line.match(/^[ \t]*/);
			const leading = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : "";
			const contentPart = line.slice(leading.length);

			// Calculate indentation level for nested lists
			let level = 0;
			for (const char of leading) {
				if (char === "\t") level += 1;
				else if (char === " ") level += 1 / (config.indent_size || 2);
			}

			// Apply new indentation based on .editorconfig settings
			let newLeading = "";
			if (config.indent_style === "tab") {
				newLeading = "\t".repeat(Math.round(level));
			} else {
				newLeading = " ".repeat(Math.round(level) * (config.indent_size || 2));
			}

			line = newLeading + contentPart;

			// Remove trailing whitespace if configured
			if (config.trim_trailing_whitespace) {
				line = line.replace(/[ \t]+$/g, "");
			}

			newLines.push(line);
		}

		let newContent = newLines.join(
			config.end_of_line === "crlf" ? "\r\n" : "\n"
		);

		if (config.insert_final_newline) {
			if (!newContent.endsWith("\n") && !newContent.endsWith("\r\n")) {
				newContent += config.end_of_line === "crlf" ? "\r\n" : "\n";
			}
		}

		if (newContent !== content) {
			await this.app.vault.modify(file, newContent);
			console.log(`.editorconfig used on ${file.path}`);
		}
	}
}
