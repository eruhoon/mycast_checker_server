import axios from 'axios';
import * as QueryString from 'qs';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { StreamLoader } from './StreamLoader';

export class AfreecaLoader implements StreamLoader {
  #id: string;

  constructor(id: string) {
    this.#id = id;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const host = 'http://sch.afreeca.com/api.php';
    const query = QueryString.stringify({
      m: 'liveSearch',
      v: '1.0',
      szOrder: '',
      c: 'EUC-KR',
      szKeyword: this.#id,
    });
    const url = `${host}?${query}`;
    const res = await axios.get<RawAfreecaInfo>(url, { timeout: 3000 });
    const body = res.data;

    const realBroad = body.REAL_BROAD.find((e) => e.user_id === this.#id);
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
