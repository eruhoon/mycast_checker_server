import { Logger } from '../common/logger/Logger';
import { IStreamCacheContainer } from './IStreamCacheContainer';

const Log = new Logger('StreamCacheContainer');

export abstract class StreamCacheContainer implements IStreamCacheContainer {
  #scheduler: NodeJS.Timer | null;

  constructor() {
    this.#scheduler = null;
  }

  start(interval: number = 10000): void {
    if (this.#scheduler !== null) {
      Log.error('start: Already Start');
      return;
    }
    this.update();
    this.#scheduler = setInterval(() => {
      this.update();
    }, interval);
  }

  stop(): void {
    if (this.#scheduler) {
      clearInterval(this.#scheduler);
    }
    this.#scheduler = null;
  }

  abstract update(): void;
}
