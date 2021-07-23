import { TwitchCacheContainer } from '../model/cache/TwitchCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { StreamLoader } from './StreamLoader';

export class TwtichLoader implements StreamLoader {
  #container: TwitchCacheContainer;
  #keyword: string;

  constructor(manager: TwitchCacheContainer, keyword: string) {
    this.#container = manager;
    this.#keyword = keyword;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const cache = this.#container.getCache(this.#keyword);
    if (cache === null) {
      return null;
    }
    if (cache.stream === null) {
      return null;
    }
    if (cache.user === null) {
      return null;
    }

    const info: StreamInfo = {
      result: true,
      platform: StreamPlatform.TWITCH,
      keyid: cache.keyword,
      icon: cache.user.profile_image_url,
      nickname: cache.user.display_name,
      title: cache.user.display_name,
      description: cache.stream.title,
      url: `//player.twitch.tv/?channel=${this.#keyword}`,
      onair: true,
      viewer: cache.stream.viewer_count,
      thumbnail: cache.stream.thumbnail_url,
    };
    return info;
  }
}
