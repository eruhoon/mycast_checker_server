import axios from 'axios';
import { Logger } from '../../model/common/logger/Logger';

type RawKakaoTvChannel = {
  id: string;
  icon: string;
  videoId: string;
};

const Log = new Logger('KakaoTvChannelLoader');

export class KakaoTvChannelLoader {
  async load(channelId: string): Promise<RawKakaoTvChannel | null> {
    const res = await this.#request(channelId);
    if (!res) {
      return null;
    }
    const { body, path } = res;
    const isLive = path.indexOf('livelink') !== -1;
    if (!isLive) {
      return null;
    }

    const pathMatched = path.match(/livelink\/(.*)\?.*/);
    if (!pathMatched) {
      return null;
    }
    const videoId = pathMatched[1];
    const iconMatched = body.match(/\<meta.*og\:image.*content=\"(.*)\"\>/);
    const icon = iconMatched ? iconMatched[1] : '';
    const channel = { id: channelId, icon, videoId };
    return channel;
  }

  async #request(channelId: string): Promise<Response | null> {
    const url = `http://web-tv.kakao.com/channel/${channelId}`;
    try {
      const res = await axios.get(url, { timeout: 5000 });
      const body = res.data;
      const path = res.request.path;
      return { body, path };
    } catch {
      Log.error('loadChannel: network error');
      return null;
    }
  }
}

type Response = {
  path: string;
  body: string;
};
