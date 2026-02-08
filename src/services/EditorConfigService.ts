import * as editorconfig from "editorconfig";

export class EditorConfigService {

	async getConfig(filePath: string): Promise<editorconfig.KnownProps | null> {
		try {
			return await editorconfig.parse(filePath);
		} catch {
			return null;
		}
	}
}
