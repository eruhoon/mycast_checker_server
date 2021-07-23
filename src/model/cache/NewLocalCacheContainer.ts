import Axios from 'axios';
import * as dotenv from 'dotenv';
import { Logger } from '../common/logger/Logger';

import { RawTotoroStream } from '../RawTotoroModel';
import { StreamCacheContainer } from './StreamCacheContainer';

export class NewLocalCacheContainer extends StreamCacheContainer {
  static readonly #URL: string = 'http://mycast.xyz:1985/api/v1/streams/';

  #logger = new Logger('NewLocalCacheContainer');
  #caches: RawTotoroStream[];

  constructor() {
    super();
    dotenv.config();
    this.#caches = [];
  }

  getCaches(): RawTotoroStream[] {
    return this.#caches;
  }

  async update(): Promise<void> {
    const json = await NewLocalCacheContainer.#getTotoroJson();
    const newCaches = NewLocalCacheContainer.#parseRaw(json);
    this.#caches = newCaches;
  }

  static async #getTotoroJson(): Promise<any> {
    const json = await Axios.get(NewLocalCacheContainer.#URL);
    return json.data;
  }

  static #parseRaw(rawJson: { streams: RawTotoroStream[] }): RawTotoroStream[] {
    try {
      const rawClients: RawTotoroStream[] = rawJson.streams.filter((c) => {
        return c.publish.active === true && c.app === 'live';
      });
      const clients: RawTotoroStream[] = [];
      rawClients.forEach((rawClient) => {
        if (!clients.some((client) => rawClient.name === client.name)) {
          clients.push(rawClient);
        }
      });
      return clients;
    } catch (exception) {
      console.error(`NewLocalCacheContainer#parseRaw: Exception: ${exception}`);
      return [];
    }
  }
}
