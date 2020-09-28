import { TwitchStreamDto } from '../../api/twitch/TwitchStreamDto';
import { TwitchStreamLoader } from '../../api/twitch/TwitchStreamLoader';
import { ArrayUtils } from '../common/array/ArrayUtils';

export class TwitchStreamLoadManager {
    private mLoader: TwitchStreamLoader;

    public constructor(clientId: string) {
        this.mLoader = new TwitchStreamLoader(clientId);
    }

    public async load(
        keywords: string[],
        token: string
    ): Promise<TwitchStreamDto[]> {
        const keywordChunks = ArrayUtils.chunk<string>(keywords, 100);
        const length = keywordChunks.length;
        let streams: TwitchStreamDto[] = [];
        for (let i = 0; i < length; i++) {
            const chunk = keywordChunks[i];
            const result = await this.mLoader.load(chunk, token);
            streams = streams.concat(result);
        }
        streams.forEach((s) => {
            const format = s.thumbnail_url;
            s.thumbnail_url = this.decorateThumbnail(format, 200, 150);
        });
        return streams;
    }

    private decorateThumbnail(
        format: string,
        width: number,
        height: number
    ): string {
        let result = format
            .replace('{width}', width.toString())
            .replace('{height}', height.toString());
        result += '?' + new Date().getTime();
        return result;
    }
}
