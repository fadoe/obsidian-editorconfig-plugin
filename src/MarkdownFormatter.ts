import * as editorconfig from "editorconfig";

export class MarkdownFormatter {
	private config: editorconfig.KnownProps;

	constructor(config: editorconfig.KnownProps) {
		this.config = config;
	}

	format(content: string): string {
		const lines = content.split(/\r?\n/);
		let inCodeBlock = false;
		let inFrontMatter = false;
		const newLines: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			// Detect frontmatter block
			if (i === 0 && line.trim() === "---") {
				inFrontMatter = true;
				newLines.push(line);
				continue;
			}
			if (inFrontMatter) {
				newLines.push(line);
				if (line.trim() === "---") inFrontMatter = false;
				continue;
			}

			// Detect code block
			if (line.trim().startsWith("```") ) {
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
			const indentSize = Number(this.config.indent_size) || 2;
			for (const char of leading) {
				if (char === "\t") level += 1;
				else if (char === " ") level += 1 / indentSize;
			}

			// Apply new indentation based on .editorconfig settings
			let newLeading = "";
			if (this.config.indent_style === "tab") {
				newLeading = "\t".repeat(Math.round(level));
			} else {
				newLeading = " ".repeat(Math.round(level) * indentSize);
			}

			line = newLeading + contentPart;

			// Remove trailing whitespace if configured
			if (this.config.trim_trailing_whitespace) {
				line = line.replace(/[ \t]+$/g, "");
			}

			newLines.push(line);
		}

		let newContent = newLines.join(
			this.config.end_of_line === "crlf" ? "\r\n" : "\n"
		);

		if (this.config.insert_final_newline) {
			if (!newContent.endsWith("\n") && !newContent.endsWith("\r\n")) {
				newContent += this.config.end_of_line === "crlf" ? "\r\n" : "\n";
			}
		}

		return newContent;
	}
}
