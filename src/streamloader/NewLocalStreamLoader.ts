import { NewLocalCacheContainer } from '../model/cache/NewLocalCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { StreamLoader, StreamLoaderCallback } from './StreamLoader';

export class NewLocalStreamLoader extends StreamLoader {

    public mManager: NewLocalCacheContainer;
    public mUser: User;

    public constructor(manager: NewLocalCacheContainer, user: User) {
        super();
        this.mManager = manager;
        this.mUser = user;
    }

    public requestInfo(callback: StreamLoaderCallback): void {

        const caches = this.mManager.getCaches();
        const streamKey = this.mUser.getStreamKeyId();

        const cache = caches.find(cache => cache.name === streamKey);
        if (cache) {
            const nickname = this.mUser.getNickname();
            const info: StreamInfo = {
                result: true,
                platform: StreamPlatform.LOCAL,
                keyid: streamKey,
                icon: this.mUser.getIcon(),
                nickname: this.mUser.getNickname(),
                thumbnail: this.mUser.getBackground(),
                onair: true,
                title: nickname,
                description: `${nickname}의 방송 [공용채널]`,
                url: `https://mycast.xyz/player/${streamKey}`,
                viewer: cache.clients,
            };
            callback(info);
        }
    }

}
