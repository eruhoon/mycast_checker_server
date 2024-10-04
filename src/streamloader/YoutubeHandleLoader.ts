import axios from 'axios';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { YoutubeCacheContainer } from '../model/cache/YoutubeCacheContainer';
import { StreamLoader } from './StreamLoader';

export class YoutubeHandleLoader implements StreamLoader {
  #container: YoutubeCacheContainer;
  #handle: string;

  constructor(container: YoutubeCacheContainer, handle: string) {
    this.#handle = handle;
    this.#container = container;
  }

  async getInfo(): Promise<StreamInfo | null> {
    const cached = this.#container.getCache(this.#handle);
    if (cached !== undefined) {
      return cached;
    }
    const info = await this.getInfoByRequest();
    this.#container.updateCache(this.#handle, info);
    return info;
  }

  async getInfoByRequest(): Promise<StreamInfo | null> {
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

    const isLive = data.indexOf('"style":"LIVE"') > 0;
    const scriptMatch = data.match(/var ytInitialData = (.*?);<\/script>/);
    const rawJson = scriptMatch?.[1];
    if (isLive && rawJson) {
      const json = JSON.parse(scriptMatch?.[1]);
      const tabs = json?.contents?.twoColumnBrowseResultsRenderer?.tabs;
      const liveTab = tabs?.find(
        (tab: any) => tab.tabRenderer.title === '라이브'
      );
      const rawLiveContents =
        liveTab?.tabRenderer?.content?.richGridRenderer?.contents;
      const liveContents = rawLiveContents
        .map((raw: any) => raw.richItemRenderer?.content?.videoRenderer)
        .filter((c: any) => c)
        .filter((c: any) => !c.upcomingEventData)
        .filter((c: any) => !c.lengthText);
      if (liveContents.length > 0) {
        const liveContent = liveContents[0];
        const videoId = liveContent.videoId;
        const thumbnail = liveContent.thumbnail.thumbnails?.[0]?.url;
        return { id: videoId, thumbnail };
      } else {
        return null;
      }
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
    console.log(data.length);
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
