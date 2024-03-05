import axios from 'axios';

export class VegaChatApi {
  readonly #url = 'https://mycast.xyz:8002';

  async getCurrentUsers(): Promise<VegaChatUser[]> {
    return (await axios.get(`${this.#url}/users`)) ?? [];
  }
}

type VegaChatUser = {
  idx: number;
  hash: string;
};
