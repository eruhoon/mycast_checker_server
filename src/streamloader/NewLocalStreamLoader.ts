import { NewLocalCacheContainer } from '../model/cache/NewLocalCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { StreamLoader } from './StreamLoader';

export class NewLocalStreamLoader implements StreamLoader {
  #manager: NewLocalCacheContainer;
  #user: User;

  constructor(manager: NewLocalCacheContainer, user: User) {
    this.#manager = manager;
    this.#user = user;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const caches = this.#manager.getCaches();
    const streamKey = this.#user.getStreamKeyId();

    const cache = caches.find((cache) => cache.name === streamKey);
    if (!cache) {
      return null;
    }
    const nickname = this.#user.getNickname();
    const info: StreamInfo = {
      result: true,
      platform: StreamPlatform.LOCAL,
      keyid: streamKey,
      icon: this.#user.getIcon(),
      nickname: this.#user.getNickname(),
      thumbnail: this.#getThumbnail(streamKey),
      onair: true,
      title: nickname,
      description: `${nickname}의 방송 [공용채널]`,
      url: `https://mycast.xyz/player/${streamKey}`,
      viewer: cache.clients,
    };
    return info;
  }

  #getThumbnail(streamKey: string): string {
    const host = 'https://mycast.xyz:9011/thumbs';
    const fileName = `${streamKey}-001.png`;
    const timestamp = new Date().getTime();
    return `${host}/${fileName}?${timestamp}`;
  }
}
