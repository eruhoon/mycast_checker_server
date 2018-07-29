import * as Mixer from 'beam-client-node';
import { StreamLoader, StreamLoaderCallback } from "./StreamLoader";
import { StreamInfo, StreamPlatform } from '../model/Stream';

export class MixerLoader extends StreamLoader {

	private mChannelName: string;

	public constructor(channelName: string) {
		super();
		this.mChannelName = channelName;
	}

	public requestInfo(callback: StreamLoaderCallback): void {

		const client = new Mixer.Client(new Mixer.DefaultRequestRunner());

		client.request('GET', `channels/${this.mChannelName}`).then(res => {
			let stream: MixerStream = <MixerStream>res.body;
			if (!stream.online) {
				return;
			}
			let user = stream.user;
			let username = stream.user.username;
			let icon = `https://mixer.com/api/v1/users/${user.id}/avatar?w=64&h=64`;
			let info: StreamInfo = {
				result: true,
				platform: StreamPlatform.MIXER,
				keyid: stream.user.username,
				icon: icon,
				nickname: stream.user.username,
				thumbnail: `https://thumbs.mixer.com/channel/${stream.id}.small.jpg?t=${new Date().getTime()}`,
				onair: stream.online,
				title: stream.name,
				description: stream.name,
				url: `https://mixer.com/embed/player/${username}?disableLowLatency=0`,
				viewer: stream.viewersCurrent,
			}
			callback(info);
		});
	}
}

type MixerStream = {
	id: number,
	online: boolean,
	name: string,
	viewersCurrent: number,
	description: string,
	thumbnail: string | null,
	user: {
		id: number,
		username: string,
		avatarUrl: string | null
	}
}