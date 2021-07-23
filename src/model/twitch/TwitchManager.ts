import { TwitchStreamDto } from '../../api/twitch/TwitchStreamDto';
import { TwitchUserDto } from '../../api/twitch/TwitchUserDto';
import { Logger } from '../common/logger/Logger';
import { TwitchStreamLoadManager } from './TwitchStreamLoadManager';
import { TwitchTokenManager } from './TwitchTokenManager';
import { TwitchUserLoadManager } from './TwitchUserLoadManager';

export class TwitchManager {
  private mLogger: Logger;
  private mTokenManager: TwitchTokenManager;
  private mUserLoader: TwitchUserLoadManager;
  private mStreamLoader: TwitchStreamLoadManager;

  constructor(clientId: string, secretKey: string) {
    this.mLogger = new Logger('TwitchManager');
    this.mTokenManager = new TwitchTokenManager(clientId, secretKey);
    this.mUserLoader = new TwitchUserLoadManager(clientId);
    this.mStreamLoader = new TwitchStreamLoadManager(clientId);
  }

  async getToken(): Promise<string | null> {
    return await this.mTokenManager.getToken();
  }

  async loadUser(loginIds: string[]): Promise<TwitchUserDto[]> {
    const token = await this.getToken();
    if (!token) {
      this.mLogger.error('Invalid accessToken');
      return [];
    }
    return await this.mUserLoader.load(loginIds, token);
  }

  async loadStream(keywords: string[]): Promise<TwitchStreamDto[]> {
    const token = await this.getToken();
    if (!token) {
      this.mLogger.error('Invalid accessToken');
      return [];
    }
    return await this.mStreamLoader.load(keywords, token);
  }
}
