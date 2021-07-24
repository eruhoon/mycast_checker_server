import axios from 'axios';
import * as qs from 'qs';
import { Logger } from '../model/common/logger/Logger';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { StreamLoader } from './StreamLoader';

const Log = new Logger('AfreecaLoader');

export class AfreecaLoader implements StreamLoader {
  #id: string;

  constructor(id: string) {
    this.#id = id;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const rawInfo = await this.#requestInfo();
    if (!rawInfo) {
      return null;
    }
    const stream = this.#parseInfo(rawInfo);
    return stream;
  }

  async #requestInfo(): Promise<RawAfreecaInfo | null> {
    const host = 'http://sch.afreeca.com/api.php';
    const query = qs.stringify({
      m: 'liveSearch',
      v: '1.0',
      szOrder: '',
      c: 'EUC-KR',
      szKeyword: this.#id,
    });
    const url = `${host}?${query}`;
    try {
      const res = await axios.get<RawAfreecaInfo>(url, { timeout: 3000 });
      if (!res || res.status !== 200 || !res.data) {
        return null;
      }
      return res.data;
    } catch (e) {
      return null;
    }
  }

  #parseInfo(raw: RawAfreecaInfo): StreamInfo | null {
    const realBroad = raw.REAL_BROAD.find((e) => e.user_id === this.#id);
    if (!realBroad) {
      return null;
    }

    const id = realBroad.user_id;
    const broadNo = realBroad.broad_no;
    const prefix = id.substring(0, 2);

    const stream: StreamInfo = {
      result: true,
      platform: StreamPlatform.AFREECA,
      keyid: realBroad.user_id,
      icon: `http://stimg.afreeca.com/LOGO/${prefix}/${id}/${id}.jpg`,
      nickname: realBroad.user_nick,
      title: realBroad.station_name,
      description: realBroad.broad_title,
      url: `https://play.afreecatv.com/${id}/embed`,
      thumbnail: `https://liveimg.afreecatv.com/${broadNo}_240x135.gif`,
      onair: true,
      viewer: parseInt(realBroad.total_view_cnt),
    };
    return stream;
  }
}

interface RawAfreecaInfo {
  REAL_BROAD: [
    {
      user_id: string;
      user_nick: string;
      broad_no: string;
      station_name: string;
      broad_title: string;
      sn_url: string;
      total_view_cnt: string;
    }
  ];
}
