import * as editorconfig from "editorconfig";
import { MarkdownFormatter } from "../MarkdownFormatter";

export class MarkdownFormattingService {

	format(
		content: string,
		config: editorconfig.KnownProps
	): string {
		const formatter = new MarkdownFormatter(config);
		return formatter.format(content);
	}
}
