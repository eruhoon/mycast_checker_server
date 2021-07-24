import * as request from 'request';
import { Logger } from '../model/common/logger/Logger';

export class StreamRewardProvider {
  #logger = new Logger('StreamRewardProvider');

  requestStreamReward(hash: string, reward: number) {
    const host = process.env.SHOP_SERVER_HOST;
    const port = process.env.SHOP_SERVER_PORT;
    const url = `http://${host}:${port}/${hash}/reward/stream`;
    const form = { reward };
    const opt = { timeout: 5000, form };
    request.post(url, opt, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        this.#logger.log(`requestStreamReward: ${hash}/${reward}: FAILED`);
      } else {
        this.#logger.log(`requestStreamReward: ${hash}/${reward}: SUCCESS`);
      }
    });
  }
}
