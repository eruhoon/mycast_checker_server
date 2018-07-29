import { StreamPlatform } from "./Stream";

export type UserRow = {
	idx: number,
	id: string,
	nickname: string,
	icon: string,
	broadcast_class: StreamPlatform,
	broadcast_bgimg: string,
	afreeca_id: string,
	daumpot_id: string,
	twitch_id: string,
	mixer_id: string
}

export type StreamRow = {
	keyword: string,
	platform: StreamPlatform
};