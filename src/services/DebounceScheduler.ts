export class DebounceScheduler {

	private timers = new Map<string, number>();

	schedule(key: string, callback: () => void, delay: number): void {

		const existing = this.timers.get(key);

		if (existing) {
			window.clearTimeout(existing);
		}

		const timer = window.setTimeout(() => {
			this.timers.delete(key);
			callback();
		}, delay);

		this.timers.set(key, timer);
	}

	cancel(key: string): void {
		const existing = this.timers.get(key);

		if (existing) {
			window.clearTimeout(existing);
			this.timers.delete(key);
		}
	}
}
