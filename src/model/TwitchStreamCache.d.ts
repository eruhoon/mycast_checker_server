import { RawTwitchStream, RawTwitchUser } from '../utils/TwitchUtils';

export type TwitchStreamCache = {
    keyword: string;
    user: RawTwitchUser | null;
    stream: RawTwitchStream | null;
};
