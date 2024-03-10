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
    const profile = await this.#manager.getProfile(this.#keyword);
    const raw = await this.#manager.getLiveStatus(this.#keyword);
    if (!raw || raw.content.status !== 'OPEN') {
      return null;
    }
    const stream: StreamInfo = {
      result: true,
      platform: StreamPlatform.CHZZK,
      keyid: this.#keyword,
      icon: profile.content.profileImageUrl,
      nickname: profile.content.nickname,
      title: profile.content.nickname,
      description: raw.content.liveTitle,
      url: `https://chzzk.naver.com/live/${this.#keyword}`,
      thumbnail: '',
      onair: true,
      viewer: raw.content.concurrentUserCount,
    };
    return stream;
  }
}
