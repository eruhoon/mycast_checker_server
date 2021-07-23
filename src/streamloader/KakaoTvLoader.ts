import axios from 'axios';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { StreamLoader, StreamLoaderCallback } from './StreamLoader';

type RawKakaoTvChannel = {
  id: string;
  icon: string;
  videoId: string;
};

type RawKakaoTvVideo = {
  nickname: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  viewer: number;
};

export class KakaoTvLoader extends StreamLoader {
  #channelId: string;

  constructor(id: string) {
    super();
    this.#channelId = id;
  }

  requestInfo(callback: StreamLoaderCallback): void {
    KakaoTvLoader.#loadInfo(this.#channelId).then((stream) => {
      if (stream) {
        callback(stream);
      }
    });
  }

  static async #loadInfo(channelId: string): Promise<StreamInfo | null> {
    const channel = await this.#loadChannel(channelId);
    if (!channel) {
      return null;
    }
    const video = await this.#loadVideo(channel.videoId);
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

  static async #loadChannel(
    channelId: string
  ): Promise<RawKakaoTvChannel | null> {
    const url = `http://web-tv.kakao.com/channel/${channelId}`;
    const res = await axios.get(url, { timeout: 5000 });
    const body = res.data;
    if (res.status !== 200) {
      return null;
    }

    const path = res.request.uri.pathname;
    const isLive = path.indexOf('livelink') !== -1;
    if (!isLive) {
      return null;
    }

    const matched = path.match(/livelink\/(.*)/);
    if (!matched) {
      return null;
    }
    const videoId = matched[1];
    const icon = body.match(/\<meta.*og\:image.*content=\"(.*)\"\>/)[1];
    const channel = { id: channelId, icon, videoId };
    return channel;
  }

  static async #loadVideo(videoId: string): Promise<RawKakaoTvVideo | null> {
    const url = `http://web-tv.kakao.com/api/v1/app/livelinks/${videoId}/impress?fulllevels=liveLink&player=monet_flash&section=home&dteType=PC&service=kakao_tv&fields=ccuCount,thumbnailUri`;

    const opt = { timeout: 5000 };
    const res = await axios.get(url, opt);
    const body = res.data;
    if (res.status !== 200) {
      return null;
    }

    if (!body || !body.liveLink) {
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
      url: `http://web-tv.kakao.com//embed/player/livelink/${videoId}`,
      thumbnail: live.thumbnailUri,
      viewer: live.ccuCount,
    };
    return video;
  }
}
