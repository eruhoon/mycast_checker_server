import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { StreamRewardProvider } from '../../controller/StreamRewardProvider';
import { AfreecaLoader } from '../../streamloader/AfreecaLoader';
import { KakaoTvLoader } from '../../streamloader/KakaoTvLoader';
import { LckClNaverLoader } from '../../streamloader/lck/LckClNaverLoader';
import { LckNaverLoader } from '../../streamloader/lck/LckNaverLoader';
import { NewLocalStreamLoader } from '../../streamloader/NewLocalStreamLoader';
import { StreamLoader } from '../../streamloader/StreamLoader';
import { TotoroStreamLoader } from '../../streamloader/TotoroStreamLoader';
import { TwtichLoader } from '../../streamloader/TwitchLoader';
import { UserExternalDecorator } from '../../streamloader/UserExternalDecorator';
import { YoutubeLoader } from '../../streamloader/YoutubeLoader';
import { NewLocalCacheContainer } from '../cache/LocalCacheContainer';
import { TotoroCacheContainer } from '../cache/TotoroCacheContainer';
import { TwitchCacheContainer } from '../cache/TwitchCacheContainer';
import { YoutubeCacheContainer } from '../cache/YoutubeCacheContainer';
import { StreamInfo, StreamPlatform, StreamSet } from '../Stream';
import { CheckerType } from './CheckerEntry';
import {
  CheckerEntryContainer,
  OnStreamAddCallback,
} from './CheckerEntryContainer';

export class Checker {
  #userLoader: IUserAsyncLoader;
  #streamLoader: IStreamAsyncLoader;

  #lckLoader = new LckNaverLoader();
  #lckClLoader = new LckClNaverLoader();

  #newLocalCacheManager: NewLocalCacheContainer;
  #totoroCacheManager: TotoroCacheContainer;
  #twitchCacheManager: TwitchCacheContainer;
  #youtubeCacheManager: YoutubeCacheContainer;

  #container: CheckerEntryContainer;

  constructor(userLoader: IUserAsyncLoader, streamloader: IStreamAsyncLoader) {
    this.#userLoader = userLoader;
    this.#streamLoader = streamloader;

    this.#newLocalCacheManager = new NewLocalCacheContainer();
    this.#totoroCacheManager = new TotoroCacheContainer();
    this.#twitchCacheManager = new TwitchCacheContainer(
      userLoader,
      streamloader
    );
    this.#youtubeCacheManager = new YoutubeCacheContainer();

    this.#container = new CheckerEntryContainer();

    this.initCacheManager();
  }

  setOnStreamAddCallback(callback: OnStreamAddCallback): void {
    this.#container.setOnStreamAddCallback(callback);
  }

  initCacheManager() {
    this.#newLocalCacheManager.start();
    this.#totoroCacheManager.start();
    this.#twitchCacheManager.start();
    this.#youtubeCacheManager.start(60000);
  }

  async update() {
    this.#updateStream();

    const users = await this.#userLoader.getUsers();
    users.forEach((user) => {
      let loader: StreamLoader | null = null;
      const platform = user.getStreamPlatform();
      switch (platform) {
        case StreamPlatform.LOCAL:
          loader = new NewLocalStreamLoader(this.#newLocalCacheManager, user);
          break;
        case StreamPlatform.TOTORO:
          loader = new TotoroStreamLoader(this.#totoroCacheManager, user);
          break;
        case StreamPlatform.AFREECA:
          loader = new AfreecaLoader(user.getStreamKeyId());
          loader = new UserExternalDecorator(user, loader);
          break;
        case StreamPlatform.TWITCH:
          loader = new TwtichLoader(
            this.#twitchCacheManager,
            user.getStreamKeyId()
          );
          loader = new UserExternalDecorator(user, loader);
          break;
      }

      if (loader !== null) {
        loader.getInfo().then((info) => {
          if (!info) {
            return;
          }
          if (
            info.platform === StreamPlatform.LOCAL ||
            info.platform === StreamPlatform.TOTORO
          ) {
            const provider = new StreamRewardProvider();
            provider.requestStreamReward(user.getHash(), info.viewer);
          }
          this.#addStream(CheckerType.LOCAL, info);
        });
      }
    });

    const streamRows = await this.#streamLoader.getStreams();
    streamRows.forEach((row) => {
      let loader: StreamLoader | null = null;
      const platform = row.platform;
      switch (platform) {
        case StreamPlatform.AFREECA:
          loader = new AfreecaLoader(row.keyword);
          break;
        case StreamPlatform.TWITCH:
          loader = new TwtichLoader(this.#twitchCacheManager, row.keyword);
          break;
        case StreamPlatform.KAKAOTV:
          loader = new KakaoTvLoader(row.keyword);
          break;
        case StreamPlatform.YOUTUBE:
          // loader = new YoutubeLoader(row.keyword);
          loader = new YoutubeLoader(this.#youtubeCacheManager, row.keyword);
          break;
      }

      if (loader !== null) {
        loader.getInfo().then((info) => {
          if (!info || !info.result) {
            return;
          }
          if (!info.onair) {
            return;
          }
          this.#addStream(CheckerType.EXTERNAL, info);
        });
      }
    });

    const lckInfo = await this.#lckLoader.getInfo();
    if (lckInfo) {
      this.#addStream(CheckerType.EXTERNAL, lckInfo);
    }

    const lckClInfo = await this.#lckClLoader.getInfo();
    if (lckClInfo) {
      this.#addStream(CheckerType.EXTERNAL, lckClInfo);
    }
  }

  getStreams(): StreamSet {
    const entries = this.#container.getEntries();
    const local = entries
      .filter((e) => e.getType() === CheckerType.LOCAL)
      .map((e) => e.getStream())
      .sort((a, b) => {
        return a.nickname < b.nickname ? -1 : 1;
      });

    const external = entries
      .filter((e) => e.getType() === CheckerType.EXTERNAL)
      .map((e) => e.getStream())
      .sort((a, b) => {
        if (a.platform < b.platform) {
          return -1;
        }
        if (a.platform > b.platform) {
          return 1;
        }
        return a.keyid < b.keyid ? -1 : 1;
      });

    return {
      local,
      external,
    };
  }

  #updateStream() {
    this.#container.stale();
  }

  #addStream(type: CheckerType, info: StreamInfo) {
    this.#container.upsertStream(type, info);
  }
}
