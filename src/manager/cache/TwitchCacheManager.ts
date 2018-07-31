import * as dotenv from 'dotenv';

import { StreamPlatform } from '../../model/Stream';
import { DatabaseManager } from '../DatabaseManager';
import { TwitchUtils, RawTwitchUser, RawTwitchStream } from '../../utils/TwitchUtils';
import { TwitchStreamCache } from '../../model/TwitchStreamCache';
import { StreamCacheManager } from './StreamCacheManager';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';

export class TwitchCacheManager extends StreamCacheManager {

	private static sInstance: TwitchCacheManager | null = null;

	public static getInstance(): TwitchCacheManager {
		if (this.sInstance === null) {
			this.sInstance = new TwitchCacheManager();
		}
		return this.sInstance;
	}

	private mCaches: TwitchStreamCache[];
	private mNewCaches: TwitchStreamCache[];
	private mUserLoader: IUserAsyncLoader | null = null;
	private mStreamLoader: IStreamAsyncLoader | null = null;

	public constructor() {
		super();
		dotenv.config();
		this.mCaches = [];
	}

	public setUserLoader(loader: IUserAsyncLoader) {
		this.mUserLoader = loader;
	}

	public setStreamLoader(loader: IStreamAsyncLoader) {
		this.mStreamLoader = loader;
	}

	public async update() {
		console.time('TwitchCacheManager#update');

		if (this.mUserLoader === null || this.mStreamLoader === null) {
			console.error('TwitchCacheManager#update: no loader');
		} else {
			let databaseManager = DatabaseManager.getInstance();
			let keywordsFromUser: string[] = (await this.mUserLoader.getUsers())
				.filter(u => u.getStreamPlatform() === StreamPlatform.TWITCH)
				.map(u => u.getStreamKeyId());

			let keywordsFromStream: string[] = (await this.mStreamLoader.getStreams())
				.filter(stream => stream.platform === StreamPlatform.TWITCH)
				.map(stream => stream.keyword);

			let keywords: string[] = [];
			let addWithoutDuplicated = (keyword: string) => {
				if (!keyword) return;
				if (keywords.findIndex(k => k === keyword) !== -1) return;
				keywords.push(keyword);
			};
			keywordsFromUser.forEach(keyword => addWithoutDuplicated(keyword));
			keywordsFromStream.forEach(keyword => addWithoutDuplicated(keyword));

			this.applyKeywords(keywords);
			let userData = await TwitchUtils.loadUser(keywords);
			this.applyUserInfos(userData);
			let streams = await TwitchUtils.loadStream(userData.map(u => u.login));
			this.applyStreamInfos(streams);
			this.mCaches = this.mNewCaches;

			let total = this.mCaches.length;
			let onair = this.mCaches.filter(cache => cache.stream != null).length;
			console.log(`TwitchCacheManager#update: onair: ${onair}/${total}`);

		}
		console.timeEnd('TwitchCacheManager#update');
	}

	public getCache(keyword: string): TwitchStreamCache | null {
		let cache = this.mCaches.find(cache => cache.keyword === keyword);
		if (!cache) {
			return null;
		}
		return cache;
	}

	private applyKeywords(keywords: string[]) {
		this.mNewCaches = keywords.map(keyword => {
			return { keyword, user: null, stream: null };
		});
	}

	private applyUserInfos(users: RawTwitchUser[]) {
		users.forEach(user => {
			const cache = this.mNewCaches.find(
				cache => user.login === cache.keyword);
			if (cache) {
				cache.user = user;
			}
		});
	}

	private applyStreamInfos(streams: RawTwitchStream[]) {
		streams.forEach(stream => {
			const cache = this.mNewCaches.find(cache => {
				if (!cache.user) {
					return false;
				}
				return cache.user.id === stream.user_id;
			});
			if (cache) {
				cache.stream = stream;
			}
		});
	}

}