import Axios from 'axios';
import { Logger } from '../../model/common/logger/Logger';
import { TwitchUserDto } from './TwitchUserDto';

export class TwitchUserLoader {
  readonly #logger: Logger;
  readonly #clientId: string;

  constructor(clientId: string) {
    this.#logger = new Logger('TwitchUserLoader');
    this.#clientId = clientId;
  }

  async load(loginIds: string[], token: string): Promise<TwitchUserDto[]> {
    const host = 'https://api.twitch.tv/helix/users';
    const query = loginIds.map((k) => `login=${k}`).join('&');
    const url = `${host}?${query}`;
    try {
      const { data } = await Axios.get(url, {
        timeout: 5000,
        headers: {
          Authorization: `Bearer ${token}`,
          'Client-ID': this.#clientId,
        },
      });
      const users: TwitchUserDto[] = data.data;
      return users;
    } catch (e) {
      this.#logger.error(`loadUser: Request Error: ${e}`);
      return [];
    }
  }
}
