import axios from 'axios';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { StreamLoader } from './StreamLoader';

export class YoutubeVideoLoader implements StreamLoader {
  #videoId: string;

  constructor(videoId: string) {
    this.#videoId = videoId;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const detail = await this.#requestVideoInfo(this.#videoId);

    if (!detail) {
      return null;
    }

    return {
      keyid: this.#videoId,
      description: detail?.description || '',
      icon: detail?.icon || '',
      nickname: this.#videoId,
      onair: true,
      platform: StreamPlatform.YOUTUBE_PRIVATE,
      result: true,
      thumbnail: '',
      title: detail?.title || '',
      url: `https://www.youtube.com/embed/${this.#videoId}`,
      viewer: detail?.viewer || 0,
    };
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
      const viewer = Number.parseInt(viewerText.replace(',', ''));
      return { title, description, icon, viewer };
    }
    return null;
  }
}
