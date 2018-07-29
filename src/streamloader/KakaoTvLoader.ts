import * as request from 'request';
import { StreamLoaderCallback, StreamLoader } from './StreamLoader';
import { callbackify } from 'util';
import { StreamInfo, StreamPlatform } from '../model/Stream';

type RawKakaoTvChannel = {
	id: string,
	icon: string,
	videoId: string
}

type RawKakaoTvVideo = {
	nickname: string,
	title: string,
	description: string
	url: string,
	thumbnail: string,
	viewer: number
}

export class KakaoTvLoader extends StreamLoader {

	public mChannelId: string;

	public constructor(id: string) {
		super();
		this.mChannelId = id;
	}

	public requestInfo(callback: StreamLoaderCallback): void {
		KakaoTvLoader.loadInfo(this.mChannelId, callback);
	}

	private static async loadInfo(
		channelId: string, callback: StreamLoaderCallback) {

		let channel = await this.loadChannel(channelId);
		let video = await this.loadVideo(channel.videoId);
		let stream: StreamInfo = {
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
		}
		callback(stream);
	}

	private static loadChannel(channelId: string): Promise<RawKakaoTvChannel> {
		return new Promise((resolve, reject) => {
			let opt = {
				url: `http://web-tv.kakao.com/channel/${channelId}`,
				timeout: 5000
			};

			request.get(opt, (err, res, body) => {
				if (err || res.statusCode !== 200) return;

				let path = res.request.uri.pathname;
				let isLive = path.indexOf('livelink') !== -1;
				if (!isLive) return;

				let matched = path.match(/livelink\/(.*)/);
				if (!matched) return;
				let videoId = matched[1];

				let icon = body.match(/\<meta.*og\:image.*content=\"(.*)\"\>/)[1];

				let channel: RawKakaoTvChannel = {
					id: channelId,
					icon: icon,
					videoId: videoId
				}
				resolve(channel);
			});
		});
	}

	private static loadVideo(videoId: string): Promise<RawKakaoTvVideo> {
		let url = `http://web-tv.kakao.com/api/v1/app/livelinks/${videoId}/impress?fulllevels=liveLink&player=monet_flash&section=home&dteType=PC&service=kakao_tv&fields=ccuCount,thumbnailUri`;

		return new Promise((resolve) => {

			let opt = { timeout: 5000, json: true };
			request.get(url, opt, (err, res, body) => {
				if (err || res.statusCode !== 200) return;

				if (!body || !body.liveLink) return;

				let channel = body.liveLink.channel;
				let live = body.liveLink.live;

				let isOnAir = (live.status === "ONAIR");
				if (!isOnAir) return;

				let video: RawKakaoTvVideo = {
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

}