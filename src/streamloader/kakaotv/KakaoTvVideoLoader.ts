import axios from 'axios';
import { Logger } from '../../model/common/logger/Logger';

const Log = new Logger('KakaoTvVideoLoader');

export class KakaoTvVideoLoader {
  async load(videoId: string): Promise<RawKakaoTvVideo | null> {
    const body = await this.#request(videoId);
    if (!body || !body.liveLink) {
      Log.error('KakaoTvLoader: structure error');
      return null;
    }

    const channel = body.liveLink.channel;
    const live = body.liveLink.live;

    const isOnAir = live.status === 'ONAIR';
    if (!isOnAir) {
      return null;
    }

    const video: RawKakaoTvVideo = {
      nickname: channel.name,
      title: channel.name,
      description: live.title,
      url: `http://web-tv.kakao.com/embed/player/livelink/${videoId}`,
      thumbnail: live.thumbnailUri,
      viewer: parseInt(live.ccuCount),
    };
    return video;
  }

  async #request(videoId: string): Promise<RawVideo | null> {
    const host = `http://web-tv.kakao.com/api/v1/app`;
    const dir = `livelinks/${videoId}/impress`;
    const query = new URLSearchParams({
      fulllevels: 'liveLink',
      player: 'monet_flash',
      section: 'home',
      dteType: 'PC',
      service: 'kakao_tv',
      fields: 'ccuCount,thumbnailUri',
    });
    const url = `${host}/${dir}?${query}`;
    try {
      const { data } = await axios.get(url, { timeout: 5000 });
      return data;
    } catch (e) {
      Log.error('request: error: ' + e);
      return null;
    }
  }
}

type RawKakaoTvVideo = {
  nickname: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  viewer: number;
};

type RawVideo = {
  liveLink: {
    channelId: number;
    liveId: number;
    displayTitle: string;
    channel: {
      id: number;
      userId: number;
      name: string;
      description: string;
    };
    live: {
      id: number;
      userId: number;
      channelId: number;
      title: string;
      description: string;
      status: string;
      ccuCount: string;
      thumbnailUri: string;
    };
  };
};
