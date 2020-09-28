import { IStreamCacheContainer } from "./IStreamCacheContainer";

export abstract class StreamCacheContainer implements IStreamCacheContainer {
    private mScheduler: NodeJS.Timer | null;

    public constructor() {
        this.mScheduler = null;
    }

    public start(interval: number = 10000): void {
        if (this.mScheduler !== null) {
            console.error("StreamCacheContainer#start: Already Start");
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
