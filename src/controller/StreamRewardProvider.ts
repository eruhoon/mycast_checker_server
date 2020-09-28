import * as request from 'request';

export class StreamRewardProvider {
    public requestStreamReward(hash: string, reward: number) {
        const TAG = 'StreamRewardProvider#requestStreamReward';
        const host = process.env.SHOP_SERVER_HOST;
        const port = process.env.SHOP_SERVER_PORT;
        const url = `http://${host}:${port}/${hash}/reward/stream`;
        const form = { reward };
        const opt = { timeout: 5000, form };
        request.post(url, opt, (err, res, body) => {
            if (err || res.statusCode !== 200) {
                console.log(`${TAG}: ${hash}/${reward}: FAILED`);
            } else {
                console.log(`${TAG}: ${hash}/${reward}: SUCCESS`);
            }
        });
    }
}
