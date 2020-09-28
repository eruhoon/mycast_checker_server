import Axios from 'axios';
import * as qs from 'querystring';
import { TwitchTokenLoader } from '../api/twitch/TwitchTokenLoader';
import { ArrayUtils } from '../model/common/array/ArrayUtils';
import { Logger } from '../model/common/logger/Logger';

export type RawTwitchUser = {
    broadcaster_type: RawTwitchBroadcastType;
    description: string;
    display_name: string;
    email: string;
    id: string;
    login: string;
    offline_image_url: string;
    profile_image_url: string;
    type: RawTwitchUserType;
    view_count: number;
};

export type RawTwitchStream = {
    community_ids: string[];
    game_id: string;
    id: string;
    language: string;
    pagination: string;
    started_at: string;
    thumbnail_url: string;
    title: string;
    type: string;
    user_id: string;
    viewer_count: number;
};

type RawTwitchBroadcastType = 'parter' | 'affiliate' | '';

type RawTwitchUserType = 'staff' | 'admin' | 'global_mod' | '';

export class TwitchUtils {
    private static readonly sLogger = new Logger('TwitchUtils');

    public static async loadUser(loginIds: string[]): Promise<RawTwitchUser[]> {
        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            this.sLogger.error('Invalid accessToken');
            return [];
        }

        const idChunks = ArrayUtils.chunk<string>(loginIds, 100);
        const length = idChunks.length;
        let twitchUsers: RawTwitchUser[] = [];
        for (let i = 0; i < length; i++) {
            const chunk = idChunks[i];
            const result = await this.loadUserInternal(chunk, accessToken);
            twitchUsers = twitchUsers.concat(result);
        }
        return twitchUsers;
    }

    public static async loadUserInternal(
        loginIds: string[],
        accessToken: string
    ): Promise<RawTwitchUser[]> {
        const host = 'https://api.twitch.tv/helix/users';
        const query = loginIds.map((k) => `login=${k}`).join('&');
        const url = `${host}?${query}`;
        try {
            const res = await Axios.get(url, {
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                },
            });
            const users: RawTwitchUser[] = res.data.data;
            return users;
        } catch (e) {
            this.sLogger.error(`TwitchUtils#loadUser: Request Error: ${e}`);
            return [];
        }
    }

    public static async loadStream(
        keywords: string[]
    ): Promise<RawTwitchStream[]> {
        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            this.sLogger.error('Invalid accessToken');
            return [];
        }
        const keywordChunks = ArrayUtils.chunk<string>(keywords, 100);
        const length = keywordChunks.length;
        let streams: RawTwitchStream[] = [];
        for (let i = 0; i < length; i++) {
            const chunk = keywordChunks[i];
            const result = await this.loadStreamInternal(chunk, accessToken);
            streams = streams.concat(result);
        }
        return streams;
    }

    private static async loadStreamInternal(
        keywords: string[],
        token: string
    ): Promise<RawTwitchStream[]> {
        const userQuery = keywords.map((k) => `user_login=${k}`).join('&');
        const query = `${userQuery}&first=100`;
        const host = 'https://api.twitch.tv/helix/streams';
        const url = `${host}?${query}`;

        try {
            const res = await Axios.get(url, {
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                },
            });
            const streams: RawTwitchStream[] = res.data.data;
            streams.forEach((s) => {
                const format = s.thumbnail_url;
                s.thumbnail_url = this.decorateThumbnail(format, 200, 150);
            });
            return streams;
        } catch (e) {
            this.sLogger.error(`TwitchUtils#loadStream: Request Error: ${e}`);
            return [];
        }
    }

    private static async getAccessToken(): Promise<string | null> {
        const clientId = process.env.TWITCH_CLIENT_ID;
        const secretKey = process.env.TWITCH_SECRET;
        return await new TwitchTokenLoader(clientId, secretKey).load();
    }

    private static decorateThumbnail(
        format: string,
        width: number,
        height: number
    ): string {
        let result = format
            .replace('{width}', width.toString())
            .replace('{height}', height.toString());
        result += '?' + new Date().getTime();
        return result;
    }
}
