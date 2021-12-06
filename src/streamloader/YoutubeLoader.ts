import axios from 'axios';
import * as https from 'https';
import { YoutubeCacheContainer } from '../model/cache/YoutubeCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { StreamLoader } from './StreamLoader';

export class YoutubeLoader implements StreamLoader {
  #channelId: string;

  constructor(container: YoutubeCacheContainer, channelId: string) {
    this.#channelId = channelId;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const videoId = await this.#requestInfo();
    if (!videoId) {
      return null;
    } else {
      const detail = await this.#requestVideoInfo(videoId);
      return {
        keyid: this.#channelId,
        description: detail?.description || '',
        icon: detail?.icon || '',
        nickname: this.#channelId,
        onair: true,
        platform: StreamPlatform.YOUTUBE,
        result: true,
        thumbnail: '',
        title: detail?.title || '',
        url: `https://www.youtube.com/embed/${videoId}`,
        viewer: detail?.viewer || 0,
      };
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
      const viewer = Number.parseInt(viewerText.replace(',', ''));
      return { title, description, icon, viewer };
    }
    return null;
  }

  #requestInfo(): Promise<string | null> {
    return new Promise((resolve) => {
      const channelUrl = `https://www.youtube.com/channel/${
        this.#channelId
      }/live`;
      const request = https.get(channelUrl, (response) => {
        let data = '';

        response
          .on('data', (d) => {
            data += d;
          })
          .on('end', () => {
            const streamId = this.#findLiveStreamId(data);
            if (!streamId) {
              resolve(null);
            } else {
              resolve(streamId);
            }
          });
      });
      request.on('error', (error) => {
        throw error;
      });
    });
  }

  #findLiveStreamId(page: string): string | null {
    const regex = /{"liveStreamabilityRenderer":{"videoId":"((\\"|[^"])*)"/g;
    let match = regex.exec(page);
    if (match === null) {
      return null;
    } else {
      return match[1];
    }
  }
}
