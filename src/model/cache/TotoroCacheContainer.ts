import Axios from 'axios';
import * as dotenv from 'dotenv';
import { Logger } from '../common/logger/Logger';

import { RawTotoroStream } from '../RawTotoroModel';
import { StreamCacheContainer } from './StreamCacheContainer';

const Log = new Logger('TotoroCacheContainer');

export class TotoroCacheContainer extends StreamCacheContainer {
  static readonly #URL: string = 'http://52.79.252.217:1985/api/v1/streams/';

  #caches: RawTotoroStream[] = [];

  constructor() {
    super();
    dotenv.config();
  }

  getCaches(): RawTotoroStream[] {
    return this.#caches;
  }

  async update(): Promise<void> {
    const json = await TotoroCacheContainer.#getTotoroJson();
    const newCaches = TotoroCacheContainer.#parseRaw(json);
    this.#caches = newCaches;
  }

  static async #getTotoroJson(): Promise<any> {
    const json = await Axios.get(TotoroCacheContainer.#URL);
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
      Log.error(`TotoroCacheContainer#parseRaw: Exception: ${exception}`);
      return [];
    }
  }
}
