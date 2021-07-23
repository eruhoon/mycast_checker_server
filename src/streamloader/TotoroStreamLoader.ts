import { TotoroCacheContainer } from '../model/cache/TotoroCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { StreamLoader } from './StreamLoader';

export class TotoroStreamLoader implements StreamLoader {
  #manager: TotoroCacheContainer;
  #user: User;

  constructor(manager: TotoroCacheContainer, user: User) {
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
      platform: StreamPlatform.TOTORO,
      keyid: streamKey,
      icon: this.#user.getIcon(),
      nickname: this.#user.getNickname(),
      // thumbnail: this.mUser.getBackground(), //2dfff.png
      thumbnail: this.#getThumbnail(streamKey),
      onair: true,
      title: nickname,
      description: `${nickname}의 방송 [이웃채널]`,
      url: `https://mycast.xyz/player/totoro/${streamKey}`,
      viewer: cache.clients,
    };
    return info;
  }

  #getThumbnail(streamKey: string): string {
    const host = 'https://parasite.banjai.tv/live';
    const fileName = `${streamKey}.jpeg`;
    const timestamp = new Date().getTime();
    return `${host}/${fileName}?${timestamp}`;
  }
}
