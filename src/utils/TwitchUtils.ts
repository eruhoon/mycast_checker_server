import Axios from "axios";
import * as qs from "querystring";
import { ArrayUtils } from "../model/common/array/ArrayUtils";
import { Logger } from "../model/common/logger/Logger";

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

type RawTwitchBroadcastType = "parter" | "affiliate" | "";

type RawTwitchUserType = "staff" | "admin" | "global_mod" | "";

export class TwitchUtils {
    private static readonly sLogger = new Logger("TwitchUtils");

    public static async loadUser(loginIds: string[]): Promise<RawTwitchUser[]> {
        const accessToken = await this.getAccessToken();
        if (!accessToken) {
            this.sLogger.error("Invalid accessToken");
            return [];
        }
        const host = "https://api.twitch.tv/helix/users";
        const query = loginIds.map((k) => `login=${k}`).join("&");
        const url = `${host}?${query}`;
        try {
            const res = await Axios.get(url, {
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Client-ID": process.env.TWITCH_CLIENT_ID,
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
            this.sLogger.error("Invalid accessToken");
            return [];
        }
        const keywordChunks = ArrayUtils.chunk<string>(keywords, 100);
        const length = keywordChunks.length;
        let streams: RawTwitchStream[] = [];
        for (let i = 0; i < length; i++) {
            const result = await this.loadStreamInternal(keywords, accessToken);
            streams = streams.concat(result);
        }
        return streams;
    }

    private static async loadStreamInternal(
        keywords: string[],
        token: string
    ): Promise<RawTwitchStream[]> {
        const userQuery = keywords.map((k) => `user_login=${k}`).join("&");
        const query = `${userQuery}&first=100`;
        const host = "https://api.twitch.tv/helix/streams";
        const url = `${host}?${query}`;

        try {
            const res = await Axios.get(url, {
                timeout: 5000,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Client-ID": process.env.TWITCH_CLIENT_ID,
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
        const host = "https://id.twitch.tv/oauth2/token";
        const query = qs.stringify({
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_SECRET,
            grant_type: "client_credentials",
            scope: "user:read:email",
        });
        const url = `${host}?${query}`;
        try {
            const res = await Axios.post(url);
            return res.data.access_token;
        } catch (e) {
            this.sLogger.error(`getAccessToken: error: ${e}`);
            return null;
        }
    }

    private static decorateThumbnail(
        format: string,
        width: number,
        height: number
    ): string {
        let result = format
            .replace("{width}", width.toString())
            .replace("{height}", height.toString());
        result += "?" + new Date().getTime();
        return result;
    }
}
