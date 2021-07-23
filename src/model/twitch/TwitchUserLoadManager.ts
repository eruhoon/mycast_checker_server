import { TwitchUserDto } from '../../api/twitch/TwitchUserDto';
import { TwitchUserLoader } from '../../api/twitch/TwitchUserLoader';
import { ArrayUtils } from '../common/array/ArrayUtils';

export class TwitchUserLoadManager {
  private readonly CHUNK_SIZE = 100;
  private mLoader: TwitchUserLoader;

  public constructor(clientId: string) {
    this.mLoader = new TwitchUserLoader(clientId);
  }

  public async load(
    loginIds: string[],
    token: string
  ): Promise<TwitchUserDto[]> {
    const idChunks = ArrayUtils.chunk<string>(loginIds, this.CHUNK_SIZE);
    const length = idChunks.length;
    let twitchUsers: TwitchUserDto[] = [];
    for (let i = 0; i < length; i++) {
      const chunk = idChunks[i];
      const result = await this.mLoader.load(chunk, token);
      twitchUsers = twitchUsers.concat(result);
    }
    return twitchUsers;
  }
}
