import * as request from 'request';

export type RawTwitchUser = {
	broadcaster_type: RawTwitchBroadcastType,
	description: string,
	display_name: string,
	email: string,
	id: string,
	login: string,
	offline_image_url: string,
	profile_image_url: string,
	type: RawTwitchUserType,
	view_count: number
}

export type RawTwitchStream = {
	community_ids: string[],
	game_id: string,
	id: string,
	language: string,
	pagination: string,
	started_at: string,
	thumbnail_url: string,
	title: string,
	type: string,
	user_id: string,
	viewer_count: number
}

type RawTwitchBroadcastType = 'parter' | 'affiliate' | '';

type RawTwitchUserType = 'staff' | 'admin' | 'global_mod' | '';

export class TwitchUtils {

	public static loadUser(keywords: string[]): Promise<RawTwitchUser[]> {
		return new Promise((resolve, reject) => {
			const querystring = keywords.map(k => `login=${k}`).join('&');
			const url = `https://api.twitch.tv/helix/users?${querystring}`;
			const option = {
				timeout: 5000,
				json: true,
				headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID }
			}

			request.get(url, option, (err, res, body) => {
				if (err || res.statusCode !== 200 || !body) {
					console.error(`TwitchUtils#loadUser: Request Error: ${err}`);
					return;
				}
				let users: RawTwitchUser[] = body.data;
				resolve(users);
			});
		});
	}

	public static loadStream(keywords: string[]): Promise<RawTwitchStream[]> {
		return new Promise((resolve, reject) => {
			const querystring = keywords.map(k => `user_login=${k}`).join('&');
			const url = `https://api.twitch.tv/helix/streams?${querystring}`;
			const option = {
				timeout: 5000,
				json: true,
				headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID }
			}
			request.get(url, option, (err, res, body) => {
				if (err || res.statusCode !== 200 || !body) {
					console.error(`TwitchUtils#loadStream: Request Error: ${err}`);
					return;
				}

				let streams: RawTwitchStream[] = body.data;
				streams.forEach(s => {
					let format = s.thumbnail_url;
					s.thumbnail_url = this.decorateThumbnail(format, 200, 150);
				});
				resolve(streams);
			});
		});
	}

	private static decorateThumbnail(
		format: string, width: number, height: number): string {
		let result = format.replace('{width}', width.toString())
			.replace('{height}', height.toString());
		result += '?' + new Date().getTime();
		return result;

	}
}