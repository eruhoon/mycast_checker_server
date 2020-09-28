import * as request from "request";

import { Config } from "../../config/Config";
import { IStreamAsyncLoader } from "../../controller/IStreamAsyncLoader";
import { IUserAsyncLoader } from "../../controller/IUserAsyncLoader";
import { StreamInfo, StreamPlatform } from "../../model/Stream";
import { StreamCacheContainer } from "./StreamCacheContainer";

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
        console.time("YoutubeCacheContainer#update");
        let keywords = await this.getStreamIds();
        let channels = await YoutubeCacheUtils.getChannel(keywords);

        let streams: StreamInfo[] = [];
        for (let i = 0; i < channels.length; i++) {
            let channel = channels[i];
            let rawStream = await YoutubeCacheUtils.getStream(channel.id);
            if (rawStream === null) continue;
            let videoId = rawStream.id.videoId;
            let viewer = await YoutubeCacheUtils.getVideoCount(videoId);
            let info: StreamInfo = {
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
                viewer: viewer,
            };
            streams.push(info);
        }
        this.mCaches = streams;

        let onair = streams.length;
        console.log(
            `YoutubeCacheContainer#update: ${onair}/${keywords.length}`
        );
        console.timeEnd("YoutubeCacheContainer#update");
    }

    public getCache(keyword: string): StreamInfo | null {
        let cache = this.mCaches.find((cache) => cache.keyid === keyword);
        if (!cache) {
            return null;
        }
        return cache;
    }

    private async getStreamIds(): Promise<string[]> {
        if (this.mUserLoader === null || this.mStreamLoader === null) {
            console.error("YoutubeCacheContainer#getStreamIds: no loader");
            return [];
        }

        let keywordsFromUser: string[] = (await this.mUserLoader.getUsers())
            .filter((u) => u.getStreamPlatform() === StreamPlatform.YOUTUBE)
            .map((u) => u.getStreamKeyId());

        let keywordsFromStream: string[] = (
            await this.mStreamLoader.getStreams()
        )
            .filter((stream) => stream.platform === StreamPlatform.YOUTUBE)
            .map((stream) => stream.keyword);

        let keywords: string[] = [];
        let addWithoutDuplicated = (keyword: string) => {
            if (!keyword) return;
            if (keywords.findIndex((k) => k === keyword) !== -1) return;
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
        let id = keywords.join(",");
        let key = Config.getYoutubeApiKey();
        let opt = {
            url: "https://www.googleapis.com/youtube/v3/channels",
            timeout: 3000,
            headers: { referer: "http://mycast.xyz" },
            qs: { part: "snippet,brandingSettings", id, key },
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

                let channels: RawChannel[] = body.items;
                resolve(channels);
            });
        });
    }

    public static getStream(channelId: string): Promise<RawStream | null> {
        let key = Config.getYoutubeApiKey();
        let opt = {
            url: "https://www.googleapis.com/youtube/v3/search",
            timeout: 3000,
            headers: { referer: "http://mycast.xyz" },
            qs: {
                part: "snippet",
                channelId,
                eventType: "live",
                type: "video",
                key,
                fields:
                    "items(id(channelId,videoId),snippet(description,thumbnails/high,title))",
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

                let items: RawStream[] = body.items;

                resolve(items[0]);
            });
        });
    }

    public static getVideoCount(videoId: string): Promise<number> {
        return new Promise((resolve) => {
            let url = `https://www.youtube.com/live_stats?v=${videoId}`;
            request.get(url, (err, res, body) => {
                if (err || res.statusCode !== 200 || !body) {
                    resolve(0);
                }
                resolve(parseInt(body));
            });
        });
    }
}
