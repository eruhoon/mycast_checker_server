import { Logger } from '../model/common/logger/Logger';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { KakaoTvChannelLoader } from './kakaotv/KakaoTvChannelLoader';
import { KakaoTvVideoLoader } from './kakaotv/KakaoTvVideoLoader';
import { StreamLoader } from './StreamLoader';

export class KakaoTvLoader implements StreamLoader {
  #channelId: string;
  #channelLoader = new KakaoTvChannelLoader();
  #videoLoader = new KakaoTvVideoLoader();

  constructor(id: string) {
    this.#channelId = id;
  }

  async getInfo(): Promise<StreamInfo | null> {
    return this.#loadInfo(this.#channelId);
  }

  async #loadInfo(channelId: string): Promise<StreamInfo | null> {
    const channel = await this.#channelLoader.load(channelId);
    if (!channel) {
      return null;
    }
    const video = await this.#videoLoader.load(channel.videoId);
    if (!video) {
      return null;
    }
    const stream: StreamInfo = {
      result: true,
      platform: StreamPlatform.KAKAOTV,
      keyid: channel.id,
      icon: channel.icon,
      nickname: video.nickname,
      thumbnail: video.thumbnail,
      onair: true,
      title: video.title,
      description: video.description,
      url: video.url,
      viewer: video.viewer,
    };
    return stream;
  }
}
