import { StreamPlatform, StreamInfo, StreamSet } from './model/Stream';
import { TwtichLoader } from './streamloader/TwitchLoader';
import { UserExternalDecorator } from './streamloader/UserExternalDecorator';
import { StreamLoader } from './streamloader/StreamLoader';
import { AfreecaLoader } from './streamloader/AfreecaLoader';
import { KakaoTvLoader } from './streamloader/KakaoTvLoader';
import { MixerLoader } from './streamloader/MixerLoader';
import { LocalStreamLoader } from './streamloader/LocalStreamLoader';
import { YoutubeLoader } from './streamloader/YoutubeLoader';
import { IUserAsyncLoader } from './controller/IUserAsyncLoader';
import { IStreamAsyncLoader } from './controller/IStreamAsyncLoader';
import { WowzaCacheContainer } from './model/cache/WowzaCacheContainer';
import { TwitchCacheContainer } from './model/cache/TwitchCacheContainer';
import { YoutubeCacheContainer } from './model/cache/YoutubeCacheContainer';
import { StreamRewardProvider } from './controller/StreamRewardProvider';

export class Checker {

	private static DEFAULT_SENSITIVITY: number = 3;

	private mUserLoader: IUserAsyncLoader;
	private mStreamLoader: IStreamAsyncLoader;

	private mWowzaCacheManager: WowzaCacheContainer;
	private mTwitchCacheManager: TwitchCacheContainer;
	private mYoutubeCacheManager: YoutubeCacheContainer;

	private mStreams: CheckerEntry[] = [];

	public constructor(
		userLoader: IUserAsyncLoader, streamloader: IStreamAsyncLoader) {

		this.mUserLoader = userLoader;
		this.mStreamLoader = streamloader;

		this.mWowzaCacheManager = new WowzaCacheContainer();
		this.mTwitchCacheManager =
			new TwitchCacheContainer(userLoader, streamloader);
		this.mYoutubeCacheManager =
			new YoutubeCacheContainer(userLoader, streamloader);

		this.initCacheManager();
	}

	public initCacheManager() {
		this.mWowzaCacheManager.start();
		this.mTwitchCacheManager.start();
		this.mYoutubeCacheManager.start(60000);
	}

	public async update() {

		this.updateStream();

		let users = await this.mUserLoader.getUsers();
		users.forEach(user => {
			let loader: StreamLoader = null;
			let platform = user.getStreamPlatform();
			switch (platform) {
				case StreamPlatform.LOCAL:
					loader = new LocalStreamLoader(
						this.mWowzaCacheManager, user);
					break;
				case StreamPlatform.AFREECA:
					loader = new AfreecaLoader(user.getStreamKeyId());
					loader = new UserExternalDecorator(user, loader);
					break;
				case StreamPlatform.TWITCH:
					loader = new TwtichLoader(
						this.mTwitchCacheManager, user.getStreamKeyId());
					loader = new UserExternalDecorator(user, loader);
					break;
				case StreamPlatform.MIXER:
					loader = new MixerLoader(user.getStreamKeyId());
					loader = new UserExternalDecorator(user, loader);
					break;
			}

			if (loader !== null) {
				loader.requestInfo(info => {
					if (info.platform === StreamPlatform.LOCAL) {
						let provider = new StreamRewardProvider();
						provider.requestStreamReward(user.getHash(), info.viewer);
					}
					this.addStream(CheckerType.LOCAL, info);
				});
			}
		});

		let streamRows = await this.mStreamLoader.getStreams();
		streamRows.forEach(row => {
			let loader: StreamLoader = null;
			let platform = row.platform;
			switch (platform) {
				case StreamPlatform.AFREECA:
					loader = new AfreecaLoader(row.keyword);
					break;
				case StreamPlatform.TWITCH:
					loader = new TwtichLoader(
						this.mTwitchCacheManager, row.keyword);
					break;
				case StreamPlatform.KAKAOTV:
					loader = new KakaoTvLoader(row.keyword);
					break;
				case StreamPlatform.MIXER:
					loader = new MixerLoader(row.keyword);
					break;
				case StreamPlatform.YOUTUBE:
					loader = new YoutubeLoader(
						this.mYoutubeCacheManager, row.keyword);
					break;
			}

			if (loader !== null) {
				loader.requestInfo(info => {
					if (!info || !info.result) return;
					if (!info.onair) return;
					this.addStream(CheckerType.EXTERNAL, info);
				});
			}
		});
	}

	private updateStream() {

		this.mStreams = this.mStreams.filter((info: CheckerEntry) => {
			info.sensitivity--;
			return info.sensitivity > 0;
		});
	}

	private addStream(type: CheckerType, info: StreamInfo) {
		let checkerEntry: CheckerEntry = {
			type: type,
			stream: info,
			sensitivity: Checker.DEFAULT_SENSITIVITY
		};

		let isUpdate = false;
		this.mStreams = this.mStreams.map(entry => {
			let keyId = entry.stream.keyid;
			let platform = entry.stream.platform;
			if (keyId === info.keyid && platform === info.platform) {
				isUpdate = true;
				return checkerEntry;
			}
			return entry;
		});

		if (!isUpdate) {
			this.mStreams.push(checkerEntry);
		}
	}


	public getStreams(): StreamSet {

		let local = this.mStreams
			.filter(e => e.type === CheckerType.LOCAL)
			.map(e => e.stream)
			.sort((a, b) => {
				return a.nickname < b.nickname ? -1 : 1;
			});

		let external = this.mStreams
			.filter(e => e.type === CheckerType.EXTERNAL)
			.map(e => e.stream)
			.sort((a, b) => {
				if (a.platform < b.platform) return -1;
				if (a.platform > b.platform) return 1;
				return a.keyid < b.keyid ? -1 : 1;
			});

		return {
			local,
			external
		};
	}
}

type CheckerEntry = {
	type: CheckerType,
	stream: StreamInfo,
	sensitivity: number
}

enum CheckerType {
	LOCAL = 'local',
	EXTERNAL = 'external'
}