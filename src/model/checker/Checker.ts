import { VegaChatApi } from '../../api/vegachat/VegaChatApi';
import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { StreamRewardProvider } from '../../controller/StreamRewardProvider';
import { AfreecaLoader } from '../../streamloader/AfreecaLoader';
import { ChzzkLoader } from '../../streamloader/ChzzkLoader';
import { KakaoTvLoader } from '../../streamloader/KakaoTvLoader';
import { NewLocalStreamLoader } from '../../streamloader/NewLocalStreamLoader';
import { StreamLoader } from '../../streamloader/StreamLoader';
import { TotoroStreamLoader } from '../../streamloader/TotoroStreamLoader';
import { TwtichLoader } from '../../streamloader/TwitchLoader';
import { UserExternalDecorator } from '../../streamloader/UserExternalDecorator';
import { YoutubeHandleLoader } from '../../streamloader/YoutubeHandleLoader';
import { YoutubeVideoLoader } from '../../streamloader/YoutubeVideoLoader';
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
  #chatApi: VegaChatApi = new VegaChatApi();

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
  }

  async update() {
    this.#updateStream();

    const users = await this.#userLoader.getUsers();
    const connectedUsers = await this.#chatApi.getCurrentUsers();
    const filtered = users.filter((user) =>
      connectedUsers.find((conn) => conn.hash === user.getHash())
    );

    filtered.forEach((user) => {
      let loaders: StreamLoader[] = [];
      const platform = user.getStreamPlatform();
      if (platform === StreamPlatform.TWITCH) {
        return;
      }
      switch (platform) {
        case StreamPlatform.LOCAL:
          loaders = [
            new NewLocalStreamLoader(this.#newLocalCacheManager, user),
          ];
          break;
        case StreamPlatform.TOTORO:
          loaders = [new TotoroStreamLoader(this.#totoroCacheManager, user)];
          break;
        case StreamPlatform.AFREECA:
          loaders = [
            new UserExternalDecorator(
              user,
              new AfreecaLoader(user.getStreamKeyId())
            ),
          ];
          break;
        // case StreamPlatform.TWITCH:
        //   loaders = [
        //     new UserExternalDecorator(
        //       user,
        //       new TwtichLoader(this.#twitchCacheManager, user.getStreamKeyId())
        //     ),
        //   ];
        //   break;
        case StreamPlatform.CHZZK:
          loaders = [
            new UserExternalDecorator(
              user,
              new ChzzkLoader(user.getStreamKeyId())
            ),
          ];
          break;
        case StreamPlatform.YOUTUBE:
          loaders = [
            new UserExternalDecorator(
              user,
              new YoutubeHandleLoader(
                this.#youtubeCacheManager,
                user.youtubeHandle
              )
            ),
            new UserExternalDecorator(
              user,
              new YoutubeVideoLoader(user.youtubeVideoId)
            ),
          ];
          break;
      }
      loaders.forEach((loader) => {
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
      });
    });

    const streamRows = await this.#streamLoader.getStreams();
    streamRows.forEach((row) => {
      let loader: StreamLoader | null = null;
      const platform = row.platform;
      if (platform === StreamPlatform.TWITCH) {
        return;
      }
      switch (platform) {
        case StreamPlatform.AFREECA:
          loader = new AfreecaLoader(row.keyword);
          break;
        // case StreamPlatform.TWITCH:
        //   loader = new TwtichLoader(this.#twitchCacheManager, row.keyword);
        //   break;
        case StreamPlatform.KAKAOTV:
          loader = new KakaoTvLoader(row.keyword);
          break;
        case StreamPlatform.YOUTUBE:
          loader = new YoutubeHandleLoader(
            this.#youtubeCacheManager,
            row.keyword
          );
          break;
        case StreamPlatform.CHZZK:
          loader = new ChzzkLoader(row.keyword);
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
