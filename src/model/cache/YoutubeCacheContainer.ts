import { StreamInfo } from '../Stream';
import { StreamCacheContainer } from './StreamCacheContainer';

export class YoutubeCacheContainer extends StreamCacheContainer {
  #caches: StreamInfo[];

  constructor() {
    super();

    this.#caches = [];
  }

  async update() {
    return;
  }

  getCache(keyword: string): StreamInfo | null {
    const cache = this.#caches.find((cache) => cache.keyid === keyword);
    if (!cache) {
      return null;
    }
    return cache;
  }
}
