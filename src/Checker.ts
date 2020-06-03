import { IStreamAsyncLoader } from './controller/IStreamAsyncLoader';
import { IUserAsyncLoader } from './controller/IUserAsyncLoader';
import { StreamRewardProvider } from './controller/StreamRewardProvider';
import { TotoroCacheContainer } from './model/cache/TotoroCacheContainer';
import { TwitchCacheContainer } from './model/cache/TwitchCacheContainer';
import { WowzaCacheContainer } from './model/cache/WowzaCacheContainer';
import { YoutubeCacheContainer } from './model/cache/YoutubeCacheContainer';
import { StreamInfo, StreamPlatform, StreamSet } from './model/Stream';
import { AfreecaLoader } from './streamloader/AfreecaLoader';
import { KakaoTvLoader } from './streamloader/KakaoTvLoader';
import { LocalStreamLoader } from './streamloader/LocalStreamLoader';
import { MixerLoader } from './streamloader/MixerLoader';
import { StreamLoader } from './streamloader/StreamLoader';
import { TotoroStreamLoader } from './streamloader/TotoroStreamLoader';
import { TwtichLoader } from './streamloader/TwitchLoader';
import { UserExternalDecorator } from './streamloader/UserExternalDecorator';
import { YoutubeLoader } from './streamloader/YoutubeLoader';

export class Checker {

    private static DEFAULT_SENSITIVITY: number = 3;

    private mUserLoader: IUserAsyncLoader;
    private mStreamLoader: IStreamAsyncLoader;

    private mWowzaCacheManager: WowzaCacheContainer;
    private mTotoroCacheManager: TotoroCacheContainer;
    private mTwitchCacheManager: TwitchCacheContainer;
    private mYoutubeCacheManager: YoutubeCacheContainer;

    private mStreams: CheckerEntry[] = [];

    public constructor(
        userLoader: IUserAsyncLoader, streamloader: IStreamAsyncLoader) {

        this.mUserLoader = userLoader;
        this.mStreamLoader = streamloader;

        this.mWowzaCacheManager = new WowzaCacheContainer();
        this.mTotoroCacheManager = new TotoroCacheContainer();
        this.mTwitchCacheManager =
            new TwitchCacheContainer(userLoader, streamloader);
        this.mYoutubeCacheManager =
            new YoutubeCacheContainer(userLoader, streamloader);

        this.initCacheManager();
    }

    public initCacheManager() {
        this.mWowzaCacheManager.start();
        this.mTotoroCacheManager.start();
        this.mTwitchCacheManager.start();
        this.mYoutubeCacheManager.start(60000);
    }

    public async update() {

        this.updateStream();

        const users = await this.mUserLoader.getUsers();
        users.forEach(user => {
            let loader: StreamLoader = null;
            const platform = user.getStreamPlatform();
            switch (platform) {
                case StreamPlatform.LOCAL:
                    loader = new LocalStreamLoader(
                        this.mWowzaCacheManager, user);
                    break;
                case StreamPlatform.TOTORO:
                    loader = new TotoroStreamLoader(
                        this.mTotoroCacheManager, user);
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
                    if (info.platform === StreamPlatform.LOCAL ||
                        info.platform === StreamPlatform.TOTORO) {
                        const provider = new StreamRewardProvider();
                        provider.requestStreamReward(user.getHash(), info.viewer);
                    }
                    this.addStream(CheckerType.LOCAL, info);
                });
            }
        });

        const streamRows = await this.mStreamLoader.getStreams();
        streamRows.forEach(row => {
            let loader: StreamLoader = null;
            const platform = row.platform;
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
                    if (!info || !info.result) { return; }
                    if (!info.onair) { return; }
                    this.addStream(CheckerType.EXTERNAL, info);
                });
            }
        });
    }

    public getStreams(): StreamSet {

        const local = this.mStreams
            .filter(e => e.type === CheckerType.LOCAL)
            .map(e => e.stream)
            .sort((a, b) => {
                return a.nickname < b.nickname ? -1 : 1;
            });

        const external = this.mStreams
            .filter(e => e.type === CheckerType.EXTERNAL)
            .map(e => e.stream)
            .sort((a, b) => {
                if (a.platform < b.platform) { return -1; }
                if (a.platform > b.platform) { return 1; }
                return a.keyid < b.keyid ? -1 : 1;
            });

        return {
            local,
            external,
        };
    }

    private updateStream() {

        this.mStreams = this.mStreams.filter((info: CheckerEntry) => {
            info.sensitivity--;
            return info.sensitivity > 0;
        });
    }

    private addStream(type: CheckerType, info: StreamInfo) {
        const checkerEntry: CheckerEntry = {
            type,
            stream: info,
            sensitivity: Checker.DEFAULT_SENSITIVITY,
        };

        let isUpdate = false;
        this.mStreams = this.mStreams.map(entry => {
            const keyId = entry.stream.keyid;
            const platform = entry.stream.platform;
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
}

type CheckerEntry = {
    type: CheckerType,
    stream: StreamInfo,
    sensitivity: number,
};

enum CheckerType {
    LOCAL = 'local',
    EXTERNAL = 'external',
}
