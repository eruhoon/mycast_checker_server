import axios from 'axios';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { YoutubeCacheContainer } from '../model/cache/YoutubeCacheContainer';
import { StreamLoader } from './StreamLoader';

export class YoutubeHandleLoader implements StreamLoader {
  #handle: string;

  constructor(container: YoutubeCacheContainer, handle: string) {
    this.#handle = handle;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const live = await this.#findLiveVideo();
    if (!live) {
      return null;
    }
    const detail = await this.#requestVideoInfo(live.id);
    return {
      keyid: this.#handle,
      description: detail?.description || '',
      icon: detail?.icon || '',
      nickname: this.#handle,
      onair: true,
      platform: StreamPlatform.YOUTUBE,
      result: true,
      thumbnail: live.thumbnail,
      title: detail?.title || '',
      url: `https://www.youtube.com/embed/${live.id}`,
      viewer: detail?.viewer || 0,
    };
  }

  async #findLiveVideo(): Promise<{ id: string; thumbnail: string } | null> {
    const { data } = await axios.get<string>(
      `https://www.youtube.com/${this.#handle}/streams`
    );

    const match = data.match(/\"videoRenderer\":\{.*?\}/g);
    const found = match?.find((str) => str.includes('_live'));
    const videoIdMatch = found?.match(/\"videoId\":\"(.*?)\"/);
    const videoId = videoIdMatch?.[1];
    const thumbMatch = found?.match(/\"url\":\"(.*?)\"/);
    const thumbnail = thumbMatch?.[1] ?? '';
    if (videoId) {
      return { id: videoId, thumbnail };
    } else {
      return null;
    }
  }

  async #requestVideoInfo(videoId: string): Promise<{
    title: string;
    description: string;
    icon: string;
    viewer: number;
  } | null> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const { data } = await axios.get(url);
    const regex = /var ytInitialData = (.*);</;
    const match = regex.exec(data);
    if (match) {
      const json = JSON.parse(match[1]);
      const contents = json?.contents;
      const watchResults = contents?.twoColumnWatchNextResults;
      const results = watchResults?.results?.results;
      const innerContents = results?.contents;
      const primary = innerContents.find(
        (c: any) => c.videoPrimaryInfoRenderer
      ).videoPrimaryInfoRenderer;
      const secondary = innerContents.find(
        (c: any) => c.videoSecondaryInfoRenderer
      ).videoSecondaryInfoRenderer;
      const owner = secondary?.owner;
      const ownerRenderer = owner?.videoOwnerRenderer;
      const icon = ownerRenderer?.thumbnail?.thumbnails[0]?.url;
      const title = ownerRenderer?.title?.runs[0]?.text;
      const description = primary.title.runs[0]?.text;
      const viewCount = primary.viewCount?.videoViewCountRenderer.viewCount;
      const viewerText = viewCount?.runs[1]?.text;
      const viewer = Number.parseInt(viewerText?.replace(',', ''));
      return { title, description, icon, viewer };
    }
    return null;
  }
}
