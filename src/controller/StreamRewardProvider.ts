import * as request from 'request';

export class StreamRewardProvider {

	public requestStreamReward(hash: string, reward: number) {
		console.log('StreamRewardProvider#requestStreamReward: ', hash, reward);
		let url = `http://mycast.xyz:9020/${hash}/reward/stream`;
		let form = { reward };
		let opt = { timeout: 5000, form };
		request.post(url, opt);

	}

}