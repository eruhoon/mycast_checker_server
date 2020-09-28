import * as request from "request";
import { callbackify } from "util";

import { StreamInfo, StreamPlatform } from "../model/Stream";
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";

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
    private static async loadInfo(
        channelId: string,
        callback: StreamLoaderCallback
    ) {
        const channel = await this.loadChannel(channelId);
        const video = await this.loadVideo(channel.videoId);
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
        callback(stream);
    }

    private static loadChannel(channelId: string): Promise<RawKakaoTvChannel> {
        return new Promise((resolve, reject) => {
            const opt = {
                url: `http://web-tv.kakao.com/channel/${channelId}`,
                timeout: 5000,
            };

            request.get(opt, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    return;
                }

                const path = res.request.uri.pathname;
                const isLive = path.indexOf("livelink") !== -1;
                if (!isLive) {
                    return;
                }

                const matched = path.match(/livelink\/(.*)/);
                if (!matched) {
                    return;
                }
                const videoId = matched[1];

                const icon = body.match(
                    /\<meta.*og\:image.*content=\"(.*)\"\>/
                )[1];

                const channel: RawKakaoTvChannel = {
                    id: channelId,
                    icon,
                    videoId,
                };
                resolve(channel);
            });
        });
    }

    private static loadVideo(videoId: string): Promise<RawKakaoTvVideo> {
        const url = `http://web-tv.kakao.com/api/v1/app/livelinks/${videoId}/impress?fulllevels=liveLink&player=monet_flash&section=home&dteType=PC&service=kakao_tv&fields=ccuCount,thumbnailUri`;

        return new Promise((resolve) => {
            const opt = { timeout: 5000, json: true };
            request.get(url, opt, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                    return;
                }

                if (!body || !body.liveLink) {
                    return;
                }

                const channel = body.liveLink.channel;
                const live = body.liveLink.live;

                const isOnAir = live.status === "ONAIR";
                if (!isOnAir) {
                    return;
                }

                const video: RawKakaoTvVideo = {
                    nickname: channel.name,
                    title: channel.name,
                    description: live.title,
                    url: `http://web-tv.kakao.com//embed/player/livelink/${videoId}`,
                    thumbnail: live.thumbnailUri,
                    viewer: live.ccuCount,
                };
                resolve(video);
            });
        });
    }

    public mChannelId: string;

    public constructor(id: string) {
        super();
        this.mChannelId = id;
    }

    public requestInfo(callback: StreamLoaderCallback): void {
        KakaoTvLoader.loadInfo(this.mChannelId, callback);
    }
}
