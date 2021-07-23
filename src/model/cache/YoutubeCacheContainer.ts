import { StreamInfo } from '../../model/Stream';
import { StreamCacheContainer } from './StreamCacheContainer';

export class YoutubeCacheContainer extends StreamCacheContainer {
  private mCaches: StreamInfo[];

  constructor() {
    super();

    this.mCaches = [];
  }

  async update() {
    return;
  }

  getCache(keyword: string): StreamInfo | null {
    const cache = this.mCaches.find((cache) => cache.keyid === keyword);
    if (!cache) {
      return null;
    }
    return cache;
  }
}
