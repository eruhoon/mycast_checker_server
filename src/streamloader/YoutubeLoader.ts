import { YoutubeCacheContainer } from '../model/cache/YoutubeCacheContainer';
import { StreamInfo } from '../model/Stream';
import { StreamLoader } from './StreamLoader';

export class YoutubeLoader implements StreamLoader {
  #manager: YoutubeCacheContainer;
  #channelId: string;

  constructor(manager: YoutubeCacheContainer, channelId: string) {
    this.#manager = manager;
    this.#channelId = channelId;
  }

  async getInfo(): Promise<StreamInfo | null> {
    return this.#manager.getCache(this.#channelId);
  }
}
