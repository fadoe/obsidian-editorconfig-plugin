export interface TextChange {
	from: number;
	to: number;
	insert: string;
}

export class TextDiffService {

	calculate(oldText: string, newText: string): TextChange | null {

		if (oldText === newText) {
			return null;
		}

		let start = 0;
		let oldEnd = oldText.length;
		let newEnd = newText.length;

		// Longest common prefix
		while (
			start < oldEnd &&
			start < newEnd &&
			oldText.charCodeAt(start) === newText.charCodeAt(start)
			) {
			start++;
		}

		// Longest common suffix
		while (
			oldEnd > start &&
			newEnd > start &&
			oldText.charCodeAt(oldEnd - 1) ===
			newText.charCodeAt(newEnd - 1)
			) {
			oldEnd--;
			newEnd--;
		}

		// No effective change
		if (start === oldEnd && start === newEnd) {
			return null;
		}

		return {
			from: start,
			to: oldEnd,
			insert: newText.slice(start, newEnd),
		};
	}
}
