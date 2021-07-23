import Axios from 'axios';
import * as qs from 'querystring';
import { Logger } from '../../model/common/logger/Logger';

export class TwitchTokenLoader {
  readonly #logger: Logger;
  readonly #clientId: string;
  readonly #secretKey: string;

  constructor(clientId: string, secretKey: string) {
    this.#logger = new Logger('TwitchTokenLoader');
    this.#clientId = clientId;
    this.#secretKey = secretKey;
  }

  async load(): Promise<string | null> {
    const host = 'https://id.twitch.tv/oauth2/token';
    const query = qs.stringify({
      client_id: this.#clientId,
      client_secret: this.#secretKey,
      grant_type: 'client_credentials',
      scope: 'user:read:email',
    });
    const url = `${host}?${query}`;
    try {
      const res = await Axios.post(url);
      return res.data.access_token;
    } catch (e) {
      this.#logger.error(`getAccessToken: error: ${e}`);
      return null;
    }
  }
}
