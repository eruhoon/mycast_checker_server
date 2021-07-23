import Axios from 'axios';
import * as dotenv from 'dotenv';

import { RawTotoroStream } from '../RawTotoroModel';
import { StreamCacheContainer } from './StreamCacheContainer';

export class TotoroCacheContainer extends StreamCacheContainer {
  private static readonly URL: string =
    'http://52.79.252.217:1985/api/v1/streams/';

  private mCaches: RawTotoroStream[];

  constructor() {
    super();
    dotenv.config();
    this.mCaches = [];
  }

  getCaches(): RawTotoroStream[] {
    return this.mCaches;
  }

  async update(): Promise<void> {
    const json = await TotoroCacheContainer.getTotoroJson();
    const newCaches = TotoroCacheContainer.parseRaw(json);
    this.mCaches = newCaches;
  }

  private static async getTotoroJson(): Promise<any> {
    const json = await Axios.get(TotoroCacheContainer.URL);
    return json.data;
  }

  private static parseRaw(rawJson: {
    streams: RawTotoroStream[];
  }): RawTotoroStream[] {
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
      console.error(`TotoroCacheContainer#parseRaw: Exception: ${exception}`);
      return [];
    }
  }
}
