import * as dotenv from 'dotenv';
import { TwitchStreamDto } from '../../api/twitch/TwitchStreamDto';
import { TwitchUserDto } from '../../api/twitch/TwitchUserDto';
import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { StreamPlatform } from '../../model/Stream';
import { TwitchStreamCache } from '../../model/TwitchStreamCache';
import { TwitchManager } from '../twitch/TwitchManager';
import { StreamCacheContainer } from './StreamCacheContainer';

export class TwitchCacheContainer extends StreamCacheContainer {
  private mCaches: TwitchStreamCache[];
  private mNewCaches: TwitchStreamCache[];
  private mTwitchManager: TwitchManager;
  private mUserLoader: IUserAsyncLoader;
  private mStreamLoader: IStreamAsyncLoader;

  public constructor(
    userLoader: IUserAsyncLoader,
    streamloader: IStreamAsyncLoader
  ) {
    super();
    dotenv.config();
    this.mCaches = [];
    this.mTwitchManager = new TwitchManager(
      process.env.TWITCH_CLIENT_ID,
      process.env.TWITCH_SECRET
    );
    this.mUserLoader = userLoader;
    this.mStreamLoader = streamloader;
  }

  public async update() {
    console.time('TwitchCacheContainer#update');

    if (this.mUserLoader === null || this.mStreamLoader === null) {
      console.error('TwitchCacheContainer#update: no loader');
    } else {
      const keywordsFromUser: string[] = (await this.mUserLoader.getUsers())
        .filter((u) => u.getStreamPlatform() === StreamPlatform.TWITCH)
        .map((u) => u.getStreamKeyId());

      const keywordsFromStream: string[] = (
        await this.mStreamLoader.getStreams()
      )
        .filter((stream) => stream.platform === StreamPlatform.TWITCH)
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

      this.applyKeywords(keywords);
      const userData = await this.mTwitchManager.loadUser(keywords);
      this.applyUserInfos(userData);
      const streams = await this.mTwitchManager.loadStream(
        userData.map((u) => u.login)
      );
      this.applyStreamInfos(streams);
      this.mCaches = this.mNewCaches;

      const total = this.mCaches.length;
      const onair = this.mCaches.filter((cache) => cache.stream != null).length;
      console.log(`TwitchCacheContainer#update: ${onair}/${total}`);
    }
    console.timeEnd('TwitchCacheContainer#update');
  }

  public getCache(keyword: string): TwitchStreamCache | null {
    const cache = this.mCaches.find((cache) => cache.keyword === keyword);
    if (!cache) {
      return null;
    }
    return cache;
  }

  private applyKeywords(keywords: string[]) {
    this.mNewCaches = keywords.map((keyword) => {
      return { keyword, user: null, stream: null };
    });
  }

  private applyUserInfos(users: TwitchUserDto[]) {
    users.forEach((user) => {
      const cache = this.mNewCaches.find(
        (cache) => user.login === cache.keyword
      );
      if (cache) {
        cache.user = user;
      }
    });
  }

  private applyStreamInfos(streams: TwitchStreamDto[]) {
    streams.forEach((stream) => {
      const cache = this.mNewCaches.find((cache) => {
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
