import { IStreamCacheManager } from "./IStreamCacheManager";

export abstract class StreamCacheManager implements IStreamCacheManager {

	private mScheduler: NodeJS.Timer | null;

	public constructor() {
		this.mScheduler = null;
	}

	public start(interval: number = 10000): void {
		if (this.mScheduler !== null) {
			console.error('WowzaCacheManager#start: Already Start');
			return;
		}
		this.update();
		this.mScheduler = setInterval(() => {
			this.update();
		}, interval);
	}

	public stop(): void {
		clearInterval(this.mScheduler);
		this.mScheduler = null;
	}

	public abstract update(): void;
}