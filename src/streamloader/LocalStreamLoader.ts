import { WowzaCacheContainer } from '../model/cache/WowzaCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { StreamLoader, StreamLoaderCallback } from './StreamLoader';

export class LocalStreamLoader extends StreamLoader {

	public mManager: WowzaCacheContainer;
	public mUser: User;

	public constructor(manager: WowzaCacheContainer, user: User) {
		super();
		this.mManager = manager;
		this.mUser = user;
	}

	public requestInfo(callback: StreamLoaderCallback): void {

		let caches = this.mManager.getCaches();
		const streamKey = this.mUser.getStreamKeyId()

		let cache = caches.find(cache => cache.streamName === streamKey);
		if (cache) {
			let nickname = this.mUser.getNickname();
			let info: StreamInfo = {
				result: true,
				platform: StreamPlatform.LOCAL,
				keyid: streamKey,
				icon: this.mUser.getIcon(),
				nickname: this.mUser.getNickname(),
				thumbnail: this.mUser.getBackground(),
				onair: true,
				title: nickname,
				description: `${nickname}의 방송 [공용채널]`,
				url: `https://mycast.xyz/player/${this.mUser.getIdx()}`,
				viewer: parseInt(cache.sessionsTotal)
			}
			callback(info);
		}
	}

}
