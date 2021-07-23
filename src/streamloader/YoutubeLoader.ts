import { YoutubeCacheContainer } from '../model/cache/YoutubeCacheContainer';
import { StreamInfo } from '../model/Stream';
import { StreamLoader2 } from './StreamLoader2';

export class YoutubeLoader extends StreamLoader2 {
  private mManager: YoutubeCacheContainer;
  private mChannelId: string;

  constructor(manager: YoutubeCacheContainer, channelId: string) {
    super();
    this.mManager = manager;
    this.mChannelId = channelId;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const cache = this.mManager.getCache(this.mChannelId);
    return cache;
  }
}
