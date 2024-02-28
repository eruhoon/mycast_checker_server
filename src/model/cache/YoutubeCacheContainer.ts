import { StreamInfo } from '../Stream';

export class YoutubeCacheContainer {
  #caches: Caches<string, StreamInfo | null>[];

  constructor() {
    this.#caches = [];
  }

  updateCache(key: string, info: StreamInfo | null) {
    const filtered = this.#caches.filter(
      (cache) => !cache.isStale && cache.key !== key
    );
    this.#caches = [...filtered, new Caches(key, info)];
  }

  getCache(handle: string): StreamInfo | null | undefined {
    const cache = this.#caches.find((cache) => cache.key === handle);
    return cache?.data;
  }
}

class Caches<K, V> {
  readonly key: K;
  #rawData: V;
  #expiredTime: number;

  constructor(key: K, data: V) {
    this.key = key;
    this.#rawData = data;
    this.#expiredTime = new Date().getTime() + 2 * 60 * 1000;
  }

  get data(): V | undefined {
    if (this.isStale) {
      return undefined;
    }
    return this.#rawData;
  }

  get rawData(): V {
    return this.#rawData;
  }

  get isStale(): boolean {
    const now = new Date().getTime();
    return now > this.#expiredTime;
  }
}
