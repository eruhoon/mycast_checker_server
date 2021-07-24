import Axios from 'axios';
import { Logger } from '../../model/common/logger/Logger';
import { TwitchStreamDto } from './TwitchStreamDto';

export class TwitchStreamLoader {
  readonly #logger: Logger;
  readonly #clientId: string;

  constructor(clientId: string) {
    this.#logger = new Logger('TwitchStreamLoader');
    this.#clientId = clientId;
  }

  async load(keywords: string[], token: string): Promise<TwitchStreamDto[]> {
    const userQuery = keywords.map((k) => `user_login=${k}`).join('&');
    const query = `${userQuery}&first=100`;
    const host = 'https://api.twitch.tv/helix/streams';
    const url = `${host}?${query}`;
    const headers = {
      Authorization: `Bearer ${token}`,
      'Client-ID': this.#clientId,
    };
    try {
      const { data } = await Axios.get(url, { timeout: 5000, headers });
      const streams: TwitchStreamDto[] = data.data;
      return streams;
    } catch (e) {
      this.#logger.error(`loadStream: Request Error: ${e}`);
      return [];
    }
  }
}
