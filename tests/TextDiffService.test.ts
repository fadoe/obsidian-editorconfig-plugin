import { describe, it, expect } from "vitest";
import { TextDiffService } from "../src/services/TextDiffService";

describe("TextDiffService", () => {

	const diff = new TextDiffService();

	it("returns null when texts are identical", () => {
		const result = diff.calculate("abc", "abc");
		expect(result).toBeNull();
	});

	it("detects insertion at end", () => {
		const result = diff.calculate("abc", "abcd");

		expect(result).toEqual({
			from: 3,
			to: 3,
			insert: "d"
		});
	});

	it("detects deletion at end", () => {
		const result = diff.calculate("abcd", "abc");

		expect(result).toEqual({
			from: 3,
			to: 4,
			insert: ""
		});
	});

	it("detects change in middle", () => {
		const result = diff.calculate("abc123xyz", "abc456xyz");

		expect(result).toEqual({
			from: 3,
			to: 6,
			insert: "456"
		});
	});

	it("detects full replacement", () => {
		const result = diff.calculate("abc", "xyz");

		expect(result).toEqual({
			from: 0,
			to: 3,
			insert: "xyz"
		});
	});

	it("handles empty old text", () => {
		const result = diff.calculate("", "abc");

		expect(result).toEqual({
			from: 0,
			to: 0,
			insert: "abc"
		});
	});

	it("handles empty new text", () => {
		const result = diff.calculate("abc", "");

		expect(result).toEqual({
			from: 0,
			to: 3,
			insert: ""
		});
	});

});
