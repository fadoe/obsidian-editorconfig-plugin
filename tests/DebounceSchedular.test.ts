import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DebounceScheduler } from "../src/services/DebounceScheduler";

describe("DebounceScheduler", () => {

	let scheduler: DebounceScheduler;

	beforeEach(() => {
		scheduler = new DebounceScheduler();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("executes callback after delay", () => {
		const callback = vi.fn();

		scheduler.schedule("test", callback, 500);

		expect(callback).not.toHaveBeenCalled();

		vi.advanceTimersByTime(500);

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("debounces multiple calls and runs only last callback", () => {
		const first = vi.fn();
		const second = vi.fn();

		scheduler.schedule("test", first, 500);
		scheduler.schedule("test", second, 500);

		vi.advanceTimersByTime(500);

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it("cancel prevents callback execution", () => {
		const callback = vi.fn();

		scheduler.schedule("test", callback, 500);
		scheduler.cancel("test");

		vi.advanceTimersByTime(500);

		expect(callback).not.toHaveBeenCalled();
	});

});
