import { TwitchStreamDto } from '../api/twitch/TwitchStreamDto';
import { TwitchUserDto } from '../api/twitch/TwitchUserDto';

export type TwitchStreamCache = {
  keyword: string;
  user: TwitchUserDto | null;
  stream: TwitchStreamDto | null;
};
