import { YoutubeCacheContainer } from '../model/cache/YoutubeCacheContainer';
import { StreamLoader, StreamLoaderCallback } from './StreamLoader';

export class YoutubeLoader extends StreamLoader {
    private mManager: YoutubeCacheContainer;
    private mChannelId: string;

    public constructor(manager: YoutubeCacheContainer, channelId: string) {
        super();
        this.mManager = manager;
        this.mChannelId = channelId;
    }

    public requestInfo(callback: StreamLoaderCallback): void {
        const cache = this.mManager.getCache(this.mChannelId);
        if (cache === null) {
            return;
        }
        callback(cache);
    }
}
