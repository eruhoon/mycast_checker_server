import { TwitchCacheManager } from "../manager/cache/TwitchCacheManager";
import { StreamInfo, StreamPlatform } from "../model/Stream";
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";

export class TwtichLoader extends StreamLoader {

	private mKeyword: string;

	public constructor(keyword: string) {
		super();
		this.mKeyword = keyword;
	}

	public requestInfo(callback: StreamLoaderCallback) {
		let cache = TwitchCacheManager.getInstance().getCache(this.mKeyword);
		if (cache === null) {
			return;
		}
		if (cache.stream === null) {
			return;
		}

		let info: StreamInfo = {
			result: true,
			platform: StreamPlatform.TWITCH,
			keyid: cache.keyword,
			icon: cache.user.profile_image_url,
			nickname: cache.user.display_name,
			title: cache.user.display_name,
			description: cache.stream.title,
			url: `https://player.twitch.tv/?channel=${this.mKeyword}`,
			onair: true,
			viewer: cache.stream.viewer_count,
			thumbnail: cache.stream.thumbnail_url
		};
		callback(info);
	}

}