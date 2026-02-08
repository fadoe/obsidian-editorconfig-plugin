import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormattingCoordinator } from "../src/services/FormattingCoordinator";
import type { TFile, Vault } from "obsidian";

describe("FormattingCoordinator", () => {

	let mockVault: Vault;
	let mockEditorConfigService: any;
	let mockFormattingService: any;
	let coordinator: FormattingCoordinator;

	beforeEach(() => {

		mockVault = {
			adapter: {
				getBasePath: () => "/vault"
			}
		} as unknown as Vault;

		mockEditorConfigService = {
			getConfig: vi.fn()
		};

		mockFormattingService = {
			format: vi.fn()
		};

		coordinator = new FormattingCoordinator(
			mockVault,
			mockEditorConfigService,
			mockFormattingService
		);
	});

	const mockFile = {
		path: "test.md"
	} as TFile;

	it("returns null if no config is found", async () => {

		mockEditorConfigService.getConfig.mockResolvedValue(null);

		const result = await coordinator.format(
			mockFile,
			"content",
			false
		);

		expect(result).toBeNull();
	});

	it("returns null if formatting does not change content", async () => {

		mockEditorConfigService.getConfig.mockResolvedValue({
			trim_trailing_whitespace: true
		});

		mockFormattingService.format.mockReturnValue("content");

		const result = await coordinator.format(
			mockFile,
			"content",
			false
		);

		expect(result).toBeNull();
	});

	it("returns new content if formatting changes text", async () => {

		mockEditorConfigService.getConfig.mockResolvedValue({
			trim_trailing_whitespace: true
		});

		mockFormattingService.format.mockReturnValue("changed");

		const result = await coordinator.format(
			mockFile,
			"content",
			false
		);

		expect(result).toBe("changed");
	});

	it("passes effective config correctly when applyFinalNewline = false", async () => {

		mockEditorConfigService.getConfig.mockResolvedValue({
			insert_final_newline: true,
			trim_trailing_whitespace: true
		});

		mockFormattingService.format.mockReturnValue("changed");

		await coordinator.format(
			mockFile,
			"content",
			false
		);

		const passedConfig =
			mockFormattingService.format.mock.calls[0][1];

		expect(passedConfig.insert_final_newline).toBe(false);
		expect(passedConfig.trim_trailing_whitespace).toBe(false);
	});

});
