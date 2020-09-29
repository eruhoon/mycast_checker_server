import * as request from 'request';

import { Config } from '../../config/Config';
import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { StreamInfo, StreamPlatform } from '../../model/Stream';
import { StreamCacheContainer } from './StreamCacheContainer';

export class YoutubeCacheContainer extends StreamCacheContainer {
    private mUserLoader: IUserAsyncLoader | null = null;
    private mStreamLoader: IStreamAsyncLoader | null = null;
    private mCaches: StreamInfo[];

    public constructor(
        userLoader: IUserAsyncLoader,
        streamloader: IStreamAsyncLoader
    ) {
        super();

        this.mCaches = [];
        this.mUserLoader = userLoader;
        this.mStreamLoader = streamloader;
    }

    public async update() {
        console.time('YoutubeCacheContainer#update');
        const keywords = await this.getStreamIds();
        const channels = await YoutubeCacheUtils.getChannel(keywords);

        const streams: StreamInfo[] = [];
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i];
            const rawStream = await YoutubeCacheUtils.getStream(channel.id);
            if (rawStream === null) {
                continue;
            }
            const videoId = rawStream.id.videoId;
            const viewer = await YoutubeCacheUtils.getVideoCount(videoId);
            const info: StreamInfo = {
                result: true,
                platform: StreamPlatform.YOUTUBE,
                keyid: channel.id,
                icon: channel.snippet.thumbnails.high.url,
                nickname: channel.snippet.title,
                title: channel.snippet.title,
                description: rawStream.snippet.title,
                url: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
                thumbnail: rawStream.snippet.thumbnails.high.url,
                onair: true,
                viewer,
            };
            streams.push(info);
        }
        this.mCaches = streams;

        const onair = streams.length;
        console.log(
            `YoutubeCacheContainer#update: ${onair}/${keywords.length}`
        );
        console.timeEnd('YoutubeCacheContainer#update');
    }

    public getCache(keyword: string): StreamInfo | null {
        const cache = this.mCaches.find((cache) => cache.keyid === keyword);
        if (!cache) {
            return null;
        }
        return cache;
    }

    private async getStreamIds(): Promise<string[]> {
        if (this.mUserLoader === null || this.mStreamLoader === null) {
            console.error('YoutubeCacheContainer#getStreamIds: no loader');
            return [];
        }

        const keywordsFromUser: string[] = (await this.mUserLoader.getUsers())
            .filter((u) => u.getStreamPlatform() === StreamPlatform.YOUTUBE)
            .map((u) => u.getStreamKeyId());

        const keywordsFromStream: string[] = (
            await this.mStreamLoader.getStreams()
        )
            .filter((stream) => stream.platform === StreamPlatform.YOUTUBE)
            .map((stream) => stream.keyword);

        const keywords: string[] = [];
        const addWithoutDuplicated = (keyword: string) => {
            if (!keyword) {
                return;
            }
            if (keywords.findIndex((k) => k === keyword) !== -1) {
                return;
            }
            keywords.push(keyword);
        };
        keywordsFromUser.forEach((keyword) => addWithoutDuplicated(keyword));
        keywordsFromStream.forEach((keyword) => addWithoutDuplicated(keyword));

        return keywords;
    }
}

type RawChannel = {
    id: string;
    kind: string;
    etag: string;
    snippet: {
        title: string;
        description: string;
        customUrl: string;
        publishedAt: string;
        thumbnails: {
            default: { url: string; width: number; height: number };
            medium: { url: string; width: number; height: number };
            high: { url: string; width: number; height: number };
        };
        defaultLanguage: string;
        localized: {
            title: string;
            description: string;
        };
        country: string;
    };
};

type RawStream = {
    id: {
        videoId: string;
    };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            high: {
                url: string;
                width: number;
                height: number;
            };
        };
    };
};

class YoutubeCacheUtils {
    public static async getChannel(keywords: string[]): Promise<RawChannel[]> {
        const id = keywords.join(',');
        const key = Config.getYoutubeApiKey();
        const opt = {
            url: 'https://www.googleapis.com/youtube/v3/channels',
            timeout: 3000,
            headers: { referer: 'http://mycast.xyz' },
            qs: { part: 'snippet,brandingSettings', id, key },
            json: true,
        };

        return new Promise<RawChannel[]>((resolve) => {
            request.get(opt, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    resolve([]);
                    return;
                }
                if (!body || body === undefined) {
                    resolve([]);
                    return;
                }
                if (body.pageInfo.totalResults < 1) {
                    resolve([]);
                    return;
                }

                const channels: RawChannel[] = body.items;
                resolve(channels);
            });
        });
    }

    public static getStream(channelId: string): Promise<RawStream | null> {
        const key = Config.getYoutubeApiKey();
        const opt = {
            url: 'https://www.googleapis.com/youtube/v3/search',
            timeout: 3000,
            headers: { referer: 'http://mycast.xyz' },
            qs: {
                part: 'snippet',
                channelId,
                eventType: 'live',
                type: 'video',
                key,
                fields:
                    'items(id(channelId,videoId),snippet(description,thumbnails/high,title))',
            },
            json: true,
        };

        return new Promise((resolve) => {
            request.get(opt, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    resolve(null);
                    return;
                }
                if (!body || body === undefined) {
                    resolve(null);
                    return;
                }
                if (body.items.length < 1) {
                    resolve(null);
                    return;
                }

                const items: RawStream[] = body.items;

                resolve(items[0]);
            });
        });
    }

    public static getVideoCount(videoId: string): Promise<number> {
        return new Promise((resolve) => {
            const url = `https://www.youtube.com/live_stats?v=${videoId}`;
            request.get(url, (err, res, body) => {
                if (err || res.statusCode !== 200 || !body) {
                    resolve(0);
                }
                resolve(parseInt(body));
            });
        });
    }
}
