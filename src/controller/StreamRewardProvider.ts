import * as request from 'request';

export class StreamRewardProvider {

	public requestStreamReward(hash: string, reward: number) {
		console.log('StreamRewardProvider#requestStreamReward: ', hash, reward);
		let host = process.env.SHOP_SERVER_HOST;
		let port = process.env.SHOP_SERVER_PORT;
		let url = `http://${host}:${port}/${hash}/reward/stream`;
		let form = { reward };
		let opt = { timeout: 5000, form };
		request.post(url, opt);

	}

}