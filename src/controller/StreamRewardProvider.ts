import { Logger } from '../model/common/logger/Logger';
import axios from 'axios';

export class StreamRewardProvider {
  #logger = new Logger('StreamRewardProvider');

  async requestStreamReward(hash: string, reward: number) {
    const host = process.env.SHOP_SERVER_HOST;
    const port = process.env.SHOP_SERVER_PORT;
    const url = `http://${host}:${port}/${hash}/reward/stream`;
    const form = { reward };
    const opt = { timeout: 5000, form };
    try {
      const { status } = await axios.post(url, opt);
      if (status !== 200) {
        this.#logger.log(`requestStreamReward: ${hash}/${reward}: SUCCESS`);
      }
    } catch {
      this.#logger.log(`requestStreamReward: ${hash}/${reward}: FAILED`);
    }
  }
}
