import { IStreamCacheContainer } from './IStreamCacheContainer';

export abstract class StreamCacheContainer implements IStreamCacheContainer {
  private mScheduler: NodeJS.Timer | null;

  constructor() {
    this.mScheduler = null;
  }

  start(interval: number = 10000): void {
    if (this.mScheduler !== null) {
      console.error('StreamCacheContainer#start: Already Start');
      return;
    }
    this.update();
    this.mScheduler = setInterval(() => {
      this.update();
    }, interval);
  }

  stop(): void {
    if (this.mScheduler) {
      clearInterval(this.mScheduler);
    }
    this.mScheduler = null;
  }

  abstract update(): void;
}
