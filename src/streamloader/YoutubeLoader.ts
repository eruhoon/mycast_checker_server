import * as request from 'request';
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";
import { StreamInfo } from '../model/Stream';
import { YoutubeCacheManager } from '../manager/cache/YoutubeCacheManager';

export class YoutubeLoader extends StreamLoader {


	public mChannelId: string;

	public constructor(channelId: string) {
		super();
		this.mChannelId = channelId;
	}

	public requestInfo(callback: StreamLoaderCallback): void {
		let cache = YoutubeCacheManager.getInstance().getCache(this.mChannelId);
		if (cache === null) {
			return;
		}
		callback(cache);
	}
}

