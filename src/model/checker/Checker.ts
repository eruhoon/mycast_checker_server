import { IStreamAsyncLoader } from '../../controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from '../../controller/IUserAsyncLoader';
import { StreamRewardProvider } from '../../controller/StreamRewardProvider';
import { AfreecaLoader } from '../../streamloader/AfreecaLoader';
import { KakaoTvLoader } from '../../streamloader/KakaoTvLoader';
import { MixerLoader } from '../../streamloader/MixerLoader';
import { NewLocalStreamLoader } from '../../streamloader/NewLocalStreamLoader';
import { StreamLoader } from '../../streamloader/StreamLoader';
import { TotoroStreamLoader } from '../../streamloader/TotoroStreamLoader';
import { TwtichLoader } from '../../streamloader/TwitchLoader';
import { UserExternalDecorator } from '../../streamloader/UserExternalDecorator';
import { YoutubeLoader } from '../../streamloader/YoutubeLoader';
import { NewLocalCacheContainer } from '../cache/NewLocalCacheContainer';
import { TotoroCacheContainer } from '../cache/TotoroCacheContainer';
import { TwitchCacheContainer } from '../cache/TwitchCacheContainer';
import { WowzaCacheContainer } from '../cache/WowzaCacheContainer';
import { YoutubeCacheContainer } from '../cache/YoutubeCacheContainer';
import { Logger } from '../common/logger/Logger';
import { StreamInfo, StreamPlatform, StreamSet } from '../Stream';
import { CheckerType } from './CheckerEntry';
import {
    CheckerEntryContainer,
    OnStreamAddCallback,
} from './CheckerEntryContainer';

export class Checker {
    private mLogger: Logger = new Logger('Checker');
    private mUserLoader: IUserAsyncLoader;
    private mStreamLoader: IStreamAsyncLoader;

    private mWowzaCacheManager: WowzaCacheContainer;
    private mNewLocalCacheManager: NewLocalCacheContainer;
    private mTotoroCacheManager: TotoroCacheContainer;
    private mTwitchCacheManager: TwitchCacheContainer;
    private mYoutubeCacheManager: YoutubeCacheContainer;

    private mContainer: CheckerEntryContainer;

    public constructor(
        userLoader: IUserAsyncLoader,
        streamloader: IStreamAsyncLoader
    ) {
        this.mUserLoader = userLoader;
        this.mStreamLoader = streamloader;

        this.mWowzaCacheManager = new WowzaCacheContainer();
        this.mNewLocalCacheManager = new NewLocalCacheContainer();
        this.mTotoroCacheManager = new TotoroCacheContainer();
        this.mTwitchCacheManager = new TwitchCacheContainer(
            userLoader,
            streamloader
        );
        this.mYoutubeCacheManager = new YoutubeCacheContainer(
            userLoader,
            streamloader
        );

        this.mContainer = new CheckerEntryContainer();

        this.initCacheManager();
    }

    public setOnStreamAddCallback(callback: OnStreamAddCallback): void {
        this.mContainer.setOnStreamAddCallback(callback);
    }

    public initCacheManager() {
        this.mWowzaCacheManager.start();
        this.mNewLocalCacheManager.start();
        this.mTotoroCacheManager.start();
        this.mTwitchCacheManager.start();
        this.mYoutubeCacheManager.start(60000);
    }

    public async update() {
        this.updateStream();

        const users = await this.mUserLoader.getUsers();
        users.forEach((user) => {
            let loader: StreamLoader = null;
            const platform = user.getStreamPlatform();
            switch (platform) {
                case StreamPlatform.LOCAL:
                    loader = new NewLocalStreamLoader(
                        this.mNewLocalCacheManager,
                        user
                    );
                    break;
                case StreamPlatform.TOTORO:
                    loader = new TotoroStreamLoader(
                        this.mTotoroCacheManager,
                        user
                    );
                    break;
                case StreamPlatform.AFREECA:
                    loader = new AfreecaLoader(user.getStreamKeyId());
                    loader = new UserExternalDecorator(user, loader);
                    break;
                case StreamPlatform.TWITCH:
                    loader = new TwtichLoader(
                        this.mTwitchCacheManager,
                        user.getStreamKeyId()
                    );
                    loader = new UserExternalDecorator(user, loader);
                    break;
                case StreamPlatform.MIXER:
                    loader = new MixerLoader(user.getStreamKeyId());
                    loader = new UserExternalDecorator(user, loader);
                    break;
            }

            if (loader !== null) {
                loader.requestInfo((info) => {
                    if (
                        info.platform === StreamPlatform.LOCAL ||
                        info.platform === StreamPlatform.TOTORO
                    ) {
                        const provider = new StreamRewardProvider();
                        provider.requestStreamReward(
                            user.getHash(),
                            info.viewer
                        );
                    }
                    this.addStream(CheckerType.LOCAL, info);
                });
            }
        });

        const streamRows = await this.mStreamLoader.getStreams();
        streamRows.forEach((row) => {
            let loader: StreamLoader = null;
            const platform = row.platform;
            switch (platform) {
                case StreamPlatform.AFREECA:
                    loader = new AfreecaLoader(row.keyword);
                    break;
                case StreamPlatform.TWITCH:
                    loader = new TwtichLoader(
                        this.mTwitchCacheManager,
                        row.keyword
                    );
                    break;
                case StreamPlatform.KAKAOTV:
                    loader = new KakaoTvLoader(row.keyword);
                    break;
                case StreamPlatform.MIXER:
                    loader = new MixerLoader(row.keyword);
                    break;
                case StreamPlatform.YOUTUBE:
                    loader = new YoutubeLoader(
                        this.mYoutubeCacheManager,
                        row.keyword
                    );
                    break;
            }

            if (loader !== null) {
                loader.requestInfo((info) => {
                    if (!info || !info.result) {
                        return;
                    }
                    if (!info.onair) {
                        return;
                    }
                    this.addStream(CheckerType.EXTERNAL, info);
                });
            }
        });
    }

    public getStreams(): StreamSet {
        const entries = this.mContainer.getEntries();
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

    private updateStream() {
        this.mContainer.stale();
    }

    private addStream(type: CheckerType, info: StreamInfo) {
        this.mContainer.upsertStream(type, info);
    }
}
