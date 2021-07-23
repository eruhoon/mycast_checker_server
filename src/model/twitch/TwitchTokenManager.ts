import { TwitchTokenLoader } from '../../api/twitch/TwitchTokenLoader';

export class TwitchTokenManager {
  private readonly EXPIRES_TIME = 5 * 60 * 1000;
  private mExpires: number;
  private mTokenCache: string | null = null;
  private mLoader: TwitchTokenLoader;

  constructor(clientId: string, secretKey: string) {
    this.mExpires = 0;
    this.mLoader = new TwitchTokenLoader(clientId, secretKey);
  }

  async getToken(): Promise<string | null> {
    const now = new Date().getTime();
    if (this.isExpired(now) || this.mTokenCache === null) {
      this.mTokenCache = await this.mLoader.load();
      this.mExpires = now;
    }
    return this.mTokenCache;
  }

  private isExpired(now: number): boolean {
    return now > this.mExpires + this.EXPIRES_TIME;
  }
}
