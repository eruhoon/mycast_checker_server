import Axios from 'axios';
import * as qs from 'querystring';
import { Logger } from '../../model/common/logger/Logger';

export class TwitchTokenLoader {
  private mLogger: Logger;
  private readonly mClientId: string;
  private readonly mSecretKey: string;

  public constructor(clientId: string, secretKey: string) {
    this.mLogger = new Logger('TwitchTokenLoader');
    this.mClientId = clientId;
    this.mSecretKey = secretKey;
  }

  public async load(): Promise<string | null> {
    const host = 'https://id.twitch.tv/oauth2/token';
    const query = qs.stringify({
      client_id: this.mClientId,
      client_secret: this.mSecretKey,
      grant_type: 'client_credentials',
      scope: 'user:read:email',
    });
    const url = `${host}?${query}`;
    try {
      const res = await Axios.post(url);
      return res.data.access_token;
    } catch (e) {
      this.mLogger.error(`getAccessToken: error: ${e}`);
      return null;
    }
  }
}
