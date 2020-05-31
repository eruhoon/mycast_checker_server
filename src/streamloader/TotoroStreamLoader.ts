import { TotoroCacheContainer } from '../model/cache/TotoroCacheContainer';
import { StreamInfo, StreamPlatform } from '../model/Stream';
import { User } from '../model/User';
import { StreamLoader, StreamLoaderCallback } from './StreamLoader';

export class TotoroStreamLoader extends StreamLoader {

    public mManager: TotoroCacheContainer;
    public mUser: User;

    public constructor(manager: TotoroCacheContainer, user: User) {
        super();
        this.mManager = manager;
        this.mUser = user;
    }

    public requestInfo(callback: StreamLoaderCallback): void {

        let caches = this.mManager.getCaches();
        let streamKey = this.mUser.getStreamKey();

        let cache = caches.find(cache => cache.name === streamKey);
        if (cache) {
            let nickname = this.mUser.getNickname();
            let info: StreamInfo = {
                result: true,
                platform: StreamPlatform.TOTORO,
                keyid: streamKey,
                icon: this.mUser.getIcon(),
                nickname: this.mUser.getNickname(),
                thumbnail: this.mUser.getBackground(),
                onair: true,
                title: nickname,
                description: `${nickname}의 방송 [이웃채널]`,
                url: `https://mycast.xyz/player/totoro/${streamKey}`,
                viewer: cache.clients
            }
            callback(info);
        }
    }

}
