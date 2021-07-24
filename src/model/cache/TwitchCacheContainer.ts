import * as dotenv from 'dotenv';
import { TwitchStreamDto } from '../../api/twitch/TwitchStreamDto';
import { TwitchUserDto } from '../../api/twitch/TwitchUserDto';
import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { StreamPlatform } from '../../model/Stream';
import { TwitchStreamCache } from '../../model/TwitchStreamCache';
import { Logger } from '../common/logger/Logger';
import { TwitchManager } from '../twitch/TwitchManager';
import { StreamCacheContainer } from './StreamCacheContainer';

const Log = new Logger('TwitchCacheContainer');

export class TwitchCacheContainer extends StreamCacheContainer {
  #caches: TwitchStreamCache[] = [];
  #newCaches: TwitchStreamCache[] = [];
  #twitchManager: TwitchManager;
  #userLoader: IUserAsyncLoader;
  #streamLoader: IStreamAsyncLoader;

  constructor(userLoader: IUserAsyncLoader, streamloader: IStreamAsyncLoader) {
    super();
    dotenv.config();
    const clientId = process.env.TWITCH_CLIENT_ID;
    const secret = process.env.TWITCH_SECRET;
    if (!clientId || !secret) {
      throw new Error('client, secret has not set');
    }
    this.#twitchManager = new TwitchManager(clientId, secret);
    this.#userLoader = userLoader;
    this.#streamLoader = streamloader;
  }

  async update() {
    const keywordsFromUser = await this.#getKeywordFromUser();
    const keywordsFromStream = await this.#getKeywordsFromStream();

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

    this.#applyKeywords(keywords);
    const userData = await this.#twitchManager.loadUser(keywords);
    this.#applyUserInfos(userData);
    const streams = await this.#twitchManager.loadStream(
      userData.map((u) => u.login)
    );
    this.#applyStreamInfos(streams);
    this.#caches = this.#newCaches;

    const total = this.#caches.length;
    const onair = this.#caches.filter((cache) => cache.stream != null).length;
    Log.log(`update: ${onair}/${total}`);
  }

  getCache(keyword: string): TwitchStreamCache | null {
    const cache = this.#caches.find((cache) => cache.keyword === keyword);
    if (!cache) {
      return null;
    }
    return cache;
  }

  async #getKeywordFromUser(): Promise<string[]> {
    const users = await this.#userLoader.getUsers();
    const keywords: string[] = users
      .filter((u) => u.getStreamPlatform() === StreamPlatform.TWITCH)
      .map((u) => u.getStreamKeyId());
    return keywords;
  }

  async #getKeywordsFromStream(): Promise<string[]> {
    const streams = await this.#streamLoader.getStreams();
    const keywords: string[] = streams
      .filter((stream) => stream.platform === StreamPlatform.TWITCH)
      .map((stream) => stream.keyword);
    return keywords;
  }

  #applyKeywords(keywords: string[]) {
    this.#newCaches = keywords.map((keyword) => {
      return { keyword, user: null, stream: null };
    });
  }

  #applyUserInfos(users: TwitchUserDto[]) {
    users.forEach((user) => {
      const cache = this.#newCaches.find(
        (cache) => user.login === cache.keyword
      );
      if (cache) {
        cache.user = user;
      }
    });
  }

  #applyStreamInfos(streams: TwitchStreamDto[]) {
    streams.forEach((stream) => {
      const cache = this.#newCaches.find((cache) => {
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
