import axios from 'axios';
import * as qs from 'qs';
import { Logger } from '../../model/common/logger/Logger';

const Log = new Logger('KakaoTvVideoLoader');

export class KakaoTvVideoLoader {
  async load(videoId: string): Promise<RawKakaoTvVideo | null> {
    const host = `http://web-tv.kakao.com/api/v1/app`;
    const dir = `livelinks/${videoId}/impress`;
    const query = qs.stringify({
      fulllevels: 'liveLink',
      player: 'monet_flash',
      section: 'home',
      dteType: 'PC',
      service: 'kakao_tv',
      fields: 'ccuCount,thumbnailUri',
    });
    const url = `${host}/${dir}?${query}`;

    const opt = { timeout: 5000 };
    const res = await axios.get(url, opt);
    const body = res.data;
    if (!res || res.status !== 200 || !body) {
      Log.error('KakaoTvLoader: network error');
      return null;
    }

    if (!body.liveLink) {
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
}

type RawKakaoTvVideo = {
  nickname: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  viewer: number;
};
