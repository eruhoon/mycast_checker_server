import { StreamInfo, StreamPlatform } from '../model/Stream';
import { ChzzkManager } from '../model/chzzk/ChzzkManager';
import { StreamLoader } from './StreamLoader';

export class ChzzkLoader implements StreamLoader {
  #manager = new ChzzkManager();
  #keyword: string;

  constructor(keyword: string) {
    this.#keyword = keyword;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const raw = await this.#manager.getLiveDetail(this.#keyword);
    if (!raw) {
      return null;
    }
    const stream: StreamInfo = {
      result: true,
      platform: StreamPlatform.CHZZK,
      keyid: this.#keyword,
      icon: raw.content.channel.channelImageUrl,
      nickname: raw.content.channel.channelName,
      title: raw.content.channel.channelName,
      description: raw.content.liveTitle,
      url: `https://chzzk.naver.com/live/${this.#keyword}`,
      thumbnail: raw.content.liveImageUrl,
      onair: true,
      viewer: raw.content.concurrentUserCount,
    };
    return stream;
  }
}
